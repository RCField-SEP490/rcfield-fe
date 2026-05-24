import { ProtectedRoute } from "@/shared/components/ProtectedRoute"
import { createBrowserRouter, Navigate } from "react-router"
import { AuthLayout } from "@/app/layouts/AuthLayout"
import { DashboardLayout } from "@/app/layouts/DashboardLayout"
import { PublicLayout } from "@/app/layouts/PublicLayout"
import { RootLayout } from "@/app/layouts/RootLayout"
import { RoleGuard } from "@/shared/components/RoleGuard"
import { ForbiddenPage } from "@/pages/public/ForbiddenPage"
import { NotFoundPage } from "@/pages/public/NotFoundPage"
import { PlaceholderPage } from "@/pages/public/PlaceholderPage"
import { LandingPage } from "@/pages/public/LandingPage"
import { LoginPage } from "@/pages/auth/LoginPage"
import { RegisterPage } from "@/pages/auth/RegisterPage"
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage"
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage"
import { CustomerBookingsPage } from "@/pages/customer/CustomerBookingsPage"
import { CustomerVehiclesPage } from "@/pages/customer/CustomerVehiclesPage"
import { CustomerPackagesPage } from "@/pages/customer/CustomerPackagesPage"
import { CustomerReviewsPage } from "@/pages/customer/CustomerReviewsPage"
import { CustomerProfilePage } from "@/pages/customer/profile/CustomerProfilePage"
import { ExplorePage } from "@/pages/customer/explore/ExplorePage"
import { CreateBookingPage } from "@/pages/booking/CreateBookingPage"
import { CustomerBookingDetailPage } from "@/pages/customer/booking-detail/CustomerBookingDetailPage"
import { CustomerInspectionConfirmPage } from "@/pages/customer/inspection/CustomerInspectionConfirmPage"
import { CustomerActiveSessionPage } from "@/pages/customer/session/CustomerActiveSessionPage"
import { CustomerDamageReviewPage } from "@/pages/customer/damage/CustomerDamageReviewPage"
import { CustomerExtensionResponsePage } from "@/pages/customer/extension/CustomerExtensionResponsePage"
import { PaymentResultPage } from "@/pages/booking/PaymentResultPage"
import { CafeDetailPage } from "@/pages/customer/cafe-detail/CafeDetailPage"
import { AdminDashboardPage } from "@/pages/admin/AdminDashboardPage"
import { AdminUsersPage } from "@/pages/admin/AdminUsersPage"
import { AdminCafesPage } from "@/pages/admin/AdminCafesPage"
import { AdminDisputesPage } from "@/pages/admin/AdminDisputesPage"
import { AdminPaymentsPage } from "@/pages/admin/AdminPaymentsPage"
import { AdminFeatureFlagsPage } from "@/pages/admin/AdminFeatureFlagsPage"
import { AdminTrustScoreLogsPage } from "@/pages/admin/AdminTrustScoreLogsPage"
import { ProviderDashboardPage } from "@/pages/provider/ProviderDashboardPage"
import { ProviderCafesPage } from "@/pages/provider/ProviderCafesPage"
import { ProviderCafeDetailPage } from "@/pages/provider/ProviderCafeDetailPage"
import { ProviderVehiclesPage } from "@/pages/provider/ProviderVehiclesPage"
import { ProviderBookingsPage } from "@/pages/provider/ProviderBookingsPage"
import { ProviderSessionsPage } from "@/pages/provider/ProviderSessionsPage"
import { ProviderMenuPage } from "@/pages/provider/ProviderMenuPage"
import { ProviderPackagesPage } from "@/pages/provider/ProviderPackagesPage"
import { ProviderSubscriptionsPage } from "@/pages/provider/ProviderSubscriptionsPage"
import { ProviderPromotionsPage } from "@/pages/provider/ProviderPromotionsPage"
import { ProviderStaffPage } from "@/pages/provider/ProviderStaffPage"
import { ProviderRevenuePage } from "@/pages/provider/ProviderRevenuePage"
import { routePaths } from "./route-paths"

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { index: true, element: <LandingPage /> },
          { path: routePaths.cafes, element: <ExplorePage /> },
          { path: routePaths.cafeDetail, element: <CafeDetailPage /> },
          { path: routePaths.vehicleDetail, element: <PlaceholderPage title="Vehicle detail" /> },
          { path: routePaths.bookingCreate, element: <CreateBookingPage /> },
          { path: routePaths.bookingDetail, element: <CustomerBookingDetailPage /> },
          { path: routePaths.paymentResult, element: <PaymentResultPage /> },
        ],
      },
      {
        element: <AuthLayout />,
        children: [
          { path: routePaths.login, element: <LoginPage /> },
          { path: routePaths.register, element: <RegisterPage /> },
          { path: routePaths.forgotPassword, element: <ForgotPasswordPage /> },
          { path: routePaths.resetPassword, element: <ResetPasswordPage /> },
        ],
      },
      {
        element: (
          <ProtectedRoute>
            <RoleGuard allowedRoles={["customer"]}>
              <PublicLayout />
            </RoleGuard>
          </ProtectedRoute>
        ),
        children: [
          { path: routePaths.customerHome, element: <Navigate replace to={routePaths.customerProfile} /> },
          { path: routePaths.customerBookings, element: <CustomerBookingsPage /> },
          { path: routePaths.customerProfile, element: <CustomerProfilePage /> },
          { path: routePaths.customerBookingDetail, element: <CustomerBookingDetailPage /> },
          { path: routePaths.customerPackages, element: <CustomerPackagesPage /> },
          { path: routePaths.customerSubscriptions, element: <PlaceholderPage title="Customer subscriptions" /> },
          { path: routePaths.customerVehicles, element: <CustomerVehiclesPage /> },
          { path: routePaths.customerReviews, element: <CustomerReviewsPage /> },
          { path: routePaths.customerInspectionConfirm, element: <CustomerInspectionConfirmPage /> },
          { path: routePaths.customerActiveSession, element: <CustomerActiveSessionPage /> },
          { path: routePaths.customerDamageReview, element: <CustomerDamageReviewPage /> },
          { path: routePaths.customerExtensionResponse, element: <CustomerExtensionResponsePage /> },
        ],
      },
      {
        element: (
          <ProtectedRoute>
            <RoleGuard allowedRoles={["staff", "provider", "admin"]}>
              <DashboardLayout />
            </RoleGuard>
          </ProtectedRoute>
        ),
        children: [
          { path: routePaths.staffDashboard, element: <PlaceholderPage title="Staff dashboard" /> },
          { path: routePaths.staffTodayBookings, element: <PlaceholderPage title="Today bookings" /> },
          { path: routePaths.staffSessionDetail, element: <PlaceholderPage title="Session detail" /> },
          { path: routePaths.staffInspection, element: <PlaceholderPage title="Inspection" /> },
          { path: routePaths.staffFnbOrders, element: <PlaceholderPage title="FnB orders" /> },
           { path: routePaths.providerDashboard, element: <ProviderDashboardPage /> },
          { path: routePaths.providerCafes, element: <ProviderCafesPage /> },
          { path: routePaths.providerCafeDetail, element: <ProviderCafeDetailPage /> },
          { path: routePaths.providerVehicles, element: <ProviderVehiclesPage /> },
          { path: routePaths.providerBookings, element: <ProviderBookingsPage /> },
          { path: routePaths.providerSessions, element: <ProviderSessionsPage /> },
          { path: routePaths.providerMenu, element: <ProviderMenuPage /> },
          { path: routePaths.providerPackages, element: <ProviderPackagesPage /> },
          { path: routePaths.providerSubscriptions, element: <ProviderSubscriptionsPage /> },
          { path: routePaths.providerPromotions, element: <ProviderPromotionsPage /> },
          { path: routePaths.providerStaff, element: <ProviderStaffPage /> },
          { path: routePaths.providerRevenue, element: <ProviderRevenuePage /> },
          { path: routePaths.adminDashboard, element: <AdminDashboardPage /> },
          { path: routePaths.adminUsers, element: <AdminUsersPage /> },
          { path: routePaths.adminCafes, element: <AdminCafesPage /> },
          { path: routePaths.adminDisputes, element: <AdminDisputesPage /> },
          { path: routePaths.adminPayments, element: <AdminPaymentsPage /> },
          { path: routePaths.adminFeatureFlags, element: <AdminFeatureFlagsPage /> },
          { path: routePaths.adminTrustScoreLogs, element: <AdminTrustScoreLogsPage /> },
        ],
      },
      { path: routePaths.forbidden, element: <ForbiddenPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
])
