export type VehicleStatus = "available" | "rented" | "maintenance"

export interface Vehicle {
  id: string
  name: string
  scale: string
  type: string
  image: string
  pricePerHour: number
  status: VehicleStatus
  specs: {
    battery: string
    motor: string
    brand: string
  }
}

export interface Cafe {
  id: string
  providerId?: string
  name: string
  slug: string
  rating: number
  reviewsCount: number
  phone?: string | null
  status?: "PENDING" | "ACTIVE" | "SUSPENDED"
  address: string
  district: string
  city: string
  image: string
  images?: string[]
  priceRange: string
  slotDurationMinutes?: number
  slotFeeRate?: number
  maxConcurrentBookings?: number
  minBookingNoticeMinutes?: number
  byocCapacity?: number
  trackTypes: string[]
  features: string[]
  description: string
  coordinates: { x: number; y: number }
  availableVehicles: Vehicle[]
}

export type CafeSearchParams = {
  query?: string
  city?: string
  trackType?: string
  priceRange?: string
  feature?: string
  date?: string
  vehicleType?: string
}

export type ExploreCafe = Cafe
export type ExploreVehicle = Vehicle

// Re-export mock data from separate file
export { mockCafes } from "./mock-cafes"
