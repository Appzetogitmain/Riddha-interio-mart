import React, { createContext, useContext, useState, useEffect } from 'react';
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

  // Sync session on mount (unified session validation)
  useEffect(() => {
    const syncSession = async () => {
      const savedUser = localStorage.getItem('riddha_user');
      if (savedUser) {
        try {
          const currentUser = JSON.parse(savedUser);
          const res = await api.get('/auth/me');
          if (res.data.success && res.data.user) {
            setUser({
              ...currentUser,
              ...res.data.user,
              token: currentUser.token
            });
          }
        } catch (err) {
          console.error('[UserContext] Session sync failed. Clearing profile.');
          setUser(null);
        }
      }
    };
    syncSession();
  }, []);

  // Sync user state with localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('riddha_user', JSON.stringify(user));
      setIsLoggedIn(true);
      if (user.role === 'user') {
        fetchAddresses();
      }
    } else {
      localStorage.removeItem('riddha_user');
      setIsLoggedIn(false);
      setAddress(null);
    }
  }, [user]);

  const fetchAddresses = async () => {
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
  };

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
  }), [user, loading, isLoggedIn, address, addresses]);

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};
