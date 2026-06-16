import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FiHome, FiGrid, FiShoppingCart, FiUser } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../models/CartContext';

const BottomNavbar = () => {
  const { cartCount } = useCart();

  const location = useLocation();
  const hideOnRoutes = ['/cart', '/address', '/payment'];
  const shouldHide = hideOnRoutes.includes(location.pathname);

  const [isKeyboardVisible, setIsKeyboardVisible] = React.useState(false);

  React.useEffect(() => {
    const handleFocusIn = () => {
      setTimeout(() => {
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
          setIsKeyboardVisible(true);
        }
      }, 50);
    };

    const handleFocusOut = () => {
      setIsKeyboardVisible(false);
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  if (shouldHide || isKeyboardVisible) return null;

  const navItems = [
    { name: 'Home', path: '/', icon: FiHome },
    { name: 'Categories', path: '/categories', icon: FiGrid },
    { name: 'Cart', path: '/cart', icon: FiShoppingCart, badge: cartCount },
    { name: 'Profile', path: '/profile', icon: FiUser },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40">
      <div className="bg-white/95 backdrop-blur-2xl border-t border-soft-oatmeal/20 shadow-[0_-8px_30px_rgb(0,0,0,0.05)] px-6 py-3 pb-6 flex justify-between items-center transition-all duration-500">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-1.5 group transition-all duration-300 ${
                isActive ? 'text-warm-sand' : 'text-deep-espresso/40 hover:text-deep-espresso/60'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <motion.div
                    animate={isActive ? { scale: 1.15, y: -2 } : { scale: 1, y: 0 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <item.icon className="h-6 w-6 transition-all duration-300" />
                  </motion.div>
                  
                  <AnimatePresence>
                    {item.badge > 0 && (
                      <motion.span 
                        initial={{ scale: 0, opacity: 0, y: 5 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0, opacity: 0, y: 5 }}
                        className="absolute -top-2.5 -right-2.5 bg-warm-sand text-white text-[9px] font-black h-5 w-5 flex items-center justify-center rounded-full shadow-[0_4px_12px_rgba(114,47,55,0.4)] border-2 border-white"
                      >
                        {item.badge}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                
                <span className={`text-[8px] font-black uppercase tracking-[0.15em] transition-all duration-300 leading-none mt-1 ${
                  isActive ? 'text-warm-sand translate-y-0.5' : 'text-deep-espresso/40 translate-y-0.5'
                }`}>
                  {item.name}
                </span>

                {isActive && (
                  <motion.div
                    layoutId="active-nav-glow"
                    className="absolute -bottom-2 w-8 h-1 bg-warm-sand/20 blur-md rounded-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavbar;
