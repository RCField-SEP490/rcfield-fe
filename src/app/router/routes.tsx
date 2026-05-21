import { createBrowserRouter } from "react-router"
import { AuthLayout } from "@/app/layouts/AuthLayout"
import { DashboardLayout } from "@/app/layouts/DashboardLayout"
import { PublicLayout } from "@/app/layouts/PublicLayout"
import { RootLayout } from "@/app/layouts/RootLayout"
import { RoleGuard } from "@/shared/components/RoleGuard"
import { ForbiddenPage } from "@/pages/ForbiddenPage"
import { NotFoundPage } from "@/pages/NotFoundPage"
import { PlaceholderPage } from "@/pages/PlaceholderPage"
import { LandingPage } from "@/pages/LandingPage"
import { LoginPage } from "@/pages/LoginPage"
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
          { path: routePaths.register, element: <PlaceholderPage title="Register" /> },
          { path: routePaths.forgotPassword, element: <PlaceholderPage title="Forgot password" /> },
          { path: routePaths.resetPassword, element: <PlaceholderPage title="Reset password" /> },
        ],
      },
      {
        element: (
          <RoleGuard allowedRoles={["customer", "staff", "provider", "admin"]}>
            <DashboardLayout />
          </RoleGuard>
        ),
        children: [
          { path: routePaths.customerBookings, element: <PlaceholderPage title="My bookings" /> },
          { path: routePaths.customerBookingDetail, element: <PlaceholderPage title="My booking detail" /> },
          { path: routePaths.customerPackages, element: <PlaceholderPage title="Customer packages" /> },
          { path: routePaths.customerSubscriptions, element: <PlaceholderPage title="Customer subscriptions" /> },
          { path: routePaths.customerVehicles, element: <PlaceholderPage title="Customer vehicles" /> },
          { path: routePaths.customerReviews, element: <PlaceholderPage title="Customer reviews" /> },
          { path: routePaths.staffDashboard, element: <PlaceholderPage title="Staff dashboard" /> },
          { path: routePaths.staffTodayBookings, element: <PlaceholderPage title="Today bookings" /> },
          { path: routePaths.staffSessionDetail, element: <PlaceholderPage title="Session detail" /> },
          { path: routePaths.staffInspection, element: <PlaceholderPage title="Inspection" /> },
          { path: routePaths.staffFnbOrders, element: <PlaceholderPage title="FnB orders" /> },
          { path: routePaths.providerDashboard, element: <PlaceholderPage title="Provider dashboard" /> },
          { path: routePaths.providerCafes, element: <PlaceholderPage title="Provider cafes" /> },
          { path: routePaths.providerCafeDetail, element: <PlaceholderPage title="Provider cafe detail" /> },
          { path: routePaths.providerVehicles, element: <PlaceholderPage title="Provider vehicles" /> },
          { path: routePaths.providerBookings, element: <PlaceholderPage title="Provider bookings" /> },
          { path: routePaths.providerSessions, element: <PlaceholderPage title="Provider sessions" /> },
          { path: routePaths.providerMenu, element: <PlaceholderPage title="Provider menu" /> },
          { path: routePaths.providerPackages, element: <PlaceholderPage title="Provider packages" /> },
          { path: routePaths.providerSubscriptions, element: <PlaceholderPage title="Provider subscriptions" /> },
          { path: routePaths.providerPromotions, element: <PlaceholderPage title="Provider promotions" /> },
          { path: routePaths.providerStaff, element: <PlaceholderPage title="Provider staff" /> },
          { path: routePaths.providerRevenue, element: <PlaceholderPage title="Provider revenue" /> },
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
