import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../../../shared/utils/api';
import { useUser } from './UserContext';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { isLoggedIn } = useUser();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load from localStorage initially
  useEffect(() => {
    const savedCart = localStorage.getItem('riddha_cart');
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        // Self-heal: remove items that don't have a valid ID
        const validCart = parsed.filter(item => item && (item._id || item.id));
        setCart(validCart);
      } catch (e) {
        console.error('Failed to parse cart from local storage', e);
      }
    }
  }, []);

  // Sync with backend if logged in
  useEffect(() => {
    if (isLoggedIn) {
      fetchCart();
    }
  }, [isLoggedIn]);

  // Always persist local cart as fallback
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('riddha_cart', JSON.stringify(cart));
    }
  }, [cart]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await api.get('/cart');
      if (response.data.success) {
        // Map backend structure (product object) to frontend structure
        const mappedCart = response.data.data.items
          .filter(item => item.product != null)
          .map(item => ({
            ...item.product,
            quantity: item.quantity,
            _id: item.product._id // Ensure _id is clear
          }));
        setCart(mappedCart);
      }
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (product, quantity = 1) => {
    const productId = product._id || product.id;
    
    // Check if already in local cart for optimistic update
    const itemIndex = cart.findIndex(item => (item._id || item.id) === productId);
    
    if (itemIndex > -1) {
      // If already exists, use updateQuantity logic
      const existingItem = cart[itemIndex];
      updateQuantity(productId, existingItem.quantity + quantity);
    } else {
      // Add new item optimistically
      setCart(prev => [...prev, { ...product, quantity, _id: productId }]);

      if (isLoggedIn) {
        try {
          const response = await api.post('/cart', { productId, quantity });
          if (response.data.success) {
            // refresh cart from server to get accurate data and populated fields
            fetchCart();
          }
        } catch (err) {
          console.error('Failed to add to cart on backend:', err);
          // Revert optimistic if needed, but usually we just let it be
        }
      }
    }
  };

  const removeFromCart = async (productId) => {
    setCart(prev => prev.filter(item => (item._id || item.id) !== productId));

    if (isLoggedIn) {
      try {
        await api.delete(`/cart/${productId}`);
      } catch (err) {
        console.error('Failed to remove from cart on backend:', err);
      }
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }

    // Local update
    setCart(prev =>
      prev.map(item =>
        (item._id || item.id) === productId ? { ...item, quantity } : item
      )
    );

    if (isLoggedIn) {
      try {
        await api.put(`/cart/${productId}`, { quantity });
      } catch (err) {
        if (err.response && err.response.status === 404) {
           console.warn('Item not found in backend cart, attempting to add it...');
           // If update fails with 404, it might be a race condition. Try adding it.
           await api.post('/cart', { productId, quantity });
        } else {
           console.error('Failed to update quantity on backend:', err);
        }
      }
    }
  };

  const getItemQuantity = (productId) => {
    const item = cart.find(item => (item._id || item.id) === productId);
    return item ? item.quantity : 0;
  };

  const clearCart = async () => {
    setCart([]);
    localStorage.removeItem('riddha_cart');
    if (isLoggedIn) {
      try {
        await api.delete('/cart');
      } catch (err) {
        console.error('Failed to clear cart on backend:', err);
      }
    }
  };

  const [pricingBreakdown, setPricingBreakdown] = useState({
    subtotal: 0,
    discountAmount: 0,
    taxAmount: 0,
    shippingPrice: 0,
    totalPrice: 0
  });

  useEffect(() => {
    const calculatePricing = async () => {
      if (cart.length === 0) {
        setPricingBreakdown({
          subtotal: 0,
          discountAmount: 0,
          taxAmount: 0,
          shippingPrice: 0,
          totalPrice: 0
        });
        return;
      }
      try {
        const validItems = cart.filter(item => item && (item._id || item.id));
        if (validItems.length === 0) {
          setPricingBreakdown({
            subtotal: 0,
            discountAmount: 0,
            taxAmount: 0,
            shippingPrice: 0,
            totalPrice: 0
          });
          return;
        }

        const payload = {
          orderItems: validItems.map(item => ({
            product: item._id || item.id,
            quantity: item.quantity
          }))
        };
        const response = await api.post('/orders/calculate-pricing', payload);
        if (response.data.success) {
          setPricingBreakdown(response.data.data);
        }
      } catch (err) {
        console.error('Failed to calculate pricing breakdown:', err);
      }
    };

    calculatePricing();
  }, [cart]);

  const cartTotal = pricingBreakdown.totalPrice;

  const contextValue = React.useMemo(() => ({
    cart,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    getItemQuantity,
    clearCart,
    cartTotal,
    pricingBreakdown,
    cartCount: cart.length,
  }), [cart, loading, cartTotal, pricingBreakdown]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};
