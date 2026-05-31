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
import { CafeFullPageChatPage } from "@/pages/public/CafeFullPageChatPage"
import { LoginPage } from "@/pages/auth/LoginPage"
import { RegisterPage } from "@/pages/auth/RegisterPage"
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage"
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage"
import { ProfilePage } from "@/pages/profile/ProfilePage"
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
import { AdminChannelSettingsPage } from "@/pages/admin/AdminChannelSettingsPage"
import { AdminProvidersPage } from "@/pages/admin/AdminProvidersPage"
import { AdminProviderDetailPage } from "@/pages/admin/AdminProviderDetailPage"
import { AdminPaymentRequestsPage } from "@/pages/admin/AdminPaymentRequestsPage"
import { AdminSubscriptionPlansPage } from "@/pages/admin/AdminSubscriptionPlansPage"
import { ProviderRegisterPage } from "@/pages/auth/ProviderRegisterPage"
import { ProviderDashboardPage } from "@/pages/provider/ProviderDashboardPage"
import { ProviderCafesPage } from "@/pages/provider/ProviderCafesPage"
import { ProviderCafeCreatePage } from "@/pages/provider/ProviderCafeCreatePage"
import { ProviderCafeDetailPage } from "@/pages/provider/ProviderCafeDetailPage"
import { ProviderVehiclesPage } from "@/pages/provider/ProviderVehiclesPage"
import { ProviderVehicleDetailPage } from "@/pages/provider/ProviderVehicleDetailPage"
import { ProviderBookingsPage } from "@/pages/provider/ProviderBookingsPage"
import { ProviderSchedulePage } from "@/pages/provider/ProviderSchedulePage"
import { ProviderSessionsPage } from "@/pages/provider/ProviderSessionsPage"
import { ProviderMenuPage } from "@/pages/provider/ProviderMenuPage"
import { ProviderPackagesPage } from "@/pages/provider/ProviderPackagesPage"
import { ProviderSubscriptionsPage } from "@/pages/provider/ProviderSubscriptionsPage"
import { ProviderPromotionsPage } from "@/pages/provider/ProviderPromotionsPage"
import { ProviderStaffPage } from "@/pages/provider/ProviderStaffPage"
import { ProviderRevenuePage } from "@/pages/provider/ProviderRevenuePage"
import { ProviderConfigurationPage } from "@/pages/provider/ProviderConfigurationPage"
import { ChannelSettingsPage } from "@/pages/provider/ChannelSettingsPage"
import { FacebookOAuthCallbackPage } from "@/pages/FacebookOAuthCallbackPage"
import { ProviderStatusGuard } from "@/shared/components/ProviderStatusGuard"
import { PartnerLandingPage } from "@/pages/public/PartnerLandingPage"
import { PendingReviewPage } from "@/pages/auth/PendingReviewPage"
import { RejectedPage } from "@/pages/auth/RejectedPage"
import { SuspendedPage } from "@/pages/auth/SuspendedPage"
import { routePaths } from "./route-paths"
import type { UserRole } from "@/shared/types/common"

const guardRoute = (element: ReactNode, allowedRoles: UserRole[]) => (
  <RoleGuard allowedRoles={allowedRoles}>{element}</RoleGuard>
)

