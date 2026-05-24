import { createBrowserRouter } from "react-router"
import type { ReactNode } from "react"
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
import { ProviderBookingsPage } from "@/pages/provider/ProviderBookingsPage"
import { ProviderCafeDetailPage } from "@/pages/provider/ProviderCafeDetailPage"
import { ProviderCafesPage } from "@/pages/provider/ProviderCafesPage"
import { ProviderDashboardPage } from "@/pages/provider/ProviderDashboardPage"
import { ProviderMenuPage } from "@/pages/provider/ProviderMenuPage"
import { ProviderPackagesPage } from "@/pages/provider/ProviderPackagesPage"
import { ProviderPromotionsPage } from "@/pages/provider/ProviderPromotionsPage"
import { ProviderRevenuePage } from "@/pages/provider/ProviderRevenuePage"
import { ProviderSessionsPage } from "@/pages/provider/ProviderSessionsPage"
import { ProviderStaffPage } from "@/pages/provider/ProviderStaffPage"
import { ProviderSubscriptionsPage } from "@/pages/provider/ProviderSubscriptionsPage"
import { ProviderVehiclesPage } from "@/pages/provider/ProviderVehiclesPage"
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
          { path: routePaths.cafes, element: <PlaceholderPage title="Cafes" /> },
          { path: routePaths.cafeDetail, element: <PlaceholderPage title="Cafe detail" /> },
          { path: routePaths.vehicleDetail, element: <PlaceholderPage title="Vehicle detail" /> },
          { path: routePaths.bookingCreate, element: <PlaceholderPage title="Create booking" /> },
          { path: routePaths.bookingDetail, element: <PlaceholderPage title="Booking detail" /> },
          { path: routePaths.paymentResult, element: <PlaceholderPage title="Payment result" /> },
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
          <RoleGuard allowedRoles={["customer", "staff", "provider", "admin"]}>
            <DashboardLayout />
          </RoleGuard>
        ),
        children: [
          { path: routePaths.customerBookings, element: guardRoute(<CustomerBookingsPage />, ["customer"]) },
          {
            path: routePaths.customerBookingDetail,
            element: guardRoute(<PlaceholderPage title="My booking detail" />, ["customer"]),
          },
          { path: routePaths.customerPackages, element: guardRoute(<CustomerPackagesPage />, ["customer"]) },
          {
            path: routePaths.customerSubscriptions,
            element: guardRoute(<PlaceholderPage title="Customer subscriptions" />, ["customer"]),
          },
          { path: routePaths.customerVehicles, element: guardRoute(<CustomerVehiclesPage />, ["customer"]) },
          { path: routePaths.customerReviews, element: guardRoute(<CustomerReviewsPage />, ["customer"]) },
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
          { path: routePaths.adminDashboard, element: guardRoute(<PlaceholderPage title="Admin dashboard" />, ["admin"]) },
          { path: routePaths.adminUsers, element: guardRoute(<PlaceholderPage title="Admin users" />, ["admin"]) },
          { path: routePaths.adminCafes, element: guardRoute(<PlaceholderPage title="Admin cafes" />, ["admin"]) },
          { path: routePaths.adminDisputes, element: guardRoute(<PlaceholderPage title="Admin disputes" />, ["admin"]) },
          { path: routePaths.adminPayments, element: guardRoute(<PlaceholderPage title="Admin payments" />, ["admin"]) },
          {
            path: routePaths.adminFeatureFlags,
            element: guardRoute(<PlaceholderPage title="Feature flags" />, ["admin"]),
          },
          {
            path: routePaths.adminTrustScoreLogs,
            element: guardRoute(<PlaceholderPage title="Trust score logs" />, ["admin"]),
          },
        ],
      },
      { path: routePaths.forbidden, element: <ForbiddenPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
])
