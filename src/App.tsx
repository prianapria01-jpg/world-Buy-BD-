/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import StorefrontLayout from "./layouts/StorefrontLayout";
import { useAuth } from "./context/AuthContext";

// Core Storefront Pages (eagerly loaded for instant navigation)
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";

// Lazy-loaded Secondary, Info & Admin Pages
const ProductDetailsWholesale = lazy(() => import("./pages/ProductDetailsWholesale"));
const CustomerDashboard = lazy(() => import("./pages/CustomerDashboard"));
const CustomerLogin = lazy(() => import("./pages/auth/CustomerLogin"));

const AboutUs = lazy(() => import("./pages/info/AboutUs"));
const ContactUs = lazy(() => import("./pages/info/ContactUs"));
const PrivacyPolicy = lazy(() => import("./pages/info/PrivacyPolicy"));
const ReturnRefund = lazy(() => import("./pages/info/ReturnRefund"));
const CancellationPolicy = lazy(() => import("./pages/info/CancellationPolicy"));

const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const SubAdminLayout = lazy(() => import("./layouts/SubAdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminDiscounts = lazy(() => import("./pages/admin/AdminDiscounts"));
const AdminApifyImporter = lazy(() => import("./pages/admin/AdminApifyImporter"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminCustomers = lazy(() => import("./pages/admin/AdminCustomers"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminSubAdmins = lazy(() => import("./pages/admin/AdminSubAdmins"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminWebsiteCustomizer = lazy(() => import("./pages/admin/AdminWebsiteCustomizer"));
const AdminDelivery = lazy(() => import("./pages/admin/AdminDelivery"));
const AdminScraper = lazy(() => import("./pages/admin/AdminScraper"));
const AdminProductBackup = lazy(() => import("./pages/admin/AdminProductBackup"));
const AdminVideos = lazy(() => import("./pages/admin/AdminVideos"));
const AdminRoleDashboards = lazy(() => import("./pages/admin/AdminRoleDashboards"));
const RoleDashboardDetail = lazy(() => import("./pages/admin/RoleDashboardDetail"));
const DepartmentManagementHub = lazy(() => import("./pages/admin/DepartmentManagementHub"));
const AdminLogin = lazy(() => import("./pages/auth/AdminLogin"));
const SubAdminLogin = lazy(() => import("./pages/auth/SubAdminLogin"));

const PageLoader = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="animate-spin rounded-full h-9 w-9 border-2 border-primary border-t-transparent"></div>
  </div>
);

const ProtectedCustomerRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Storefront Routes */}
          <Route path="/" element={<StorefrontLayout />}>
            <Route index element={<Home />} />
            <Route path="shop" element={<Shop />} />
            <Route path="flash-sale" element={<Shop />} />
            <Route path="product/abb/:id" element={<ProductDetails />} />
            <Route path="product/:id" element={<ProductDetails />} />
            <Route path="product-wholesale/:id" element={<ProductDetailsWholesale />} />
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="login" element={<CustomerLogin />} />
            <Route path="account" element={<ProtectedCustomerRoute><CustomerDashboard /></ProtectedCustomerRoute>} />
            <Route path="wishlist" element={<ProtectedCustomerRoute><CustomerDashboard /></ProtectedCustomerRoute>} />
            
            {/* Info Pages */}
            <Route path="about" element={<AboutUs />} />
            <Route path="how-it-works" element={<AboutUs />} />
            <Route path="shipping-charges" element={<AboutUs />} />
            <Route path="faq" element={<AboutUs />} />
            <Route path="contact" element={<ContactUs />} />
            <Route path="privacy-policy" element={<PrivacyPolicy />} />
            <Route path="return-refund" element={<ReturnRefund />} />
            <Route path="terms" element={<ReturnRefund />} />
            <Route path="cancellation-policy" element={<CancellationPolicy />} />
            <Route path="track-order" element={<ProtectedCustomerRoute><CustomerDashboard /></ProtectedCustomerRoute>} />
          </Route>

          {/* Auth Routes */}
          <Route path="/auth/login" element={<AdminLogin />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/subadmin/login" element={<SubAdminLogin />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="videos" element={<AdminVideos />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="departments" element={<DepartmentManagementHub />} />
            <Route path="workflow" element={<DepartmentManagementHub />} />
            <Route path="delivery" element={<AdminDelivery />} />
            <Route path="role-dashboards" element={<AdminRoleDashboards />} />
            <Route path="role-dashboards/:id" element={<RoleDashboardDetail />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="discounts" element={<AdminDiscounts />} />
            <Route path="subadmins" element={<AdminSubAdmins />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="customizer" element={<AdminWebsiteCustomizer />} />
            <Route path="apify-importer" element={<AdminApifyImporter />} />
            <Route path="scraper" element={<AdminScraper />} />
            <Route path="product-backup" element={<AdminProductBackup />} />
          </Route>

          {/* Direct Staff Role Portal Routes */}
          <Route path="/portal/:id" element={<RoleDashboardDetail />} />

          {/* Sub-Admin Routes */}
          <Route path="/subadmin" element={<SubAdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="videos" element={<AdminVideos />} />
            <Route path="customizer" element={<AdminWebsiteCustomizer />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="departments" element={<DepartmentManagementHub />} />
            <Route path="workflow" element={<DepartmentManagementHub />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="apify-importer" element={<AdminApifyImporter />} />
            <Route path="scraper" element={<AdminScraper />} />
            <Route path="product-backup" element={<AdminProductBackup />} />
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
