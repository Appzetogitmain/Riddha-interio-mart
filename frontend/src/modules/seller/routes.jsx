import React from 'react';
import { Routes, Route } from 'react-router-dom';
import SellerLayout from './components/SellerLayout';
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const BrowseCatalog = React.lazy(() => import('./pages/BrowseCatalog'));
const AddProduct = React.lazy(() => import('./pages/AddProduct'));
const MyProducts = React.lazy(() => import('./pages/MyProducts'));
const Orders = React.lazy(() => import('./pages/Orders'));
const AssignDeliveryBoy = React.lazy(() => import('./pages/AssignDeliveryBoy'));
const Taxes = React.lazy(() => import('./pages/Taxes'));
const StockManagement = React.lazy(() => import('./pages/StockManagement'));
const Wallet = React.lazy(() => import('./pages/Wallet'));
const SalesReport = React.lazy(() => import('./pages/SalesReport'));
const ReturnOrders = React.lazy(() => import('./pages/ReturnOrders'));
const OrderDetail = React.lazy(() => import('./pages/OrderDetail'));
const SellerLogin = React.lazy(() => import('./pages/SellerLogin'));
const SellerLoginForm = React.lazy(() => import('./pages/SellerLoginForm'));
const SellerSignup = React.lazy(() => import('./pages/SellerSignup'));
const SellerProfile = React.lazy(() => import('./pages/SellerProfile'));
const OrderTracking = React.lazy(() => import('./pages/OrderTracking'));
const Notifications = React.lazy(() => import('./pages/Notifications'));
const BulkProductUpload = React.lazy(() => import('./pages/BulkProductUpload'));
const SellerJoin = React.lazy(() => import('./pages/SellerJoin'));
const SellerReviews = React.lazy(() => import('./pages/Reviews'));
const Recommendation = React.lazy(() => import('./pages/Recommendation'));
const Customers = React.lazy(() => import('./pages/Customers'));
const Marketing = React.lazy(() => import('./pages/Marketing'));
const HelpCenter = React.lazy(() => import('./pages/HelpCenter'));
const SellerTerms = React.lazy(() => import('./pages/SellerTerms'));
const SellerBulkOrders = React.lazy(() => import('./pages/SellerBulkOrders'));

const SellerRoutes = () => {
  return (
    <Routes>
      <Route path="/join" element={<SellerJoin />} />
      <Route path="/login" element={<SellerLogin />} />
      <Route path="/login-form" element={<SellerLoginForm />} />
      <Route path="/signup" element={<SellerSignup />} />
      <Route path="/terms" element={<SellerTerms />} />
      <Route element={<SellerLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/orders/track" element={<OrderTracking />} />
        <Route path="/assign-delivery" element={<AssignDeliveryBoy />} />
        <Route path="/orders/:id" element={<OrderDetail />} />
        <Route path="/product/add" element={<AddProduct />} />
        <Route path="/add-product" element={<AddProduct />} />
        <Route path="/product/list" element={<MyProducts />} />
        <Route path="/my-products" element={<MyProducts />} />
        <Route path="/product/taxes" element={<Taxes />} />
        <Route path="/product/stock" element={<StockManagement />} />
        <Route path="/stock-management" element={<StockManagement />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/reports/sales" element={<SalesReport />} />
        <Route path="/return" element={<ReturnOrders />} />
        <Route path="/catalog" element={<BrowseCatalog />} />
        <Route path="/profile" element={<SellerProfile />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/reviews" element={<SellerReviews />} />
        <Route path="/bulk-upload" element={<BulkProductUpload />} />
        <Route path="/recommendations" element={<Recommendation />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/marketing" element={<Marketing />} />
        <Route path="/help" element={<HelpCenter />} />
        <Route path="/bulk-orders" element={<SellerBulkOrders />} />
      </Route>
    </Routes>
  );
};

export default SellerRoutes;
