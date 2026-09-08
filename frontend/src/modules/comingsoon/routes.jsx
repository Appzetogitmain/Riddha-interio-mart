import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ComingSoonPage from './pages/ComingSoonPage';
import ComingSoonAboutPage from './pages/ComingSoonAboutPage';
import ComingSoonServicesPage from './pages/ComingSoonServicesPage';
import ComingSoonCategoriesPage from './pages/ComingSoonCategoriesPage';
import ComingSoonShopPage from './pages/ComingSoonShopPage';
import ComingSoonContactPage from './pages/ComingSoonContactPage';
import ComingSoonSubPage from './pages/ComingSoonSubPage';

const ComingSoonRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<ComingSoonPage />} />
      <Route path="/about" element={<ComingSoonAboutPage />} />
      <Route path="/services" element={<ComingSoonServicesPage />} />
      <Route path="/categories" element={<ComingSoonCategoriesPage />} />
      <Route path="/shop" element={<ComingSoonShopPage />} />
      <Route path="/contact" element={<ComingSoonContactPage />} />
      <Route path="/:section" element={<ComingSoonSubPage />} />
      <Route path="*" element={<ComingSoonPage />} />
    </Routes>
  );
};

export default ComingSoonRoutes;
