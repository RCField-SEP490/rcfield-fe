export interface MockBooking {
  bookingId: string
  cafeName: string
  trackName: string
  dateTime: string
  type: "rent" | "byoc" // Rented vehicle or Bring Your Own Car
  vehicleName: string
  depositAmount: number
  totalAmount: number
  status: "pending" | "confirmed" | "completed" | "cancelled"
}

export interface MockVehicle {
  vehicleId: string
  name: string
  scale: string // e.g., "1/10", "1/8"
  chassisType: "Drift" | "Touring" | "Crawler" | "Off-Road"
  frequency: string // e.g., "2.4 GHz"
  status: "approved" | "pending" | "rejected"
  imageUrl: string
  registeredDate: string
}

export interface MockPackage {
  packageId: string
  name: string
  price: number
  totalSlots: number
  usedSlots: number
  purchasedDate: string
  expiryDate: string
  status: "active" | "expired"
}

export interface MockReview {
  reviewId: string
  cafeName: string
  trackName: string
  rating: number
  comment: string
  dateCreated: string
}

// 1. Mock Bookings Dataset
export const mockCustomerBookings: MockBooking[] = [
  {
    bookingId: "BK-8829",
    cafeName: "Drift Town Sài Gòn",
    trackName: "Đường đua Super Drift A",
    dateTime: "2026-05-24 14:00 - 15:30",
    type: "rent",
    vehicleName: "Mazda RX-7 FD3S (Scale 1/10)",
    depositAmount: 150000,
    totalAmount: 320000,
    status: "confirmed"
  },
  {
    bookingId: "BK-7612",
    cafeName: "RC Cafe Hà Nội Speed",
    trackName: "Đường Cao Tốc Khép Kín B",
    dateTime: "2026-05-28 09:30 - 11:00",
    type: "byoc",
    vehicleName: "Yoko YD-2 Custom (Xe cá nhân)",
    depositAmount: 50000,
    totalAmount: 120000,
    status: "pending"
  },
  {
    bookingId: "BK-4412",
    cafeName: "Drift Town Sài Gòn",
    trackName: "Đường đua Super Drift A",
    dateTime: "2026-05-15 18:00 - 19:00",
    type: "rent",
    vehicleName: "Nissan GT-R R35 Drift (Scale 1/10)",
    depositAmount: 150000,
    totalAmount: 300000,
    status: "completed"
  },
  {
    bookingId: "BK-3109",
    cafeName: "Mini Racer Đà Nẵng",
    trackName: "Vòng đua Phố Cổ",
    dateTime: "2026-05-02 15:00 - 16:30",
    type: "rent",
    vehicleName: "Subaru BRZ Drift (Scale 1/10)",
    depositAmount: 150000,
    totalAmount: 320000,
    status: "cancelled"
  }
]

// 2. Mock Vehicles Dataset (BYOC - Bring Your Own Car)
export const mockCustomerVehicles: MockVehicle[] = [
  {
    vehicleId: "VH-091",
    name: "Yokomo YD-2ZX Drift Special",
    scale: "1/10",
    chassisType: "Drift",
    frequency: "2.4 GHz (Sanwa)",
    status: "approved",
    imageUrl: "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&q=80&w=400",
    registeredDate: "2026-01-12"
  },
  {
    vehicleId: "VH-182",
    name: "Traxxas Slash 4X4 VXL Short Course",
    scale: "1/8",
    chassisType: "Off-Road",
    frequency: "2.4 GHz (TQi)",
    status: "pending",
    imageUrl: "https://images.unsplash.com/photo-1531384441138-2736e62e0919?auto=format&fit=crop&q=80&w=400",
    registeredDate: "2026-05-20"
  },
  {
    vehicleId: "VH-045",
    name: "Tamiya TT-02 Subaru Impreza",
    scale: "1/10",
    chassisType: "Touring",
    frequency: "2.4 GHz (Futaba)",
    status: "approved",
    imageUrl: "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&q=80&w=400",
    registeredDate: "2025-11-05"
  }
]

// 3. Mock Packages Dataset
export const mockCustomerPackages: MockPackage[] = [
  {
    packageId: "PKG-01",
    name: "Gói Drift Đam Mê 10 Lượt",
    price: 900000,
    totalSlots: 10,
    usedSlots: 4,
    purchasedDate: "2026-04-10",
    expiryDate: "2026-10-10",
    status: "active"
  },
  {
    packageId: "PKG-02",
    name: "Thẻ Thành Viên Tập Luyện Cuối Tuần",
    price: 1500000,
    totalSlots: 20,
    usedSlots: 20,
    purchasedDate: "2025-11-01",
    expiryDate: "2026-02-01",
    status: "expired"
  }
]

// 4. Mock Reviews Dataset
export const mockCustomerReviews: MockReview[] = [
  {
    reviewId: "RV-441",
    cafeName: "Drift Town Sài Gòn",
    trackName: "Đường đua Super Drift A",
    rating: 5,
    comment: "Sân đua cực kỳ mượt mà, dịch vụ Serious Inspection làm việc chuyên nghiệp, nhân viên vui tính. Xe Mazda RX-7 được bảo dưỡng cẩn thận chạy rất êm tay!",
    dateCreated: "2026-05-16"
  },
  {
    reviewId: "RV-292",
    cafeName: "RC Cafe Hà Nội Speed",
    trackName: "Đường Cao Tốc Khép Kín B",
    rating: 4,
    comment: "Không gian rộng rãi, nhiều góc cua kỹ thuật khá khó. Đồ uống ngon, tuy nhiên cuối tuần hơi đông phải đặt lịch trước khá lâu mới có slot đẹp.",
    dateCreated: "2026-04-20"
  }
]
