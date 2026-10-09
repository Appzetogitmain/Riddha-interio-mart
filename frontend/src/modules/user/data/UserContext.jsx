import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../../../shared/utils/api';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    console.warn('[UserContext] useUser called outside of UserProvider. Providing safe fallback.');
    return {
      user: null,
      loading: false,
      setLoading: () => {},
      isLoggedIn: false,
      address: null,
      addresses: [],
      login: () => {},
      logout: () => {},
      saveAddress: async () => false,
      updateAddress: async () => false,
      deleteAddress: async () => false,
      fetchAddresses: async () => {},
      setUser: () => {}
    };
  }
  return context;
};

const isCustomerRole = (role) => {
  if (!role) return true;
  return role === 'user' || role === 'customer';
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('riddha_user');
    if (!savedUser) return null;
    try {
      const parsed = JSON.parse(savedUser);
      if (!isCustomerRole(parsed?.role)) {
        localStorage.removeItem('riddha_user');
        return null;
      }
      return parsed;
    } catch {
      localStorage.removeItem('riddha_user');
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!user);
  const [address, setAddress]     = useState(null);
  const [addresses, setAddresses] = useState([]);

  // Sync session on mount — validate the stored token; do NOT log out on
  // transient network errors or 5xx failures. Only log out on a hard 401
  // that survives a token-refresh attempt.
  useEffect(() => {
    const syncSession = async () => {
      const isPortal = typeof window !== 'undefined' && (
        window.location.pathname.startsWith('/seller') ||
        window.location.pathname.startsWith('/admin') ||
        window.location.pathname.startsWith('/delivery')
      );
      if (isPortal) return;

      const savedUser = localStorage.getItem('riddha_user');
      if (!savedUser) return;

      let currentUser;
      try {
        currentUser = JSON.parse(savedUser);
      } catch {
        // Corrupted localStorage entry — clear it silently
        localStorage.removeItem('riddha_user');
        setUser(null);
        return;
      }

      if (!isCustomerRole(currentUser?.role)) {
        localStorage.removeItem('riddha_user');
        setUser(null);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        if (res.data.success && res.data.user) {
          const freshData = res.data.user;
          // Session isolation: ensure the active session from cookie/token is actually a customer!
          if (!isCustomerRole(freshData.role)) {
            console.info('[UserContext] Skipping customer session sync: returned role is', freshData.role, 'which belongs to another portal.');
            return;
          }
          setUser({
            ...currentUser,
            ...freshData,
            token: currentUser.token
          });
        }
      } catch (err) {
        const status = err?.response?.status;

        // Only clear the session on a definitive 401 that the api interceptor
        // could NOT recover via silent token refresh (the interceptor already
        // tries /auth/refresh before rejecting with 401).  Do NOT log out on
        // network failures (status undefined) or server errors (5xx) because
        // those are transient — the user is still legitimately logged in.
        if (status === 401) {
          console.warn('[UserContext] Session is no longer valid. Clearing stored profile.');
          localStorage.removeItem('riddha_user');
          setUser(null);
        } else {
          // Transient error (network down, 5xx, etc.) — keep the user logged in
          // so they are not bounced out every time the server hiccups.
          console.warn('[UserContext] Session sync encountered a transient error. Keeping session.', err?.message);
        }
      }
    };
    syncSession();
  }, []);

  // Sync user state with localStorage
  useEffect(() => {
    if (user && isCustomerRole(user.role)) {
      localStorage.setItem('riddha_user', JSON.stringify(user));
      setIsLoggedIn(true);
      fetchAddresses();
    } else {
      localStorage.removeItem('riddha_user');
      setIsLoggedIn(false);
      setAddress(null);
    }
  }, [user]);

  const fetchAddresses = useCallback(async () => {
    try {
      const res = await api.get('/address');
      if (res.data.success) {
        const all = res.data.data || [];
        setAddresses(all);
        const defaultAddr = all.find(a => a.isDefault) || all[0] || null;
        setAddress(defaultAddr);
      }
    } catch (err) {
      console.error('Failed to fetch addresses:', err);
    }
  }, []);

  const saveAddress = async (addressData) => {
    try {
      setLoading(true);
      const res = await api.post('/address', { ...addressData, isDefault: true });
      if (res.data.success) {
        await fetchAddresses();
        return true;
      }
    } catch (err) {
      console.error('Failed to save address:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateAddress = async (id, addressData) => {
    try {
      setLoading(true);
      const res = await api.put(`/address/${id}`, addressData);
      if (res.data.success) {
        await fetchAddresses();
        return true;
      }
    } catch (err) {
      console.error('Failed to update address:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteAddress = async (id) => {
    try {
      const res = await api.delete(`/address/${id}`);
      if (res.data.success) {
        await fetchAddresses();
        return true;
      }
    } catch (err) {
      console.error('Failed to delete address:', err);
      return false;
    }
  };

  const login = (userData) => {
    if (!userData) return;
    if (!isCustomerRole(userData.role)) {
      // Non-customer roles (seller, admin, delivery) write to their isolated storage
      const key = userData.role === 'seller' ? 'riddha_seller' : userData.role === 'admin' ? 'riddha_admin' : 'riddha_delivery';
      localStorage.setItem(key, JSON.stringify(userData));
      return;
    }
    localStorage.setItem('riddha_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('[UserContext] Failed to call API logout:', err.message);
    } finally {
      localStorage.removeItem('riddha_user');
      setUser(null);
      setIsLoggedIn(false);
      setAddress(null);
      setAddresses([]);
    }
  };

  const contextValue = React.useMemo(() => ({
    user,
    loading,
    setLoading,
    isLoggedIn,
    address,
    addresses,
    login,
    logout,
    saveAddress,
    updateAddress,
    deleteAddress,
    fetchAddresses,
    setUser
  }), [user, loading, isLoggedIn, address, addresses, fetchAddresses]);

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};
