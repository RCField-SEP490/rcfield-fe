

import type { ReactNode } from "react"
import { createBrowserRouter, Navigate, Outlet } from "react-router"
import { AuthLayout } from "@/app/layouts/AuthLayout"
import { DashboardLayout } from "@/app/layouts/DashboardLayout"
import { ExploreLayout } from "@/app/layouts/ExploreLayout"
import { PublicLayout } from "@/app/layouts/PublicLayout"
import { RootLayout } from "@/app/layouts/RootLayout"

// Staff Pages & Context
import { StaffOperationContextProvider } from "@/pages/staff/context/StaffOperationContext"
import { StaffShell } from "@/pages/staff/components/StaffShell"
import StaffDashboardPage from "@/pages/staff/StaffDashboardPage"
import StaffTodayBookingsPage from "@/pages/staff/StaffTodayBookingsPage"
import StaffSessionDetailPage from "@/pages/staff/StaffSessionDetailPage"
import StaffInspectionPage from "@/pages/staff/StaffInspectionPage"
import StaffFnbOrdersPage from "@/pages/staff/StaffFnbOrdersPage"
import StaffIncidentsPage from "@/pages/staff/StaffIncidentsPage"
import StaffMaintenancePage from "@/pages/staff/StaffMaintenancePage"
import StaffByocPage from "@/pages/staff/StaffByocPage"
import StaffPackagesPage from "@/pages/staff/StaffPackagesPage"
import StaffContestsPage from "@/pages/staff/contest/StaffContestsPage"
import StaffContestCheckInPage from "@/pages/staff/contest/StaffContestCheckInPage"
import StaffContestRuntimePage from "@/pages/staff/contest/StaffContestRuntimePage"

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
import { CustomerHomePage } from "@/pages/customer/CustomerHomePage"
import { CustomerBookingsPage } from "@/pages/customer/CustomerBookingsPage"
import { CustomerVehiclesPage } from "@/pages/customer/CustomerVehiclesPage"
import { CustomerPackagesPage } from "@/pages/customer/CustomerPackagesPage"
import { CustomerReviewsPage } from "@/pages/customer/CustomerReviewsPage"
import { CustomerProfilePage } from "@/pages/customer/profile/CustomerProfilePage"
import { CustomerContestRegistrationsPage } from "@/pages/customer/CustomerContestRegistrationsPage"
import { ExplorePage } from "@/pages/customer/explore/ExplorePage"
import { CreateBookingPage } from "@/pages/booking/CreateBookingPage"
import { BookingDetailPage } from "@/pages/booking/BookingDetailPage"
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
import { AdminAmenitiesPage } from "@/pages/admin/AdminAmenitiesPage"
import { AdminTrackTypesPage } from "@/pages/admin/AdminTrackTypesPage"
import { ProviderRegisterPage } from "@/pages/auth/ProviderRegisterPage"
import { ProviderDashboardPage } from "@/pages/provider/ProviderDashboardPage"
import { ProviderCafesPage } from "@/pages/provider/ProviderCafesPage"
import { ProviderCafeCreatePage } from "@/pages/provider/ProviderCafeCreatePage"
import { ProviderCafeDetailPage } from "@/pages/provider/ProviderCafeDetailPage"
import { ProviderCafePreviewPage } from "@/pages/provider/ProviderCafePreviewPage"
import { ProviderVehiclesRedirect } from "@/pages/provider/ProviderVehiclesRedirect"
import { ProviderVehicleCatalogFormPage } from "@/pages/provider/ProviderVehicleCatalogFormPage"
import { ProviderVehicleCatalogDetailPage } from "@/pages/provider/ProviderVehicleCatalogDetailPage"
import { ProviderVehicleDetailPage } from "@/pages/provider/ProviderVehicleDetailPage"
import { ProviderVehicleUnitFormPage } from "@/pages/provider/ProviderVehicleUnitFormPage"
import { ProviderBookingsPage } from "@/pages/provider/ProviderBookingsPage"
import { ProviderSchedulePage } from "@/pages/provider/ProviderSchedulePage"
import { ProviderSessionsPage } from "@/pages/provider/ProviderSessionsPage"
import { ProviderMenuPage } from "@/pages/provider/ProviderMenuPage"
import { ProviderPackageCopyPage, ProviderPackageCreatePage, ProviderPackageEditPage, ProviderPackagesPage } from "@/pages/provider/ProviderPackagesPage"
import { ProviderSubscriptionsPage } from "@/pages/provider/ProviderSubscriptionsPage"
import { ProviderPromotionCopyPage, ProviderPromotionCreatePage, ProviderPromotionEditPage, ProviderPromotionsPage } from "@/pages/provider/ProviderPromotionsPage"
import { ProviderStaffPage } from "@/pages/provider/ProviderStaffPage"
import { ProviderStaffDetailPage } from "@/pages/provider/ProviderStaffDetailPage"
import { StaffActivatePage } from "@/pages/staff/activate/StaffActivatePage"
import { ProviderRevenuePage } from "@/pages/provider/ProviderRevenuePage"
import { ProviderConfigurationPage } from "@/pages/provider/ProviderConfigurationPage"
import { ChannelSettingsPage } from "@/pages/provider/ChannelSettingsPage"
import { FacebookOAuthCallbackPage } from "@/pages/FacebookOAuthCallbackPage"
import { ProviderStatusGuard } from "@/shared/components/ProviderStatusGuard"
import { PartnerLandingPage } from "@/pages/public/PartnerLandingPage"
import { CustomerPolicyPage } from "@/pages/public/CustomerPolicyPage"
import { PublicContestsPage } from "@/pages/public/PublicContestsPage"
import { PublicContestDetailPage } from "@/pages/public/PublicContestDetailPage"
import { PendingReviewPage } from "@/pages/auth/PendingReviewPage"
import { RejectedPage } from "@/pages/auth/RejectedPage"
import { SuspendedPage } from "@/pages/auth/SuspendedPage"
import { routePaths } from "./route-paths"
import type { UserRole } from "@/shared/types/common"
import { ProviderContestsPage } from "@/pages/provider/ProviderContestsPage"
import { ProviderContestFormPage } from "@/pages/provider/ProviderContestFormPage"
import { ProviderContestRuntimePage } from "@/pages/provider/contest-runtime/ProviderContestRuntimePage"

