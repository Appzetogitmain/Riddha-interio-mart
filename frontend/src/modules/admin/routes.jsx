import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const CatalogPage = React.lazy(() => import('./pages/CatalogPage'));
const CategoriesPage = React.lazy(() => import('./pages/CategoriesPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const ManageCategories = React.lazy(() => import('./pages/ManageCategories'));
const ManageFeaturedProducts = React.lazy(() => import('./pages/ManageFeaturedProducts'));
const AddFeaturedProductPage = React.lazy(() => import('./pages/AddFeaturedProductPage'));
const ManageHeroBanner = React.lazy(() => import('./pages/ManageHeroBanner'));
const ManagePromoBanner = React.lazy(() => import('./pages/ManagePromoBanner'));
const ManageSection = React.lazy(() => import('./pages/ManageSection'));
const ManageFavouriteCategories = React.lazy(() => import('./pages/ManageFavouriteCategories'));
const ManageCategoryGrid = React.lazy(() => import('./pages/ManageCategoryGrid'));
const ManageBrands = React.lazy(() => import('./pages/ManageBrands'));
const ManageAdvertisementPlans = React.lazy(() => import('./pages/ManageAdvertisementPlans'));
const OffersListPage = React.lazy(() => import('./pages/OffersListPage'));
const OfferFormPage = React.lazy(() => import('./pages/OfferFormPage'));
const BundleManagementPage = React.lazy(() => import('./pages/BundleManagementPage'));
const JourneyAnalyticsDashboard = React.lazy(() => import('./pages/JourneyAnalyticsDashboard'));
const LoginPage = React.lazy(() => import('../user/pages/LoginPage'));
const SignupPage = React.lazy(() => import('../user/pages/SignupPage'));
const AdminProfile = React.lazy(() => import('./pages/AdminProfile'));
const AnalyticsPage = React.lazy(() => import('./pages/AnalyticsPage'));
const NotificationsPage = React.lazy(() => import('./pages/NotificationsPage'));
const ActivityPage = React.lazy(() => import('./pages/ActivityPage'));
const ReferralManagement = React.lazy(() => import('./pages/ReferralManagement'));
const OrderTracking = React.lazy(() => import('./pages/OrderTracking'));
const AddProductPage = React.lazy(() => import('./pages/AddProductPage'));
const EditProductPage = React.lazy(() => import('./pages/EditProductPage'));
const AddCategoryPage = React.lazy(() => import('./pages/AddCategoryPage'));
const EditCategoryPage = React.lazy(() => import('./pages/EditCategoryPage'));
const AddCategoryGridItemPage = React.lazy(() => import('./pages/AddCategoryGridItemPage'));
const AddBrandPage = React.lazy(() => import('./pages/AddBrandPage'));
const PendingSellers = React.lazy(() => import('./pages/PendingSellers'));
const ActiveSellers = React.lazy(() => import('./pages/ActiveSellers'));
const OrderListPage = React.lazy(() => import('./pages/OrderListPage'));
const OrderDetailPage = React.lazy(() => import('./pages/OrderDetailPage'));
const ProductListPage = React.lazy(() => import('./pages/ProductListPage'));
const AddInventoryPage = React.lazy(() => import('./pages/AddInventoryPage'));
const EditInventoryPage = React.lazy(() => import('./pages/EditInventoryPage'));
const FleetConsole = React.lazy(() => import('./pages/FleetConsole'));
const AssignDeliveryPage = React.lazy(() => import('./pages/DeliveryAssignment'));
const AddProductFlowPage = React.lazy(() => import('./pages/AddProductFlowPage'));
const StockManagement = React.lazy(() => import('./pages/StockManagement'));
const BulkProductUpload = React.lazy(() => import('./pages/BulkProductUpload'));
const BulkOrdersPage = React.lazy(() => import('./pages/BulkOrdersPage'));
const ProductBatchesPage = React.lazy(() => import('./pages/ProductBatchesPage'));
const ReturnOrdersPage = React.lazy(() => import('./pages/ReturnOrdersPage'));
const TeamManagementPage = React.lazy(() => import('./pages/TeamManagementPage'));
const CreateAssistantPage = React.lazy(() => import('./pages/CreateAssistantPage'));
const ManageUserPage = React.lazy(() => import('./pages/ManageUserPage'));
const UserPaymentsPage = React.lazy(() => import('./pages/UserPaymentsPage'));
const CashCollectionPage = React.lazy(() => import('./pages/CashCollectionPage'));
const SellerTransactionsPage = React.lazy(() => import('./pages/SellerTransactionsPage'));
const SellerPayoutsPage = React.lazy(() => import('./pages/SellerPayoutsPage'));
const ManageSellerListPage = React.lazy(() => import('./pages/ManageSellerListPage'));
const FeedbackManagement = React.lazy(() => import('./pages/FeedbackManagement'));
const SellerRecommendationManagement = React.lazy(() => import('./pages/SellerRecommendationManagement'));
const ManageTerms = React.lazy(() => import('./pages/ManageTerms'));
const SupportTicketsPage = React.lazy(() => import('./pages/SupportTicketsPage'));
const BOQSourcingRequestsPage = React.lazy(() => import('./pages/BOQSourcingRequestsPage'));
const AdminCampaignBuilderPage = React.lazy(() => import('./pages/AdminCampaignBuilderPage'));
const AdminRecommendationAnalytics = React.lazy(() => import('./pages/AdminRecommendationAnalytics'));
import { RBACProvider } from './data/RBACContext';

const AdminRoutes = () => {
  return (
    <RBACProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AdminLayout />}>
          {/* ... (all routes) */}
          <Route index element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/boq-sourcing" element={<BOQSourcingRequestsPage />} />
          <Route path="/profile" element={<AdminProfile />} />
          <Route path="/notifications" element={<NotificationsPage />} />

          {/* Analytics & Activity */}
          <Route element={<ProtectedRoute permission="analytics" />}>
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/recommendation-analytics" element={<AdminRecommendationAnalytics />} />
            <Route path="/journey-analytics" element={<JourneyAnalyticsDashboard />} />
            <Route path="/activity" element={<ActivityPage />} />
          </Route>

          {/* Catalog & Products */}
          <Route element={<ProtectedRoute permission="catalog" />}>
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/catalog/add" element={<AddProductPage />} />
            <Route path="/catalog/edit/:id" element={<EditProductPage />} />
            <Route path="/bulk-upload" element={<BulkProductUpload />} />
          </Route>

          {/* Inventory & Stock */}
          <Route element={<ProtectedRoute permission="products" />}>
            <Route path="/inventory" element={<ProductListPage />} />
            <Route path="/inventory/pending" element={<ProductListPage status="pending" />} />
            <Route path="/inventory/add-flow" element={<AddProductFlowPage />} />
            <Route path="/inventory/add" element={<AddInventoryPage />} />
            <Route path="/inventory/edit/:id" element={<EditInventoryPage />} />
            <Route path="/stock-management" element={<StockManagement />} />
          </Route>

          {/* Categories */}
          <Route element={<ProtectedRoute permission="categories" />}>
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/manage-categories" element={<ManageCategories />} />
            <Route path="/manage-categories/add" element={<AddCategoryPage />} />
            <Route path="/manage-categories/edit/:id" element={<EditCategoryPage />} />
          </Route>

          {/* Orders */}
          <Route element={<ProtectedRoute permission="orders" />}>
            <Route path="/orders/:status" element={<OrderListPage />} />
            <Route path="/orders/view/:id" element={<OrderDetailPage />} />
            <Route path="/orders/tracking" element={<OrderTracking />} />
            <Route path="/bulk-orders" element={<BulkOrdersPage />} />
            <Route path="/returns" element={<ReturnOrdersPage />} />
            <Route path="/product-batches" element={<ProductBatchesPage />} />
            <Route path="/notifications/campaigns" element={<AdminCampaignBuilderPage />} />
          </Route>

          {/* Delivery */}
          <Route element={<ProtectedRoute permission="delivery" />}>
            <Route path="/delivery" element={<FleetConsole />} />
            <Route path="/delivery/pending" element={<FleetConsole />} />
            <Route path="/delivery/assign" element={<AssignDeliveryPage />} />
          </Route>

          {/* Sellers */}
          <Route element={<ProtectedRoute permission="sellers" />}>
            <Route path="/sellers" element={<ManageSellerListPage />} />
            <Route path="/sellers/pending" element={<PendingSellers />} />
            <Route path="/sellers/active" element={<ActiveSellers />} />
            <Route path="/customers" element={<ManageUserPage type="customer" />} />
            <Route path="/customers/individual" element={<ManageUserPage type="customer" />} />
            <Route path="/customers/enterpriser" element={<ManageUserPage type="enterpriser" />} />
          </Route>

          {/* Content Management */}
          <Route element={<ProtectedRoute permission="content" />}>
            <Route path="/manage-hero" element={<ManageHeroBanner />} />
            <Route path="/manage-promo" element={<ManagePromoBanner />} />
            <Route path="/manage-section" element={<ManageSection />} />
            <Route path="/manage-section/create" element={<ManageSection />} />
            <Route path="/manage-favourites" element={<ManageFavouriteCategories />} />
            <Route path="/manage-favourites/create" element={<ManageFavouriteCategories />} />
            <Route path="/manage-favourites/add" element={<ManageFavouriteCategories />} />
            <Route path="/manage-featured" element={<ManageFeaturedProducts />} />
            <Route path="/manage-featured/add" element={<AddFeaturedProductPage />} />
            <Route path="/manage-brands" element={<ManageBrands />} />
            <Route path="/manage-brands/add" element={<AddBrandPage />} />
            <Route path="/manage-bundles" element={<BundleManagementPage />} />
            <Route path="/manage-advertisements" element={<ManageAdvertisementPlans />} />
            <Route path="/offers" element={<OffersListPage />} />
            <Route path="/offers/type/:typeSlug" element={<OffersListPage />} />
            <Route path="/offers/add" element={<OfferFormPage />} />
            <Route path="/offers/edit/:id" element={<OfferFormPage />} />
            <Route path="/manage-grid" element={<ManageCategoryGrid />} />
            <Route path="/manage-grid/add" element={<AddCategoryGridItemPage />} />
            <Route path="/terms" element={<ManageTerms />} />
          </Route>

          {/* Referrals */}
          <Route element={<ProtectedRoute permission="referrals" />}>
            <Route path="/referrals" element={<ReferralManagement />} />
          </Route>

          {/* Settings */}
          <Route element={<ProtectedRoute permission="settings" />}>
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/feedback" element={<FeedbackManagement />} />
            <Route path="/seller-recommendations" element={<SellerRecommendationManagement />} />
            <Route path="/support-tickets" element={<SupportTicketsPage />} />
          </Route>

          {/* Team Management (Admin Only) */}
          <Route element={<ProtectedRoute permission="team" />}>
            <Route path="/team" element={<TeamManagementPage />} />
            <Route path="/team/create" element={<CreateAssistantPage />} />
            <Route path="/team/edit/:id" element={<CreateAssistantPage />} />
          </Route>

          <Route element={<ProtectedRoute permission="payments" />}>
            <Route path="/payments" element={<Navigate to="/admin/payments/users" replace />} />
            <Route path="/payments/users" element={<UserPaymentsPage />} />
            <Route path="/payments/delivery" element={<CashCollectionPage />} />
            <Route path="/payments/sellers" element={<SellerTransactionsPage />} />
            <Route path="/payments/seller-payouts" element={<SellerPayoutsPage />} />
          </Route>
        </Route>
      </Routes>
    </RBACProvider>
  );
};

export default AdminRoutes;
