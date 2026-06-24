export type RevenuePeriod = 'daily' | 'weekly' | 'monthly';

export interface ProviderKpi {
  totalRevenue: number;
  totalBookings: number;
  completedBookings: number;
  cancellationRate: number;
  vehicleUtilizationRate: number;
  totalVehicles: number;
  inUseVehicles: number;
  availableVehicles: number;
  maintenanceVehicles: number;
  newCustomers: number;
}

export interface RevenueTrendItem {
  label: string;
  slotFee: number;
  rentalFee: number;
  fnbPreorder: number;
  securityDeposit: number;
  total: number;
}

export interface RevenueBreakdownItem {
  type: string;
  label: string;
  amount: number;
}

export interface BranchPerformanceItem {
  cafeId: string;
  cafeName: string;
  totalRevenue: number;
  bookingCount: number;
}

export interface RecentBookingItem {
  bookingId: string;
  cafeName: string;
  customerName: string;
  playMode: 'RENTAL' | 'BYOC';
  slotStart: string;
  status: string;
  totalCharged: number;
}
