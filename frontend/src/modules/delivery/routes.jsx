import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DeliveryLayout from './components/DeliveryLayout';
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Orders = React.lazy(() => import('./pages/Orders'));
const DeliveryHistory = React.lazy(() => import('./pages/DeliveryHistory'));
const Earnings = React.lazy(() => import('./pages/Earnings'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Wallet = React.lazy(() => import('./pages/Wallet'));
const Settings = React.lazy(() => import('./pages/Settings'));
const HelpSupport = React.lazy(() => import('./pages/HelpSupport'));
const About = React.lazy(() => import('./pages/About'));
const TermsConditions = React.lazy(() => import('./pages/TermsConditions'));
const Notifications = React.lazy(() => import('./pages/Notifications'));
const LoginPage = React.lazy(() => import('../user/pages/LoginPage'));
const DeliverySignupPage = React.lazy(() => import('./pages/DeliverySignupPage'));
const DeliveryLanding = React.lazy(() => import('./pages/DeliveryLanding'));
const RouteManagement = React.lazy(() => import('./pages/RouteManagement'));
const DispatchCenter = React.lazy(() => import('./pages/DispatchCenter'));

const DeliveryRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<DeliveryLanding />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<DeliverySignupPage />} />
      <Route path="/terms" element={<TermsConditions />} />
      <Route element={<DeliveryLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/delivery-history" element={<DeliveryHistory />} />
        <Route path="/route-management" element={<RouteManagement />} />
        <Route path="/dispatch-center" element={<DispatchCenter />} />
        <Route path="/earnings" element={<Earnings />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/help" element={<HelpSupport />} />
        <Route path="/about" element={<About />} />
        <Route path="/notifications" element={<Notifications />} />
      </Route>
    </Routes>
  );
};

export default DeliveryRoutes;