const guardRoute = (element: ReactNode, allowedRoles: UserRole[]) => (
  <RoleGuard allowedRoles={allowedRoles}>{element}</RoleGuard>
)

const providerGuardRoute = (element: ReactNode) => (
  <RoleGuard allowedRoles={["provider"]}>
    <ProviderStatusGuard>{element}</ProviderStatusGuard>
  </RoleGuard>
)

function CustomerRealtimeLayout() {
  return <PublicLayout />
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        element: <ExploreLayout />,
        children: [
          { path: routePaths.cafes, element: <ExplorePage /> },
        ],
      },
      {
        element: <PublicLayout />,
        children: [
          { index: true, element: <LandingPage /> },
          { path: routePaths.cafeDetail, element: <CafeDetailPage /> },
          { path: routePaths.cafeChat, element: <CafeFullPageChatPage /> },
          { path: routePaths.vehicleDetail, element: <PlaceholderPage title="Vehicle detail" /> },
          { path: routePaths.bookingCreate, element: <CreateBookingPage /> },
          { path: routePaths.bookingDetail, element: <BookingDetailPage /> },
          { path: routePaths.contests, element: <PublicContestsPage /> },
          { path: routePaths.contestDetail, element: <PublicContestDetailPage /> },
          { path: routePaths.paymentResult, element: <PaymentResultPage /> },
          { path: routePaths.partnerLanding, element: <PartnerLandingPage /> },
          { path: routePaths.customerPolicy, element: <CustomerPolicyPage /> },
        ],
      },
      {
        path: routePaths.staffActivate,
        element: <StaffActivatePage />,
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
              <CustomerRealtimeLayout />
            </RoleGuard>
          </ProtectedRoute>
        ),
        children: [
          { path: routePaths.customerHome, element: <CustomerHomePage /> },
          { path: routePaths.customerBookings, element: <CustomerBookingsPage /> },
          { path: routePaths.customerContestRegistrations, element: <CustomerContestRegistrationsPage /> },
          { path: routePaths.customerProfile, element: <CustomerProfilePage /> },
          { path: routePaths.customerBookingDetail, element: <BookingDetailPage /> },
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
            <RoleGuard allowedRoles={["staff"]}>
              <StaffOperationContextProvider>
                <StaffShell>
                  <Outlet />
                </StaffShell>
              </StaffOperationContextProvider>
            </RoleGuard>
          </ProtectedRoute>
        ),
        children: [
          { path: routePaths.staffDashboard, element: <StaffDashboardPage /> },
          { path: routePaths.staffContests, element: <StaffContestsPage /> },
          { path: routePaths.staffContestCheckIn, element: <StaffContestCheckInPage /> },
          { path: routePaths.staffContestRuntime, element: <StaffContestRuntimePage /> },
          { path: routePaths.staffTodayBookings, element: <StaffTodayBookingsPage /> },
          { path: routePaths.staffSessionDetail, element: <StaffSessionDetailPage /> },
          { path: routePaths.staffInspection, element: <StaffInspectionPage /> },
          { path: routePaths.staffFnbOrders, element: <StaffFnbOrdersPage /> },
          { path: routePaths.staffIncidents, element: <StaffIncidentsPage /> },
          { path: routePaths.staffMaintenance, element: <StaffMaintenancePage /> },
          { path: routePaths.staffByoc, element: <StaffByocPage /> },
          { path: routePaths.staffPackages, element: <StaffPackagesPage /> },
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
          { path: routePaths.providerDashboard, element: providerGuardRoute(<ProviderDashboardPage />) },
          { path: routePaths.providerCafes, element: providerGuardRoute(<ProviderCafesPage />) },
          { path: routePaths.providerCafeCreate, element: providerGuardRoute(<ProviderCafeCreatePage />) },
          { path: routePaths.providerCafeDetail, element: providerGuardRoute(<ProviderCafeDetailPage />) },
          { path: routePaths.providerCafePreview, element: providerGuardRoute(<ProviderCafePreviewPage />) },
          { path: routePaths.providerVehicles, element: providerGuardRoute(<ProviderVehiclesRedirect />) },
          { path: routePaths.providerVehicleUnitCreateWithoutCatalog, element: providerGuardRoute(<ProviderVehicleUnitFormPage />) },
          { path: routePaths.providerVehicleCatalogs, element: <Navigate replace to="/provider/vehicles?tab=catalogs" /> },
          { path: routePaths.providerVehicleCatalogCreate, element: providerGuardRoute(<ProviderVehicleCatalogFormPage />) },
          { path: routePaths.providerVehicleCatalogEdit, element: providerGuardRoute(<ProviderVehicleCatalogFormPage />) },
          { path: routePaths.providerVehicleCatalogDetail, element: providerGuardRoute(<ProviderVehicleCatalogDetailPage />) },
          { path: routePaths.providerVehicleUnitCreate, element: providerGuardRoute(<ProviderVehicleUnitFormPage />) },
          { path: routePaths.providerVehicleDetail, element: providerGuardRoute(<ProviderVehicleDetailPage />) },
          { path: routePaths.providerBookings, element: providerGuardRoute(<ProviderBookingsPage />) },
          { path: routePaths.providerSchedule, element: providerGuardRoute(<ProviderSchedulePage />) },
          { path: routePaths.providerSessions, element: providerGuardRoute(<ProviderSessionsPage />) },
          { path: routePaths.providerMenu, element: providerGuardRoute(<ProviderMenuPage />) },
          { path: routePaths.providerPackages, element: providerGuardRoute(<ProviderPackagesPage />) },
          { path: routePaths.providerPackageCreate, element: providerGuardRoute(<ProviderPackageCreatePage />) },
          { path: routePaths.providerPackageCopy, element: providerGuardRoute(<ProviderPackageCopyPage />) },
          { path: routePaths.providerPackageEdit, element: providerGuardRoute(<ProviderPackageEditPage />) },
          { path: routePaths.providerSubscriptions, element: providerGuardRoute(<ProviderSubscriptionsPage />) },
          { path: routePaths.providerPromotions, element: providerGuardRoute(<ProviderPromotionsPage />) },
          { path: routePaths.providerPromotionCreate, element: providerGuardRoute(<ProviderPromotionCreatePage />) },
          { path: routePaths.providerPromotionCopy, element: providerGuardRoute(<ProviderPromotionCopyPage />) },
          { path: routePaths.providerPromotionEdit, element: providerGuardRoute(<ProviderPromotionEditPage />) },
          { path: routePaths.providerStaff, element: providerGuardRoute(<ProviderStaffPage />) },
          { path: routePaths.providerStaffDetail, element: providerGuardRoute(<ProviderStaffDetailPage />) },
          { path: routePaths.providerRevenue, element: providerGuardRoute(<ProviderRevenuePage />) },
          { path: routePaths.providerContests, element: providerGuardRoute(<ProviderContestsPage />) },
          { path: routePaths.providerContestCreate, element: providerGuardRoute(<ProviderContestFormPage />) },
          { path: routePaths.providerContestEdit, element: providerGuardRoute(<ProviderContestFormPage />) },
          { path: routePaths.providerContestRuntime, element: providerGuardRoute(<ProviderContestRuntimePage />) },
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
          { path: routePaths.adminAmenities, element: guardRoute(<AdminAmenitiesPage />, ["admin"]) },
          { path: routePaths.adminTrackTypes, element: guardRoute(<AdminTrackTypesPage />, ["admin"]) },
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
