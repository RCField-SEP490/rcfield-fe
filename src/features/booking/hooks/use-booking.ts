import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { bookingApi, bookingQueryKeys } from '../api/booking.api'
import type { AvailabilityResponse, CheckAvailabilityParams, CreateBookingBody, CreateBookingResult, ListCafeBookingsParams, ListMyBookingsParams } from '../types/booking.types'

export function useAvailability(
  cafeId: string,
  params: CheckAvailabilityParams,
  enabled = true,
) {
  return useQuery({
    queryKey: bookingQueryKeys.availability(cafeId, params),
    queryFn: () => bookingApi.checkAvailability(cafeId, params),
    enabled: enabled && !!cafeId && !!params.slot_start && !!params.slot_end,
    staleTime: 30_000,
  })
}

export type HourlySlotAvailability = {
  hour: number
  data: AvailabilityResponse | null
}

/**
 * Fetches combined RENTAL + BYOC availability for each hour within the cafe's operating range.
 * A slot is "available" if RENTAL vehicles are available OR BYOC capacity remains.
 * Merged result: byoc_remaining from BYOC check, vehicles from RENTAL check.
 */
export function useDailyAvailability(
  cafeId: string,
  date: string,
  openHour = 8,
  closeHour = 22,
  trackConfigId?: string,
) {
  const isMock = cafeId.startsWith('cafe-')
  return useQuery({
    queryKey: ['daily-availability', cafeId, date, openHour, closeHour, trackConfigId ?? null],
    queryFn: async (): Promise<HourlySlotAvailability[]> => {
      const hours = Array.from({ length: closeHour - openHour }, (_, i) => i + openHour)
      const results = await Promise.all(
        hours.map(async (h) => {
          const hh = String(h).padStart(2, '0')
          const slotStart = `${date}T${hh}:00:00+07:00`
          const slotEnd =
            h + 1 === 24
              ? (() => {
                  const nextDate = new Date(`${date}T00:00:00Z`)
                  nextDate.setUTCDate(nextDate.getUTCDate() + 1)
                  return `${nextDate.toISOString().slice(0, 10)}T00:00:00+07:00`
                })()
              : `${date}T${String(h + 1).padStart(2, '0')}:00:00+07:00`
          try {
            const [rental, byoc] = await Promise.all([
              bookingApi.checkAvailability(cafeId, { slot_start: slotStart, slot_end: slotEnd, play_mode: 'RENTAL', ...(trackConfigId ? { track_config_id: trackConfigId } : {}) }),
              bookingApi.checkAvailability(cafeId, { slot_start: slotStart, slot_end: slotEnd, play_mode: 'BYOC', ...(trackConfigId ? { track_config_id: trackConfigId } : {}) }),
            ])
            const rentalCount = rental.vehicles?.length ?? 0
            const byocRemaining = byoc.byoc_remaining ?? 0
            return {
              hour: h,
              data: {
                play_mode: rentalCount > 0 ? 'RENTAL' : 'BYOC',
                available: rentalCount > 0 || byocRemaining > 0,
                byoc_remaining: byocRemaining,
                vehicles: rental.vehicles ?? [],
              } satisfies AvailabilityResponse,
            }
          } catch (err) {
            console.error(`checkAvailability failed for hour ${h}:`, err)
            return { hour: h, data: null }
          }
        }),
      )
      return results
    },
    enabled: !!cafeId && !!date && !isMock,
    staleTime: 60_000,
  })
}

export function useBooking(id: string | undefined) {
  return useQuery({
    queryKey: bookingQueryKeys.detail(id),
    queryFn: () => bookingApi.getBooking(id!),
    enabled: !!id,
  })
}

export function useMyBookings(params: ListMyBookingsParams = {}) {
  return useQuery({
    queryKey: bookingQueryKeys.mine(params),
    queryFn: () => bookingApi.listMyBookings(params),
  })
}

export function useCafeBookings(cafeId: string | undefined, params: ListCafeBookingsParams) {
  return useQuery({
    queryKey: bookingQueryKeys.cafe(cafeId ?? '', params),
    queryFn: () => bookingApi.listCafeBookings(cafeId!, params),
    enabled: !!cafeId && !!params.date,
    staleTime: 0,
  })
}

export function useCreateBooking() {
  const queryClient = useQueryClient()
  return useMutation<CreateBookingResult, Error, CreateBookingBody>({
    mutationFn: (body: CreateBookingBody) => bookingApi.createBooking(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bookingQueryKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['daily-availability'] })
    },
  })
}

export function useCreateCheckout() {
  return useMutation({
    mutationFn: (bookingId: string) => bookingApi.createCheckout(bookingId),
  })
}

export function useCancelBooking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: string; reason?: string }) =>
      bookingApi.cancelBooking(bookingId, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bookingQueryKeys.all })
    },
  })
}
