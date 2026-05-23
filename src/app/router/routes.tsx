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
import { BookingDetailPage } from "@/pages/booking/BookingDetailPage"
import { PaymentResultPage } from "@/pages/booking/PaymentResultPage"
import { CafeDetailPage } from "@/pages/customer/cafe-detail/CafeDetailPage"
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
          { path: routePaths.bookingDetail, element: <BookingDetailPage /> },
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
          <RoleGuard allowedRoles={["customer", "staff", "provider", "admin"]}>
            <DashboardLayout />
          </RoleGuard>
        ),
        children: [
          { path: routePaths.customerHome, element: <Navigate replace to={routePaths.customerProfile} /> },
          { path: routePaths.customerBookings, element: <CustomerBookingsPage /> },
          { path: routePaths.customerProfile, element: <CustomerProfilePage /> },
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



