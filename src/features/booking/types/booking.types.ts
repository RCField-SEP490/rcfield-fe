export type BookingPlayMode = 'RENTAL' | 'BYOC'

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'NO_SHOW'
  | 'COMPLETED'
  | 'CANCELLED'

export type PaymentComponentType =
  | 'SLOT_FEE'
  | 'RENTAL_FEE'
  | 'SECURITY_DEPOSIT'
  | 'FNB_PREORDER'
  | 'FB_PREORDER'
  | 'EXTENSION_FEE'
  | 'DAMAGE_CHARGE'
  | 'PLATFORM_FEE'

export type PaymentComponentStatus =
  | 'PENDING'
  | 'HELD'
  | 'CAPTURED'
  | 'REFUNDED'
  | 'DISBURSED'
  | 'PENDING_REFUND'
  | 'PARTIALLY_REFUNDED'

export interface PaymentComponentResponse {
  id: string
  bookingId: string
  type: PaymentComponentType
  amount: number
  status: PaymentComponentStatus
  bookingVehicleId: string | null
  refundedAmount?: number
  refundedAt?: string | null
}

export interface AvailableVehicle {
  vehicle_id: string
  vehicle_identifier: string
  catalog_name: string
  tier: string
  rental_fee_per_hour: number
  security_deposit: number
}

export interface AvailabilityResponse {
  play_mode: BookingPlayMode
  available: boolean
  byoc_remaining?: number
  vehicles: AvailableVehicle[]
}

export interface BookingParticipant {
  id: string
  bookingId: string
  userId: string | null
  participantType: 'BOOKER' | 'REGISTERED_USER' | 'WALK_IN_GUEST'
  isPrimaryResponsible: boolean
  guestName: string | null
  guestPhone: string | null
  resolvedName: string | null
  resolvedPhone: string | null
}

export interface BookingVehicleItem {
  id: string
  bookingId: string
  vehicleId: string
  rentalFeeSnapshot: number | null
  catalogName: string | null
  tier: string | null
  identifier: string | null
  color: string | null
  coverImageUrl: string | null
}

export interface FnbOrderItem {
  id: string
  menuItemId: string
  itemName: string | null
  quantity: number
  unitPrice: number
  subtotal: number
  notes: string | null
}

export interface FnbOrder {
  id: string
  bookingId: string
  orderType: string
  items: FnbOrderItem[]
}

export interface BookingResponse {
  id: string
  customerId: string
  cafeId: string
  playMode: BookingPlayMode
  status: BookingStatus
  slotStart: string
  slotEnd: string
  snapshot: Record<string, unknown> | null
  paymentExpiresAt: string | null
  checkInCode: string | null
  createdAt: string
  updatedAt: string
  participants: BookingParticipant[]
  vehicles: BookingVehicleItem[]
  payment_components: PaymentComponentResponse[]
  fnb_order: FnbOrder | null
  cafe: { name: string; address: string; city: string } | null
  track_type_name: string | null
  session: {
    id: string
    status: string
    plannedEndAt: string
    actualStartAt: string
    actualEndAt: string | null
  } | null
}

export interface BookingListItem {
  id: string
  customerId: string
  cafeId: string
  playMode: BookingPlayMode
  status: BookingStatus
  slotStart: string
  slotEnd: string
  paymentExpiresAt: string | null
  checkInCode: string | null
  createdAt: string
  updatedAt: string
  session: {
    id: string
    status: string
    plannedEndAt: string
    actualStartAt: string | null
  } | null
}

export interface BookingListResponse {
  data: BookingListItem[]
  total: number
  page: number
  limit: number
}

export interface FnbItemBody {
  menu_item_id: string
  quantity: number
  notes?: string
}

export type BookingParticipantType = 'REGISTERED_USER' | 'WALK_IN_GUEST'

export interface ParticipantBody {
  user_id?: string
  participant_type: BookingParticipantType
  guest_name?: string
  guest_phone?: string
}

export interface CreateBookingBody {
  cafe_id: string
  play_mode: BookingPlayMode
  slot_start: string
  slot_end: string
  vehicle_ids: string[]
  participants: ParticipantBody[]
  fnb_items: FnbItemBody[]
  promotion_code?: string
  track_type_id?: string
  track_config_id?: string
  customer_package_id?: string
}

export interface CreateBookingResult {
  booking_id: string
  status: BookingStatus
  payment_expires_at: string
  total_amount: number
  breakdown: {
    slot_fee: number
    rental_fee: number
    security_deposit: number
    fnb_total: number
    discount: number
    total: number
  }
}

export interface CheckoutResponse {
  payment_url: string | null
  txn_ref: string
  total_amount: number
  confirmed?: boolean
  slots_used?: number
  slots_remaining_after?: number
}

export interface CheckAvailabilityParams {
  slot_start: string
  slot_end: string
  play_mode: BookingPlayMode
  track_type_id?: string
  track_config_id?: string
}

export interface ListMyBookingsParams {
  status?: BookingStatus
  page?: number
  limit?: number
}

export interface CafeBookingListItem {
  id: string
  customerId: string
  cafeId: string
  playMode: BookingPlayMode
  status: BookingStatus
  slotStart: string
  slotEnd: string
  paymentExpiresAt: string | null
  createdAt: string
  cancelledBy: string | null
  cancellationReason: string | null
}

export interface CafeBookingListResponse {
  data: CafeBookingListItem[]
  total: number
  page: number
  limit: number
}

export interface ListCafeBookingsParams {
  date: string
  status?: BookingStatus
  page?: number
  limit?: number
}
