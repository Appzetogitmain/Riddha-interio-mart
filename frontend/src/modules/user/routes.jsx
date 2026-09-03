import React from 'react';
import { Routes, Route } from 'react-router-dom';
const HomePage = React.lazy(() => import('./pages/HomePage'));;
const ProductListingPage = React.lazy(() => import('./pages/ProductListingPage'));;
const ProductDetailsPage = React.lazy(() => import('./pages/ProductDetailsPage'));;
const CategoryDetailPage = React.lazy(() => import('./pages/CategoryDetailPage'));;
const CategoriesPage = React.lazy(() => import('./pages/CategoriesPage'));;
const CartPage = React.lazy(() => import('./pages/CartPage'));;
const Profile = React.lazy(() => import('./pages/Profile'));;
const Shop = React.lazy(() => import('./pages/Shop'));;
const Orders = React.lazy(() => import('./pages/Orders'));;
const Stores = React.lazy(() => import('./pages/Stores'));;
const About = React.lazy(() => import('./pages/About'));;
const Contact = React.lazy(() => import('./pages/Contact'));;
const Cancellation = React.lazy(() => import('./pages/Cancellation'));;
const Returns = React.lazy(() => import('./pages/Returns'));;
const Refund = React.lazy(() => import('./pages/Refund'));;
const Terms = React.lazy(() => import('./pages/Terms'));;
const BulkOrderOfferPage = React.lazy(() => import('./pages/BulkOrderOfferPage'));;
const CheckoutPage = React.lazy(() => import('./pages/CheckoutPage'));;
const LoginPage = React.lazy(() => import('./pages/LoginPage'));;
const SignupPage = React.lazy(() => import('./pages/SignupPage'));;
const VerifyEmailPage = React.lazy(() => import('./pages/VerifyEmailPage'));;
const ForgotPasswordPage = React.lazy(() => import('./pages/ForgotPasswordPage'));;
const AddressPage = React.lazy(() => import('./pages/AddressPage'));;
const PaymentPage = React.lazy(() => import('./pages/PaymentPage'));;
const OrderSuccessPage = React.lazy(() => import('./pages/OrderSuccessPage'));;
const OrderTrackingPage = React.lazy(() => import('./pages/OrderTrackingPage'));;
const EditProfile = React.lazy(() => import('./pages/EditProfile'));;
const BrandPage = React.lazy(() => import('./pages/BrandPage'));;
const BrandsPage = React.lazy(() => import('./pages/BrandsPage'));;
const SearchEntryPage = React.lazy(() => import('./pages/SearchEntryPage'));;
const SearchProductsPage = React.lazy(() => import('./pages/SearchProductsPage'));;
const InvoicePage = React.lazy(() => import('./pages/InvoicePage'));;
const ReferralRewardsPage = React.lazy(() => import('./pages/ReferralRewardsPage'));;
const ContractorRegistration = React.lazy(() => import('./pages/ContractorRegistration'));;
const DesignerRegistration = React.lazy(() => import('./pages/DesignerRegistration'));;
const BuilderRegistration = React.lazy(() => import('./pages/BuilderRegistration'));;
const WishlistPage = React.lazy(() => import('./pages/WishlistPage'));;
const NotificationPage = React.lazy(() => import('./pages/NotificationPage'));;
const SplashPage = React.lazy(() => import('./pages/SplashPage'));;
const OnboardingPage = React.lazy(() => import('./pages/OnboardingPage'));;
const SavedAddressesPage = React.lazy(() => import('./pages/SavedAddressesPage'));;
const BundlesPage = React.lazy(() => import('./pages/BundlesPage'));;
const BundleDetailPage = React.lazy(() => import('./pages/BundleDetailPage'));;
const DesignerQuizPage = React.lazy(() => import('./pages/DesignerQuizPage'));
const QuizResultsPage = React.lazy(() => import('./pages/QuizResultsPage'));
const RecommendationPage = React.lazy(() => import('./pages/RecommendationPage'));
const JourneyPage = React.lazy(() => import('./pages/JourneyPage'));

import { Navigate } from 'react-router-dom';
import { useUser } from './data/UserContext';

const AiRoomVisualizerPage = React.lazy(() => import('./pages/AiRoomVisualizerPage'));;
const MoodBoardGeneratorPage = React.lazy(() => import('./pages/MoodBoardGeneratorPage'));;

const RootRoute = () => {
  const splashCompleted = localStorage.getItem('splashCompleted') === 'true';

  if (splashCompleted) {
    return <HomePage />;
  }
  return <Navigate to="/splash" replace />;
};

const ClientBriefPage = React.lazy(() => import('./pages/ClientBriefPage'));
const ProjectsDashboardPage = React.lazy(() => import('./pages/ProjectsDashboardPage'));
const ProjectDetailPage = React.lazy(() => import('./pages/ProjectDetailPage'));
const CostEstimatorPage = React.lazy(() => import('./pages/CostEstimatorPage'));
const BOQGeneratorPage = React.lazy(() => import('./pages/BOQGeneratorPage'));
const QuotationGeneratorPage = React.lazy(() => import('./pages/QuotationGeneratorPage'));
const NotificationCenterPage = React.lazy(() => import('./pages/NotificationCenterPage'));
const NotificationPreferencesPage = React.lazy(() => import('./pages/NotificationPreferencesPage'));
const SellerAIContentGeneratorPage = React.lazy(() => import('./pages/SellerAIContentGeneratorPage'));
// Requirement A — B2B Request for Quotation & Sample Requests
const RFQPage = React.lazy(() => import('./pages/RFQPage'));
const SamplesPage = React.lazy(() => import('./pages/SamplesPage'));

import ProGateGuard from './components/ProGateGuard';

