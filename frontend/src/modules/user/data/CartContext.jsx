import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../../shared/utils/api';
import { useUser } from './UserContext';

const CartContext = createContext();

// A cart line is identified by product + variant (variantId is null for products without variants)
const sameLine = (item, productId, variantId = null) =>
  (item._id || item.id) === productId && String(item.variantId || '') === String(variantId || '');

// Overlay the chosen variant's price / stock / image / sku onto the product so
// every cart view reads the right values from the item itself.
const applyVariant = (product, variant) => {
  if (!variant) return product;
  const images = variant.image
    ? [variant.image, ...(product.images || []).filter(img => img !== variant.image)]
    : product.images;
  return {
    ...product,
    price: variant.price || product.price,
    discountPrice: variant.discountPrice,
    countInStock: variant.countInStock,
    sku: variant.sku || product.sku,
    images,
    variantId: variant._id,
    variantAttributes: variant.attributes || {},
  };
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { isLoggedIn, user } = useUser();
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

  // Sync with backend if logged in as user (only on customer storefront)
  useEffect(() => {
    const isPortal = typeof window !== 'undefined' && (
      window.location.pathname.startsWith('/seller') ||
      window.location.pathname.startsWith('/admin') ||
      window.location.pathname.startsWith('/delivery')
    );
    if (!isPortal && isLoggedIn && user?.role === 'user') {
      fetchCart();
    }
  }, [isLoggedIn, user]);

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
          .map(item => {
            const variant = item.variantId
              ? (item.product.variants || []).find(v => String(v._id) === String(item.variantId))
              : null;
            return {
              ...applyVariant(item.product, variant),
              variantId: item.variantId || null,
              quantity: item.quantity,
              _id: item.product._id // Ensure _id is clear
            };
          });
        setCart(mappedCart);
      }
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    } finally {
      setLoading(false);
    }
  };

  // Regular (non-enterprise) B2C customers can be capped per-product via
  // Product.maxB2CQty; enterprise buyers use the RFQ/B2B pricing flow instead
  // and are exempt. Returns null when the requested quantity is fine to apply,
  // or { capped: true, maxQty } when the caller should offer a Bulk Order
  // Request instead of applying the quantity.
  const checkQtyCap = (product, quantity) => {
    if (user?.userType === 'enterpriser') return null;
    const maxQty = product?.maxB2CQty;
    if (maxQty && quantity > maxQty) {
      return { capped: true, maxQty };
    }
    return null;
  };

  // `variant` is the selected entry of product.variants; required for products that have variants.
  const addToCart = async (product, quantity = 1, variant = null) => {
    const productId = product._id || product.id;

    if (!variant && product.variantId) {
      // Caller passed a cart item that already carries its variant
      variant = (product.variants || []).find(v => String(v._id) === String(product.variantId)) || null;
    }
    if (!variant && product.variants?.length > 0) {
      toast.error('Please choose a variant (e.g. colour) on the product page first.');
      return { capped: false, needsVariant: true };
    }
    const variantId = variant ? variant._id : null;

    // Check if already in local cart for optimistic update
    const itemIndex = cart.findIndex(item => sameLine(item, productId, variantId));

    if (itemIndex > -1) {
      // If already exists, use updateQuantity logic
      const existingItem = cart[itemIndex];
      return updateQuantity(productId, existingItem.quantity + quantity, variantId);
    }

    const capResult = checkQtyCap(product, quantity);
    if (capResult) return capResult;

    // Add new item optimistically
    setCart(prev => [...prev, { ...applyVariant(product, variant), quantity, _id: productId }]);

    if (isLoggedIn) {
      try {
        const response = await api.post('/cart', { productId, quantity, variantId });
        if (response.data.success) {
          // refresh cart from server to get accurate data and populated fields
          fetchCart();
        }
      } catch (err) {
        console.error('Failed to add to cart on backend:', err);
        // Revert optimistic if needed, but usually we just let it be
      }
    }
    return { capped: false };
  };

  const removeFromCart = async (productId, variantId = null) => {
    setCart(prev => prev.filter(item => !sameLine(item, productId, variantId)));

    if (isLoggedIn) {
      try {
        await api.delete(`/cart/${productId}`, { params: variantId ? { variantId } : {} });
      } catch (err) {
        console.error('Failed to remove from cart on backend:', err);
      }
    }
  };

  const updateQuantity = async (productId, quantity, variantId = null) => {
    if (quantity < 1) {
      removeFromCart(productId, variantId);
      return { capped: false };
    }

    const existingItem = cart.find(item => sameLine(item, productId, variantId));
    const capResult = existingItem ? checkQtyCap(existingItem, quantity) : null;
    if (capResult) return capResult;

    // Local update
    setCart(prev =>
      prev.map(item =>
        sameLine(item, productId, variantId) ? { ...item, quantity } : item
      )
    );

    if (isLoggedIn) {
      try {
        await api.put(`/cart/${productId}`, { quantity }, { params: variantId ? { variantId } : {} });
      } catch (err) {
        if (err.response && err.response.status === 404) {
           console.warn('Item not found in backend cart, attempting to add it...');
           // If update fails with 404, it might be a race condition. Try adding it.
           await api.post('/cart', { productId, quantity, variantId });
        } else {
           console.error('Failed to update quantity on backend:', err);
        }
      }
    }
    return { capped: false };
  };

  // With a variantId: that exact line. Without: the total across all variants of the product.
  const getItemQuantity = (productId, variantId) => {
    if (variantId !== undefined) {
      const item = cart.find(item => sameLine(item, productId, variantId));
      return item ? item.quantity : 0;
    }
    return cart
      .filter(item => (item._id || item.id) === productId)
      .reduce((sum, item) => sum + item.quantity, 0);
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
            variantId: item.variantId || undefined,
            quantity: item.quantity
          })),
          userType: user?.userType
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
    cartCount: cart.reduce((sum, item) => sum + item.quantity, 0),
  }), [cart, loading, cartTotal, pricingBreakdown]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};
