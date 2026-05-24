import type { ReactNode } from "react"
import { createBrowserRouter, Navigate } from "react-router"
import { AuthLayout } from "@/app/layouts/AuthLayout"
import { DashboardLayout } from "@/app/layouts/DashboardLayout"
import { PublicLayout } from "@/app/layouts/PublicLayout"
import { RootLayout } from "@/app/layouts/RootLayout"
import { ProtectedRoute } from "@/shared/components/ProtectedRoute"
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
import { AdminSystemChatPage } from "@/pages/admin/AdminSystemChatPage"
import { AdminKnowledgeBasePage } from "@/pages/admin/AdminKnowledgeBasePage"
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
import type { UserRole } from "@/shared/types/common"

const guardRoute = (element: ReactNode, allowedRoles: UserRole[]) => (
  <RoleGuard allowedRoles={allowedRoles}>{element}</RoleGuard>
)

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
          { path: routePaths.staffDashboard, element: guardRoute(<PlaceholderPage title="Staff dashboard" />, ["staff"]) },
          { path: routePaths.staffTodayBookings, element: guardRoute(<PlaceholderPage title="Today bookings" />, ["staff"]) },
          { path: routePaths.staffSessionDetail, element: guardRoute(<PlaceholderPage title="Session detail" />, ["staff"]) },
          { path: routePaths.staffInspection, element: guardRoute(<PlaceholderPage title="Inspection" />, ["staff"]) },
          { path: routePaths.staffFnbOrders, element: guardRoute(<PlaceholderPage title="FnB orders" />, ["staff"]) },
          { path: routePaths.providerDashboard, element: guardRoute(<ProviderDashboardPage />, ["provider"]) },
          { path: routePaths.providerCafes, element: guardRoute(<ProviderCafesPage />, ["provider"]) },
          { path: routePaths.providerCafeDetail, element: guardRoute(<ProviderCafeDetailPage />, ["provider"]) },
          { path: routePaths.providerVehicles, element: guardRoute(<ProviderVehiclesPage />, ["provider"]) },
          { path: routePaths.providerBookings, element: guardRoute(<ProviderBookingsPage />, ["provider"]) },
          { path: routePaths.providerSessions, element: guardRoute(<ProviderSessionsPage />, ["provider"]) },
          { path: routePaths.providerMenu, element: guardRoute(<ProviderMenuPage />, ["provider"]) },
          { path: routePaths.providerPackages, element: guardRoute(<ProviderPackagesPage />, ["provider"]) },
          { path: routePaths.providerSubscriptions, element: guardRoute(<ProviderSubscriptionsPage />, ["provider"]) },
          { path: routePaths.providerPromotions, element: guardRoute(<ProviderPromotionsPage />, ["provider"]) },
          { path: routePaths.providerStaff, element: guardRoute(<ProviderStaffPage />, ["provider"]) },
          { path: routePaths.providerRevenue, element: guardRoute(<ProviderRevenuePage />, ["provider"]) },
          { path: routePaths.adminDashboard, element: guardRoute(<AdminDashboardPage />, ["admin"]) },
          { path: routePaths.adminUsers, element: guardRoute(<AdminUsersPage />, ["admin"]) },
          { path: routePaths.adminCafes, element: guardRoute(<AdminCafesPage />, ["admin"]) },
          { path: routePaths.adminDisputes, element: guardRoute(<AdminDisputesPage />, ["admin"]) },
          { path: routePaths.adminPayments, element: guardRoute(<AdminPaymentsPage />, ["admin"]) },
          { path: routePaths.adminFeatureFlags, element: guardRoute(<AdminFeatureFlagsPage />, ["admin"]) },
          { path: routePaths.adminTrustScoreLogs, element: guardRoute(<AdminTrustScoreLogsPage />, ["admin"]) },
          { path: routePaths.adminSystemChat, element: guardRoute(<AdminSystemChatPage />, ["admin"]) },
          { path: routePaths.adminKnowledgeBase, element: guardRoute(<AdminKnowledgeBasePage />, ["admin"]) },
        ],
      },
      { path: routePaths.forbidden, element: <ForbiddenPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
])