const UserRoutes = () => {
  return (
    <Routes>
      <Route path="/client-brief" element={<ProGateGuard title="AI Project Brief Generator" description="Generate professional interior design client briefs with AI."><ClientBriefPage /></ProGateGuard>} />
      <Route path="/client-brief/:briefId" element={<ProGateGuard title="AI Project Brief Generator" description="Generate professional interior design client briefs with AI."><ClientBriefPage /></ProGateGuard>} />
      <Route path="/projects" element={<ProGateGuard title="Projects Dashboard" description="Manage your AI interior design projects and estimates."><ProjectsDashboardPage /></ProGateGuard>} />
      <Route path="/projects/:projectId" element={<ProGateGuard title="Projects Dashboard" description="Manage your AI interior design projects and estimates."><ProjectDetailPage /></ProGateGuard>} />
      <Route path="/cost-estimator" element={<ProGateGuard title="AI Cost Estimator" description="Calculate interior costs with AI precision."><CostEstimatorPage /></ProGateGuard>} />
      <Route path="/cost-estimator/:estimateId" element={<ProGateGuard title="AI Cost Estimator" description="Calculate interior costs with AI precision."><CostEstimatorPage /></ProGateGuard>} />
      <Route path="/boq-generator" element={<ProGateGuard title="AI BOQ Generator" description="Generate automated Bill of Quantities with AI."><BOQGeneratorPage /></ProGateGuard>} />
      <Route path="/boq-generator/:boqId" element={<ProGateGuard title="AI BOQ Generator" description="Generate automated Bill of Quantities with AI."><BOQGeneratorPage /></ProGateGuard>} />
      <Route path="/quotation-generator" element={<ProGateGuard title="AI Quotation Generator" description="Generate GST compliant interior quotes automatically."><QuotationGeneratorPage /></ProGateGuard>} />
      <Route path="/quotation-generator/:quotationId" element={<ProGateGuard title="AI Quotation Generator" description="Generate GST compliant interior quotes automatically."><QuotationGeneratorPage /></ProGateGuard>} />
      <Route path="/seller/content-generator" element={<SellerAIContentGeneratorPage />} />
      <Route path="/rfq" element={<RFQPage />} />
      <Route path="/rfq/new" element={<RFQPage />} />
      <Route path="/rfq/:rfqId" element={<RFQPage />} />
      <Route path="/samples" element={<SamplesPage />} />
      <Route path="/samples/new" element={<SamplesPage />} />
      <Route path="/samples/:id" element={<SamplesPage />} />
      <Route path="/notifications" element={<NotificationCenterPage />} />
      <Route path="/notifications/preferences" element={<NotificationPreferencesPage />} />
      <Route path="/orders/track" element={<OrderTrackingPage />} />
      <Route path="/orders/:orderId/track" element={<OrderTrackingPage />} />
      <Route path="/splash" element={<SplashPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/" element={<RootRoute />} />

      <Route path="/designer-quiz" element={<ProGateGuard title="AI Designer Quiz" description="Discover your interior design persona with AI."><DesignerQuizPage /></ProGateGuard>} />
      <Route path="/designer-quiz/results" element={<ProGateGuard title="AI Designer Quiz" description="Discover your interior design persona with AI."><QuizResultsPage /></ProGateGuard>} />
      <Route path="/contractor-registration" element={<ContractorRegistration />} />
      <Route path="/designer-registration" element={<DesignerRegistration />} />
      <Route path="/builder-registration" element={<BuilderRegistration />} />
      <Route path="/referral" element={<ReferralRewardsPage />} />
      <Route path="/products" element={<ProductListingPage />} />
      <Route path="/products/:id" element={<ProductDetailsPage />} />
      <Route path="/product/:id" element={<ProductDetailsPage />} />
      <Route path="/categories" element={<CategoriesPage />} />
      <Route path="/category/:slug" element={<CategoryDetailPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/wishlist" element={<WishlistPage />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/referral-rewards" element={<ReferralRewardsPage />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/stores" element={<Stores />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/policies/cancellation" element={<Cancellation />} />
      <Route path="/policies/returns" element={<Returns />} />
      <Route path="/policies/refund" element={<Refund />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/bulk-order-offer/:id" element={<BulkOrderOfferPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/address" element={<AddressPage />} />
      <Route path="/payment" element={<PaymentPage />} />
      <Route path="/order-success" element={<OrderSuccessPage />} />
      <Route path="/track-order/:id" element={<OrderTrackingPage />} />
      <Route path="/profile/edit" element={<EditProfile />} />
      <Route path="/brands" element={<BrandsPage />} />
      <Route path="/brand/:brandName" element={<BrandPage />} />
      <Route path="/search" element={<SearchEntryPage />} />
      <Route path="/search-results" element={<SearchProductsPage />} />
      <Route path="/order/invoice/:id" element={<InvoicePage />} />
      <Route path="/notifications" element={<NotificationPage />} />
      <Route path="/addresses" element={<SavedAddressesPage />} />
      <Route path="/ai-room-visualizer" element={<ProGateGuard title="AI Room Visualizer" description="Visualize rooms with AI."><AiRoomVisualizerPage /></ProGateGuard>} />
      <Route path="/ai-mood-board" element={<ProGateGuard title="AI Mood Board" description="Generate interior mood boards with AI."><MoodBoardGeneratorPage /></ProGateGuard>} />
      <Route path="/bundles" element={<BundlesPage />} />
      <Route path="/bundles/:id" element={<BundleDetailPage />} />
      <Route path="/recommendations" element={<ProGateGuard title="AI Recommendations" description="Get personalized interior design recommendations with AI."><RecommendationPage /></ProGateGuard>} />
      <Route path="/journey" element={<JourneyPage />} />
    </Routes>
  );
};

export default UserRoutes;
