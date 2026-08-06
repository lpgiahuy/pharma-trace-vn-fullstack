import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from '@/layouts/MainLayout'
import { AdminLayout } from '@/layouts/AdminLayout'
import { WarehouseLayout } from '@/layouts/WarehouseLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { ProtectedRoute, GuestRoute } from './ProtectedRoute'

// ── Auth ────────────────────────────────────────────────────────────────────
const LoginPage        = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage     = lazy(() => import('@/pages/auth/RegisterPage'))
const ForgotPassword   = lazy(() => import('@/pages/auth/ForgotPasswordPage'))
const ResetPassword    = lazy(() => import('@/pages/auth/ResetPasswordPage'))

// ── Ecom ────────────────────────────────────────────────────────────────────
const HomePage         = lazy(() => import('@/pages/ecom/home/HomePage'))
const ProductListPage  = lazy(() => import('@/pages/ecom/products/ProductListPage'))
const ProductDetailPage= lazy(() => import('@/pages/ecom/products/ProductDetailPage'))
const CartPage         = lazy(() => import('@/pages/ecom/cart/CartPage'))
const CheckoutPage     = lazy(() => import('@/pages/ecom/cart/CheckoutPage'))
const OrderSuccessPage = lazy(() => import('@/pages/ecom/cart/OrderSuccessPage'))
const AccountPage      = lazy(() => import('@/pages/ecom/account/AccountPage'))
const ProfilePage      = lazy(() => import('@/pages/ecom/account/ProfilePage'))
const OrdersPage       = lazy(() => import('@/pages/ecom/account/OrdersPage'))
const OrderDetailPage  = lazy(() => import('@/pages/ecom/account/OrderDetailPage'))
const WishlistPage     = lazy(() => import('@/pages/ecom/account/WishlistPage'))
const PrescriptionPage = lazy(() => import('@/pages/ecom/account/PrescriptionPage'))
const RmaPage          = lazy(() => import('@/pages/ecom/account/RmaPage'))
const BlogListPage     = lazy(() => import('@/pages/ecom/blog/BlogListPage'))
const BlogDetailPage   = lazy(() => import('@/pages/ecom/blog/BlogDetailPage'))
const CustomerHelpPage = lazy(() => import('@/pages/ecom/help/HelpPage'))
const TracePage        = lazy(() => import('@/pages/trace/TracePage'))
const NotFoundPage     = lazy(() => import('@/pages/NotFoundPage'))
const UnauthorizedPage = lazy(() => import('@/pages/UnauthorizedPage'))

// ── Admin ───────────────────────────────────────────────────────────────────
const AdminDashboard      = lazy(() => import('@/pages/admin/dashboard/DashboardPage'))
const AdminProducts       = lazy(() => import('@/pages/admin/products/ProductsPage'))
const AdminProductForm    = lazy(() => import('@/pages/admin/products/ProductFormPage'))
const AdminCategories     = lazy(() => import('@/pages/admin/products/CategoriesPage'))
const AdminOrders         = lazy(() => import('@/pages/admin/orders/OrdersPage'))
const AdminOrderDetail    = lazy(() => import('@/pages/admin/orders/OrderDetailPage'))
const AdminRma            = lazy(() => import('@/pages/admin/orders/RmaPage'))
const AdminVouchers       = lazy(() => import('@/pages/admin/vouchers/VouchersPage'))
const AdminBlog           = lazy(() => import('@/pages/admin/blog/BlogPage'))
const AdminBlogForm       = lazy(() => import('@/pages/admin/blog/BlogFormPage'))
const AdminStaff          = lazy(() => import('@/pages/admin/staff/StaffPage'))
const AdminCustomers      = lazy(() => import('@/pages/admin/customers/CustomersPage'))
const AdminPrescriptions  = lazy(() => import('@/pages/admin/prescriptions/PrescriptionsPage'))
const AdminUnits          = lazy(() => import('@/pages/admin/units/UnitsPage'))
const AdminHelp           = lazy(() => import('@/pages/admin/help/HelpPage'))

// ── Warehouse ────────────────────────────────────────────────────────────────
const InboundPage           = lazy(() => import('@/pages/warehouse/inbound/InboundPage'))
const FulfillmentPage       = lazy(() => import('@/pages/warehouse/fulfillment/FulfillmentPage'))
const TransferPage          = lazy(() => import('@/pages/warehouse/transfer/TransferPage'))
const DisposalPage          = lazy(() => import('@/pages/warehouse/disposal/DisposalPage'))
const RecallPage            = lazy(() => import('@/pages/warehouse/recall/RecallPage'))
const ScannerPage           = lazy(() => import('@/pages/warehouse/scanner/ScannerPage'))
const WarehouseProfilePage  = lazy(() => import('@/pages/warehouse/profile/WarehouseProfilePage'))

