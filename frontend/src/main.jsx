import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { CartProvider } from './modules/user/data/CartContext'
import { WishlistProvider } from './modules/user/data/WishlistContext'
import { UserProvider } from './modules/user/data/UserContext'
import { SellerProvider } from './modules/seller/data/SellerContext'
import { NotificationProvider } from './modules/user/data/NotificationContext'
import './index.css'
import App from './App.jsx'

// After a new deploy, hashed chunk files from the old build disappear. A tab still running the
// old build then fails to load a lazy page. Reload once to pick up the new build.
const reloadOnce = () => {
  try {
    const last = Number(sessionStorage.getItem('chunk-reload-at') || 0);
    if (Date.now() - last < 10000) return false; // already tried just now; avoid reload loop
    sessionStorage.setItem('chunk-reload-at', String(Date.now()));
  } catch { /* ignore */ }
  window.location.reload();
  return true;
};
window.addEventListener('vite:preloadError', (e) => {
  e.preventDefault();
  reloadOnce();
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <UserProvider>
        <SellerProvider>
          <CartProvider>
            <WishlistProvider>
              <NotificationProvider>
                <App />
              </NotificationProvider>
            </WishlistProvider>
          </CartProvider>
        </SellerProvider>
      </UserProvider>
    </BrowserRouter>
  </StrictMode>,
)
