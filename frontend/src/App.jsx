import React, { useState, useEffect, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import ErrorBoundary from './shared/components/ErrorBoundary';
import GlobalLoader from './shared/components/GlobalLoader';
import OfflineDetector from './shared/components/OfflineDetector';
import Navbar from './modules/user/components/Navbar';
import Footer from './modules/user/components/Footer';
import BottomNavbar from './modules/user/components/BottomNavbar';
const UserRoutes = React.lazy(() => import('./modules/user/routes'));
const AdminRoutes = React.lazy(() => import('./modules/admin/routes'));
const SellerRoutes = React.lazy(() => import('./modules/seller/routes'));
const DeliveryRoutes = React.lazy(() => import('./modules/delivery/routes'));
const ComingSoonRoutes = React.lazy(() => import('./modules/comingsoon/routes'));
import { Toaster } from 'react-hot-toast';
import PincodeModal from './modules/user/components/PincodeModal';
import DeliveryBar from './modules/user/components/DeliveryBar';
import UserNotifications from './modules/user/components/UserNotifications';
import AdminNotifications from './modules/admin/components/AdminNotifications';
import SellerNotifications from './modules/seller/components/SellerNotifications';
import { useUser } from './modules/user/data/UserContext';

function App() {
  const { user } = useUser();
  const [showPincodeModal, setShowPincodeModal] = useState(false);
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  const isSellerPath = location.pathname.startsWith('/seller');
  const isDeliveryPath = location.pathname.startsWith('/delivery');
  const isInitPath = location.pathname.includes('/splash') || location.pathname.includes('/onboarding');
  const isAuthPath = location.pathname === '/login' || location.pathname === '/signup' ||
    location.pathname === '/forgot-password' ||
    location.pathname.endsWith('/login') || location.pathname.endsWith('/signup') ||
    location.pathname.endsWith('/forgot-password') ||
    location.pathname.startsWith('/coming-soon');
  const isDashboardLayout = isAdminPath || isSellerPath || isDeliveryPath || isAuthPath || isInitPath;
  const isProductPage = location.pathname.startsWith('/product/') || location.pathname.startsWith('/products/');
  const isCheckoutPath = ['/cart', '/address', '/payment'].includes(location.pathname);

  useEffect(() => {
    // Clear splash session storage on fresh page load/refresh
    sessionStorage.removeItem('splashCompleted');
    
    // Check if pincode is set in localStorage
    const savedPincode = localStorage.getItem('userPincode');
    if (!savedPincode && !isDashboardLayout) {
      setShowPincodeModal(true);
    }
  }, [isDashboardLayout]);

  const handlePincodeComplete = () => {
    setShowPincodeModal(false);
  };

  return (
    <div className={`min-h-screen flex flex-col user-theme bg-white border-deep-espresso/5 ${(!isDashboardLayout && !isCheckoutPath && !isProductPage) ? 'pb-24 md:pb-0' : ''}`}>
      <Toaster position="top-center" reverseOrder={false} />
      <OfflineDetector />
      {showPincodeModal && <PincodeModal onComplete={handlePincodeComplete} />}

      {/* Global Notifications */}
      {user?.role === 'admin' ? (
        <AdminNotifications token={user.token || 'cookie'} />
      ) : user?.role === 'seller' ? (
        <SellerNotifications token={user.token || 'cookie'} />
      ) : (
        user && <UserNotifications token={user.token || 'cookie'} />
      )}

      {!isDashboardLayout && (
        <>
          {isProductPage ? (
            <>
              <div className="sticky top-0 z-50 shadow-sm">
                <Navbar />
              </div>
              <DeliveryBar />
            </>
          ) : (
            <div className={`sticky top-0 z-50 shadow-sm ${['/cart', '/address', '/payment', '/profile/edit'].includes(location.pathname) ? 'hidden md:block' : ''}`}>
              <Navbar />
              <DeliveryBar />
            </div>
          )}
        </>
      )}

      <main className="flex-grow">
        <ErrorBoundary>
          <Suspense fallback={<GlobalLoader />}>
            <Routes>
              <Route path="/admin/*" element={<AdminRoutes />} />
              <Route path="/seller/*" element={<SellerRoutes />} />
              <Route path="/delivery/*" element={<DeliveryRoutes />} />
              <Route path="/coming-soon/*" element={<ComingSoonRoutes />} />
              <Route path="/*" element={<UserRoutes />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      {!isDashboardLayout && <Footer />}
      {!isDashboardLayout && !isProductPage && <BottomNavbar />}
    </div>
  );
}

export default App;
