import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../../../shared/utils/api';

const SellerContext = createContext();

export const useSeller = () => {
  const context = useContext(SellerContext);
  if (!context) {
    const getStored = () => {
      try {
        const saved = localStorage.getItem('riddha_seller');
        if (!saved) return null;
        const parsed = JSON.parse(saved);
        return parsed?.role === 'seller' ? parsed : null;
      } catch {
        return null;
      }
    };
    const current = getStored();
    return {
      seller: current,
      user: current,
      setSeller: (data) => {
        if (data) localStorage.setItem('riddha_seller', JSON.stringify(data));
        else localStorage.removeItem('riddha_seller');
      },
      setUser: (data) => {
        if (data) localStorage.setItem('riddha_seller', JSON.stringify(data));
        else localStorage.removeItem('riddha_seller');
      },
      updateSeller: (fields) => {
        try {
          const cur = JSON.parse(localStorage.getItem('riddha_seller') || '{}');
          const updated = { ...cur, ...fields, role: 'seller' };
          localStorage.setItem('riddha_seller', JSON.stringify(updated));
        } catch {}
      },
      sellerLogin: (sellerData) => {
        if (!sellerData) return;
        const formatted = { ...sellerData, role: 'seller' };
        localStorage.setItem('riddha_seller', JSON.stringify(formatted));
      },
      login: (sellerData) => {
        if (!sellerData) return;
        const formatted = { ...sellerData, role: 'seller' };
        localStorage.setItem('riddha_seller', JSON.stringify(formatted));
      },
      sellerLogout: () => {
        localStorage.removeItem('riddha_seller');
      },
      logout: () => {
        localStorage.removeItem('riddha_seller');
      },
      isSellerLoggedIn: Boolean(current?.token && current?.role === 'seller'),
      loading: false,
      setLoading: () => {}
    };
  }
  return context;
};

export const SellerProvider = ({ children }) => {
  const [seller, setSeller] = useState(() => {
    const saved = localStorage.getItem('riddha_seller');
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      return parsed?.role === 'seller' ? parsed : null;
    } catch {
      localStorage.removeItem('riddha_seller');
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const isSellerLoggedIn = Boolean(seller?.token && seller?.role === 'seller');

  // Verify seller session on mount
  useEffect(() => {
    const syncSellerSession = async () => {
      const saved = localStorage.getItem('riddha_seller');
      if (!saved) return;

      let currentSeller;
      try {
        currentSeller = JSON.parse(saved);
      } catch {
        localStorage.removeItem('riddha_seller');
        setSeller(null);
        return;
      }

      if (!currentSeller?.token || currentSeller.role !== 'seller') return;

      try {
        const res = await api.get('/seller/profile', {
          headers: { Authorization: `Bearer ${currentSeller.token}` }
        });
        if (res.data?.success && res.data?.data) {
          const freshData = {
            ...currentSeller,
            ...res.data.data,
            token: currentSeller.token,
            role: 'seller'
          };
          setSeller(freshData);
          localStorage.setItem('riddha_seller', JSON.stringify(freshData));
        }
      } catch (err) {
        if (err?.response?.status === 401) {
          console.warn('[SellerContext] Seller session expired. Clearing seller credentials.');
          localStorage.removeItem('riddha_seller');
          setSeller(null);
        }
      }
    };

    syncSellerSession();
  }, []);

  const sellerLogin = useCallback((sellerData) => {
    if (!sellerData) return;
    const formatted = {
      ...sellerData,
      role: 'seller'
    };
    localStorage.setItem('riddha_seller', JSON.stringify(formatted));
    setSeller(formatted);
  }, []);

  const sellerLogout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('[SellerContext] Logout request error:', err.message);
    } finally {
      localStorage.removeItem('riddha_seller');
      setSeller(null);
    }
  }, []);

  const updateSeller = useCallback((updatedFields) => {
    setSeller((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem('riddha_seller', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const value = React.useMemo(() => ({
    seller,
    user: seller, // compatibility fallback for components referencing 'user'
    setSeller,
    setUser: setSeller, // compatibility fallback
    updateSeller,
    sellerLogin,
    login: sellerLogin, // compatibility fallback
    sellerLogout,
    logout: sellerLogout, // compatibility fallback
    isSellerLoggedIn,
    loading,
    setLoading
  }), [seller, isSellerLoggedIn, loading, sellerLogin, sellerLogout, updateSeller]);

  return (
    <SellerContext.Provider value={value}>
      {children}
    </SellerContext.Provider>
  );
};
