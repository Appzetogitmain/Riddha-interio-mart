import React from 'react';
// Admin can reuse the seller form since it handles both seller and admin modes
import SellerOfferFormPage from '../../seller/pages/OfferFormPage';

const OfferFormPage = () => {
  // The seller form already handles admin offers via API scope
  return <SellerOfferFormPage />;
};

export default OfferFormPage;
