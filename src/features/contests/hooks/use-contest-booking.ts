import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { contestBookingApi, contestBookingQueryKeys } from "../api/contest-booking.api"
import { contestQueryKeys } from "../api/contest.api"
import type { ContestRentalBookingCreateBody } from "../types"

export function useContestBookings(contestId?: string) {
  return useQuery({
    queryKey: contestBookingQueryKeys.list(contestId),
    queryFn: () => contestBookingApi.listContestBookings(contestId!),
    enabled: Boolean(contestId),
  })
}

export function useCreateContestRentalBooking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: ContestRentalBookingCreateBody) =>
      contestBookingApi.createContestRentalBooking(body),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({
        queryKey: contestBookingQueryKeys.list(result.contestId),
      })
    },
  })
}

export function useGenerateFinalBracket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (contestId: string) =>
      contestBookingApi.generateFinalBracket(contestId),
    onSuccess: (_matches, contestId) => {
      void queryClient.invalidateQueries({
        queryKey: contestQueryKeys.matches(contestId),
      })
      void queryClient.invalidateQueries({
        queryKey: contestQueryKeys.metrics(contestId),
      })
    },
  })
}