const ADMIN_ROLES     = ['admin', 'manager']
const WAREHOUSE_ROLES = ['admin', 'manager', 'staff']

/**
 * Loading component tạm thời trong khi chờ tải file JS
 */
const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-white">
    <div className="flex flex-col items-center gap-2">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      <p className="text-sm font-medium text-slate-500">Đang tải trang...</p>
    </div>
  </div>
)

export const AppRoutes = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* Auth */}
      <Route element={<AuthLayout />}>
        <Route path="/login"           element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register"        element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
        <Route path="/reset-password"  element={<GuestRoute><ResetPassword /></GuestRoute>} />
      </Route>

      {/* Ecom – public */}
      <Route element={<MainLayout />}>
        <Route path="/"              element={<HomePage />} />
        <Route path="/products"      element={<ProductListPage />} />
        <Route path="/products/:id"  element={<ProductDetailPage />} />
        <Route path="/cart"          element={<CartPage />} />
        <Route path="/blog"          element={<BlogListPage />} />
        <Route path="/blog/:slug"    element={<BlogDetailPage />} />
        <Route path="/help"          element={<CustomerHelpPage />} />

        {/* Ecom – protected */}
        <Route path="/checkout"           element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
        <Route path="/order-success/:id"  element={<ProtectedRoute><OrderSuccessPage /></ProtectedRoute>} />
        <Route path="/account"            element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
        <Route path="/account/profile"    element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/account/orders"     element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
        <Route path="/account/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
        <Route path="/account/wishlist"   element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
        <Route path="/account/prescriptions" element={<ProtectedRoute><PrescriptionPage /></ProtectedRoute>} />
        <Route path="/account/rma"        element={<ProtectedRoute><RmaPage /></ProtectedRoute>} />
      </Route>

      {/* Admin */}
      <Route element={<ProtectedRoute roles={ADMIN_ROLES}><AdminLayout /></ProtectedRoute>}>
        <Route path="/admin"                   element={<AdminDashboard />} />
        <Route path="/admin/products"          element={<AdminProducts />} />
        <Route path="/admin/products/new"      element={<AdminProductForm />} />
        <Route path="/admin/products/:id/edit" element={<AdminProductForm />} />
        <Route path="/admin/categories"        element={<AdminCategories />} />
        <Route path="/admin/orders"            element={<AdminOrders />} />
        <Route path="/admin/orders/:id"        element={<AdminOrderDetail />} />
        <Route path="/admin/rma"               element={<AdminRma />} />
        <Route path="/admin/vouchers"          element={<AdminVouchers />} />
        <Route path="/admin/blog"              element={<AdminBlog />} />
        <Route path="/admin/blog/new"          element={<AdminBlogForm />} />
        <Route path="/admin/blog/:id/edit"     element={<AdminBlogForm />} />
        <Route path="/admin/staff"             element={<AdminStaff />} />
        <Route path="/admin/customers"         element={<AdminCustomers />} />
        <Route path="/admin/prescriptions"     element={<AdminPrescriptions />} />
        <Route path="/admin/help"              element={<AdminHelp />} />
      </Route>

      {/* Warehouse */}
      <Route element={<ProtectedRoute roles={WAREHOUSE_ROLES}><WarehouseLayout /></ProtectedRoute>}>
        <Route path="/warehouse"               element={<Navigate to="/warehouse/inbound" replace />} />
        <Route path="/warehouse/inbound"       element={<InboundPage />} />
        <Route path="/warehouse/fulfillment"   element={<FulfillmentPage />} />
        <Route path="/warehouse/transfer"      element={<TransferPage />} />
        <Route path="/warehouse/disposal"      element={<DisposalPage />} />
        <Route path="/warehouse/recall"        element={<RecallPage />} />
        <Route path="/warehouse/scanner"       element={<ScannerPage />} />
        <Route path="/warehouse/profile"       element={<WarehouseProfilePage />} />
      </Route>

      {/* Traceability — public, standalone dark layout */}
      <Route path="/trace" element={<TracePage />} />

      {/* Misc */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="*"             element={<NotFoundPage />} />
    </Routes>
  </Suspense>
)