const providerGuardRoute = (element: ReactNode) => (
  <RoleGuard allowedRoles={["provider"]}>
    <ProviderStatusGuard>{element}</ProviderStatusGuard>
  </RoleGuard>
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
          { path: routePaths.cafeChat, element: <CafeFullPageChatPage /> },
          { path: routePaths.vehicleDetail, element: <PlaceholderPage title="Vehicle detail" /> },
          { path: routePaths.bookingCreate, element: <CreateBookingPage /> },
          { path: routePaths.bookingDetail, element: <CustomerBookingDetailPage /> },
          { path: routePaths.paymentResult, element: <PaymentResultPage /> },
          { path: routePaths.partnerLanding, element: <PartnerLandingPage /> },
        ],
      },
      {
        element: <AuthLayout />,
        children: [
          { path: routePaths.login, element: <LoginPage /> },
          { path: routePaths.register, element: <RegisterPage /> },
          { path: routePaths.providerRegister, element: <ProviderRegisterPage /> },
          { path: routePaths.forgotPassword, element: <ForgotPasswordPage /> },
          { path: routePaths.resetPassword, element: <ResetPasswordPage /> },
        ],
      },
      {
        path: routePaths.profile,
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
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
          { path: routePaths.providerDashboard, element: providerGuardRoute(<ProviderDashboardPage />) },
          { path: routePaths.providerCafes, element: providerGuardRoute(<ProviderCafesPage />) },
          { path: routePaths.providerCafeCreate, element: providerGuardRoute(<ProviderCafeCreatePage />) },
          { path: routePaths.providerCafeDetail, element: providerGuardRoute(<ProviderCafeDetailPage />) },
          { path: routePaths.providerVehicles, element: providerGuardRoute(<ProviderVehiclesPage />) },
          { path: routePaths.providerVehicleDetail, element: providerGuardRoute(<ProviderVehicleDetailPage />) },
          { path: routePaths.providerBookings, element: providerGuardRoute(<ProviderBookingsPage />) },
          { path: routePaths.providerSchedule, element: providerGuardRoute(<ProviderSchedulePage />) },
          { path: routePaths.providerSessions, element: providerGuardRoute(<ProviderSessionsPage />) },
          { path: routePaths.providerMenu, element: providerGuardRoute(<ProviderMenuPage />) },
          { path: routePaths.providerPackages, element: providerGuardRoute(<ProviderPackagesPage />) },
          { path: routePaths.providerSubscriptions, element: providerGuardRoute(<ProviderSubscriptionsPage />) },
          { path: routePaths.providerPromotions, element: providerGuardRoute(<ProviderPromotionsPage />) },
          { path: routePaths.providerStaff, element: providerGuardRoute(<ProviderStaffPage />) },
          { path: routePaths.providerRevenue, element: providerGuardRoute(<ProviderRevenuePage />) },
          { path: routePaths.providerConfiguration, element: providerGuardRoute(<ProviderConfigurationPage />) },
          { path: routePaths.providerChannels, element: providerGuardRoute(<ChannelSettingsPage />) },
          { path: routePaths.facebookOAuthCallback, element: providerGuardRoute(<FacebookOAuthCallbackPage />) },
          { path: routePaths.adminDashboard, element: guardRoute(<AdminDashboardPage />, ["admin"]) },
          { path: routePaths.adminUsers, element: guardRoute(<AdminUsersPage />, ["admin"]) },
          { path: routePaths.adminCafes, element: guardRoute(<AdminCafesPage />, ["admin"]) },
          { path: routePaths.adminDisputes, element: guardRoute(<AdminDisputesPage />, ["admin"]) },
          { path: routePaths.adminPayments, element: guardRoute(<AdminPaymentsPage />, ["admin"]) },
          { path: routePaths.adminFeatureFlags, element: guardRoute(<AdminFeatureFlagsPage />, ["admin"]) },
          { path: routePaths.adminTrustScoreLogs, element: guardRoute(<AdminTrustScoreLogsPage />, ["admin"]) },
          { path: routePaths.adminSystemChat, element: guardRoute(<AdminSystemChatPage />, ["admin"]) },
          { path: routePaths.adminKnowledgeBase, element: guardRoute(<AdminKnowledgeBasePage />, ["admin"]) },
          { path: routePaths.adminChannels, element: guardRoute(<AdminChannelSettingsPage />, ["admin"]) },
          { path: routePaths.adminProviders, element: guardRoute(<AdminProvidersPage />, ["admin"]) },
          { path: routePaths.adminProviderDetail, element: guardRoute(<AdminProviderDetailPage />, ["admin"]) },
          { path: routePaths.adminPaymentRequests, element: guardRoute(<AdminPaymentRequestsPage />, ["admin"]) },
          { path: routePaths.adminSubscriptionPlans, element: guardRoute(<AdminSubscriptionPlansPage />, ["admin"]) },
        ],
      },
      {
        path: routePaths.pendingReview,
        element: (
          <ProtectedRoute>
            <RoleGuard allowedRoles={["provider"]}>
              <PendingReviewPage />
            </RoleGuard>
          </ProtectedRoute>
        ),
      },
      {
        path: routePaths.rejected,
        element: (
          <ProtectedRoute>
            <RoleGuard allowedRoles={["provider"]}>
              <RejectedPage />
            </RoleGuard>
          </ProtectedRoute>
        ),
      },
      {
        path: routePaths.suspended,
        element: (
          <ProtectedRoute>
            <RoleGuard allowedRoles={["provider"]}>
              <SuspendedPage />
            </RoleGuard>
          </ProtectedRoute>
        ),
      },
      { path: routePaths.forbidden, element: <ForbiddenPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
])
