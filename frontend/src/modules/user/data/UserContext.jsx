import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../../../shared/utils/api';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('riddha_user');
    return savedUser ? JSON.parse(savedUser) : null;
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

      try {
        const res = await api.get('/auth/me');
        if (res.data.success && res.data.user) {
          setUser({
            ...currentUser,
            ...res.data.user,
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
    if (user) {
      const key = user.role === 'seller' ? 'riddha_seller' : user.role === 'admin' ? 'riddha_admin' : user.role === 'delivery' ? 'riddha_delivery' : 'riddha_user';
      localStorage.setItem(key, JSON.stringify(user));
      setIsLoggedIn(true);
      if (user.role === 'user' || user.role === 'customer' || !user.role) {
        fetchAddresses();
      }
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
    const key = userData?.role === 'seller' ? 'riddha_seller' : userData?.role === 'admin' ? 'riddha_admin' : userData?.role === 'delivery' ? 'riddha_delivery' : 'riddha_user';
    localStorage.setItem(key, JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('[UserContext] Failed to call API logout:', err.message);
    } finally {
      const key = user?.role === 'seller' ? 'riddha_seller' : user?.role === 'admin' ? 'riddha_admin' : user?.role === 'delivery' ? 'riddha_delivery' : 'riddha_user';
      localStorage.removeItem(key);
      setUser(null);
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
