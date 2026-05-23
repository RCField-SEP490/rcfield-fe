import { createBrowserRouter } from "react-router"
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
          { path: routePaths.customerBookings, element: <CustomerBookingsPage /> },
          { path: routePaths.customerBookingDetail, element: <PlaceholderPage title="My booking detail" /> },
          { path: routePaths.customerPackages, element: <CustomerPackagesPage /> },
          { path: routePaths.customerSubscriptions, element: <PlaceholderPage title="Customer subscriptions" /> },
          { path: routePaths.customerVehicles, element: <CustomerVehiclesPage /> },
          { path: routePaths.customerReviews, element: <CustomerReviewsPage /> },
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
          { path: routePaths.adminDashboard, element: <PlaceholderPage title="Admin dashboard" /> },
          { path: routePaths.adminUsers, element: <PlaceholderPage title="Admin users" /> },
          { path: routePaths.adminCafes, element: <PlaceholderPage title="Admin cafes" /> },
          { path: routePaths.adminDisputes, element: <PlaceholderPage title="Admin disputes" /> },
          { path: routePaths.adminPayments, element: <PlaceholderPage title="Admin payments" /> },
          { path: routePaths.adminFeatureFlags, element: <PlaceholderPage title="Feature flags" /> },
          { path: routePaths.adminTrustScoreLogs, element: <PlaceholderPage title="Trust score logs" /> },
        ],
      },
      { path: routePaths.forbidden, element: <ForbiddenPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
])
