import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../../../shared/utils/api';
import { useUser } from './UserContext';

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const { isLoggedIn, user } = useUser();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!isLoggedIn || ['seller', 'admin', 'delivery'].includes(user?.role)) {
      setWishlistItems([]);
      return;
    }
    
    try {
      setLoading(true);
      const res = await api.get('/wishlist');
      if (res.data.success) {
        setWishlistItems(res.data.data); // Array of populated products
      }
    } catch (error) {
      console.error('Failed to fetch wishlist', error);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, user]);

  // Load wishlist when login status changes
  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const addToWishlist = async (product) => {
    if (!isLoggedIn) {
      alert('Please login to add items to your wishlist');
      return;
    }

    const productId = product._id || product.id;
    
    // Optimistic UI update
    setWishlistItems((prev) => {
      if (prev.find((item) => (item._id || item.id) === productId)) return prev;
      return [...prev, product];
    });

    try {
      await api.post(`/wishlist/${productId}`);
    } catch (error) {
      console.error('Failed to add to wishlist API', error);
      // Revert optimistic update on failure
      fetchWishlist();
    }
  };

  const removeFromWishlist = async (productId) => {
    if (!isLoggedIn) return;

    // Optimistic UI update
    setWishlistItems((prev) => prev.filter((item) => (item._id || item.id) !== productId));

    try {
      await api.delete(`/wishlist/${productId}`);
    } catch (error) {
      console.error('Failed to remove from wishlist API', error);
      // Revert optimistic update on failure
      fetchWishlist();
    }
  };

  const isInWishlist = (productId) => {
    return wishlistItems.some((item) => (item._id || item.id) === productId);
  };

  const toggleWishlist = (product) => {
    const productId = product._id || product.id;
    if (isInWishlist(productId)) {
      removeFromWishlist(productId);
    } else {
      addToWishlist(product);
    }
  };

  const contextValue = React.useMemo(() => ({ 
    wishlistItems, 
    loading,
    addToWishlist, 
    removeFromWishlist, 
    isInWishlist,
    toggleWishlist 
  }), [wishlistItems, loading]);

  return (
    <WishlistContext.Provider value={contextValue}>
      {children}
    </WishlistContext.Provider>
  );
};
