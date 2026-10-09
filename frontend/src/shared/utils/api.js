import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`,
  withCredentials: true
});

const safeJsonParse = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const getStoredAuthKey = (config = {}) => {
  if (config?.authKey) return config.authKey;

  const url = String(config?.url || '');
  const pathname = typeof window !== 'undefined' ? (window.location.pathname || '') : '';

  // 1. Admin Portal or Admin API endpoints ALWAYS take top priority
  // Checking /admin first ensures admin routes like /auth/admin/sellers/pending use riddha_admin
  if (pathname.startsWith('/admin') || url.includes('/admin')) {
    return 'riddha_admin';
  }

  // 2. Seller Portal or Seller API endpoints
  if (pathname.startsWith('/seller') || url.includes('/seller')) {
    return 'riddha_seller';
  }

  // 3. Delivery Portal or Delivery API endpoints
  if (pathname.startsWith('/delivery') || url.includes('/delivery')) {
    return 'riddha_delivery';
  }

  // 4. Cart, Wishlist, User routes or Customer Portal
  if (url.startsWith('/cart') || url.startsWith('/wishlist') || url.startsWith('/user')) {
    return 'riddha_user';
  }

  return 'riddha_user';
};

const getStoredAuth = (config = {}) => {
  const storageKey = getStoredAuthKey(config);
  
  let parsed = safeJsonParse(localStorage.getItem(storageKey));

  // Fallback for admin or seller if session was previously stored in riddha_user with matching role
  if (!parsed || (!parsed.token && !parsed.user?.token)) {
    if (storageKey === 'riddha_admin') {
      const legacy = safeJsonParse(localStorage.getItem('riddha_user'));
      if (legacy && (legacy.role === 'admin' || legacy.role === 'superadmin' || legacy.user?.role === 'admin' || legacy.user?.role === 'superadmin')) {
        parsed = legacy;
      }
    } else if (storageKey === 'riddha_seller') {
      const legacy = safeJsonParse(localStorage.getItem('riddha_user'));
      if (legacy && (legacy.role === 'seller' || legacy.user?.role === 'seller')) {
        parsed = legacy;
      }
    }
  }

  if (!parsed || typeof parsed !== 'object') return null;

  if (typeof parsed.token === 'string') return parsed;

  if (parsed.user && typeof parsed.user.token === 'string') {
    return {
      ...parsed.user,
      role: parsed.role || parsed.user.role,
      token: parsed.user.token
    };
  }

  return parsed;
};

const isPublicAuthRoute = (url) => {
  return (
    url.includes('/login') ||
    url.includes('/register') ||
    url.includes('/forgot-password') ||
    url.includes('/reset-password') ||
    url.includes('/verify-email') ||
    url.includes('/send-otp') ||
    url.includes('/verify-otp') ||
    url.includes('/refresh')
  );
};

const isPublicRequest = (config) => {
  const method = (config.method || 'get').toLowerCase();
  const url = String(config.url || '');

  if (isPublicAuthRoute(url)) return true;

  if (
    method === 'get' &&
    (url.startsWith('/home-banner') ||
      url.startsWith('/promo-banner') ||
      url.startsWith('/favourite-section') ||
      url.startsWith('/sections') ||
      url.startsWith('/products') ||
      url.startsWith('/categories') ||
      url.startsWith('/brands') ||
      url.startsWith('/catalog'))
  ) {
    return true;
  }

  if (method === 'post' && url.startsWith('/orders/calculate-pricing')) {
    return true;
  }

  return false;
};

const resolveLoginPath = (pathname = '') => {
  if (pathname.startsWith('/admin')) return '/admin/login';
  if (pathname.startsWith('/seller')) return '/seller/login';
  if (pathname.startsWith('/delivery')) return '/delivery/login';
  return '/login';
};

let isRefreshing = false;
let failedQueue = [];
let _isRedirectingToLogin = false; // guard: only redirect once even if many 401s fire

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Add a request interceptor to add the auth token to every request
api.interceptors.request.use(
  (config) => {
    const user = getStoredAuth(config);
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    
    // 1. Exponential retry logic for network errors and transient 5xx errors
    if (config && (!error.response || (error.response.status >= 500 && error.response.status <= 504))) {
      // Never retry telemetry, journey tracking, or analytics requests
      if (config.url?.includes('/journey/') || config.url?.includes('/analytics/') || config.skipRetry) {
        return Promise.reject(error);
      }

      config.__retryCount = config.__retryCount || 0;
      
      const MAX_RETRIES = 3;
      if (config.__retryCount < MAX_RETRIES) {
        config.__retryCount += 1;
        const delay = config.__retryCount * 1500;
        
        console.warn(`[Network Retry] Transient error on ${config.url}. Retry attempt #${config.__retryCount} in ${delay}ms...`);
        
        // Wait for exponential delay and retry request
        await new Promise((resolve) => setTimeout(resolve, delay));
        return api(config);
      }
    }

    // 2. Authentication 401 redirect and refresh logic
    if (error?.response?.status === 401 && config && !config._retry && typeof window !== 'undefined') {
      const wasPublic = isPublicRequest(config);
      const targetStorageKey = getStoredAuthKey(config);
      
      if (!wasPublic) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              config.headers.Authorization = `Bearer ${token}`;
              return api(config);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        config._retry = true;
        isRefreshing = true;

        return new Promise((resolve, reject) => {
          console.log('[API Interceptor] Access token expired. Attempting silent token refresh...');
          axios.post(
            `${api.defaults.baseURL}/auth/refresh`,
            {},
            { withCredentials: true }
          )
            .then((refreshRes) => {
              if (refreshRes.data && refreshRes.data.success) {
                const { token, user } = refreshRes.data;
                const currentAuth = safeJsonParse(localStorage.getItem(targetStorageKey)) || {};
                const updatedAuth = {
                  ...currentAuth,
                  ...user,
                  token: token || currentAuth.token
                };
                localStorage.setItem(targetStorageKey, JSON.stringify(updatedAuth));
                
                processQueue(null, token);
                if (token) {
                  config.headers.Authorization = `Bearer ${token}`;
                }
                _isRedirectingToLogin = false; // reset guard on successful refresh
                resolve(api(config));
              } else {
                throw new Error("Token refresh response success is false");
              }
            })
            .catch((refreshErr) => {
              console.error('[API Interceptor] Token refresh failed or session expired. Logging out role:', targetStorageKey);
              processQueue(refreshErr, null);
              
              localStorage.removeItem(targetStorageKey);
              const path = window.location.pathname || '';
              const loginPath = resolveLoginPath(path);
              
              if (path !== loginPath && !_isRedirectingToLogin) {
                _isRedirectingToLogin = true;
                window.location.assign(loginPath);
              }
              reject(refreshErr);
            })
            .finally(() => {
              isRefreshing = false;
            });
        });
      } else {
        // Public route got a 401 — this is normal (e.g. expired cookie on a GET).
        // Do NOT clear localStorage here; the UserContext syncSession handles cleanup
        // only after a full refresh attempt has also failed.
        console.warn('[API Interceptor] Public route returned 401. Ignoring — no session to clear.');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
