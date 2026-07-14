import { api } from '@/shared/lib/axios'
import type {
  AvailabilityResponse,
  BookingListResponse,
  BookingResponse,
  CafeBookingListResponse,
  CheckAvailabilityParams,
  CheckoutResponse,
  CreateBookingBody,
  CreateBookingResult,
  ListCafeBookingsParams,
  ListMyBookingsParams,
} from '../types/booking.types'

interface ApiEnvelope<T> {
  success: boolean
  data: T
}

export const bookingQueryKeys = {
  all: ['bookings'] as const,
  mine: (params?: ListMyBookingsParams) => [...bookingQueryKeys.all, 'mine', params ?? {}] as const,
  detail: (id?: string) => [...bookingQueryKeys.all, 'detail', id] as const,
  cafe: (cafeId: string, params?: ListCafeBookingsParams) =>
    [...bookingQueryKeys.all, 'cafe', cafeId, params ?? {}] as const,
  availability: (cafeId: string, params: CheckAvailabilityParams) =>
    ['availability', cafeId, params] as const,
}

export const bookingApi = {
  checkAvailability: async (
    cafeId: string,
    params: CheckAvailabilityParams,
  ): Promise<AvailabilityResponse> => {
    const searchParams = new URLSearchParams()
    searchParams.append('slot_start', params.slot_start)
    searchParams.append('slot_end', params.slot_end)
    searchParams.append('play_mode', params.play_mode)
    if (params.track_type_id) {
      searchParams.append('track_type_id', params.track_type_id)
    }
    if (params.track_config_id) {
      searchParams.append('track_config_id', params.track_config_id)
    }

    const res = await api.get<ApiEnvelope<AvailabilityResponse>>(
      `/v1/cafes/${cafeId}/availability`,
      { params: searchParams },
    )
    return res.data.data
  },

  createBooking: async (body: CreateBookingBody): Promise<CreateBookingResult> => {
    const res = await api.post<ApiEnvelope<CreateBookingResult>>('/v1/bookings', body)
    return res.data.data
  },

  getBooking: async (id: string): Promise<BookingResponse> => {
    const res = await api.get<ApiEnvelope<BookingResponse>>(`/v1/bookings/${id}`)
    return res.data.data
  },

  listMyBookings: async (params: ListMyBookingsParams = {}): Promise<BookingListResponse> => {
    const res = await api.get<ApiEnvelope<BookingListResponse>>('/v1/bookings', { params })
    return res.data as unknown as BookingListResponse
  },

  listCafeBookings: async (
    cafeId: string,
    params: ListCafeBookingsParams,
  ): Promise<CafeBookingListResponse> => {
    const res = await api.get<ApiEnvelope<CafeBookingListResponse>>(
      `/v1/provider/cafes/${cafeId}/bookings`,
      { params },
    )
    return res.data.data
  },

  createCheckout: async (bookingId: string): Promise<CheckoutResponse> => {
    const res = await api.post<ApiEnvelope<CheckoutResponse>>(
      `/v1/bookings/${bookingId}/checkout`,
    )
    return res.data.data
  },

  createCheckoutAdditionalPayment: async (bookingId: string): Promise<CheckoutResponse> => {
    const res = await api.post<ApiEnvelope<CheckoutResponse>>(
      `/v1/bookings/${bookingId}/checkout-additional-payment`,
    )
    return res.data.data
  },

  mockCheckout: async (bookingId: string): Promise<void> => {
    await api.post(`/v1/bookings/${bookingId}/mock-checkout`)
  },

  cancelBooking: async (bookingId: string, reason?: string): Promise<BookingResponse> => {
    const res = await api.post<ApiEnvelope<BookingResponse>>(
      `/v1/bookings/${bookingId}/cancel`,
      { reason },
    )
    return res.data.data
  },
}
