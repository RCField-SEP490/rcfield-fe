import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import {
  customerPackageApi,
  customerPackageQueryKeys,
  type CustomerPackageStatus,
} from '../api/customer-package.api'

export function usePublicPackages(cafeId?: string) {
  return useQuery({
    queryKey: customerPackageQueryKeys.public(cafeId),
    queryFn: () => customerPackageApi.listPublic(cafeId!),
    enabled: !!cafeId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useMyPackages(params?: { status?: CustomerPackageStatus; cafe_id?: string }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return useQuery({
    queryKey: customerPackageQueryKeys.mine(params),
    queryFn: () => customerPackageApi.listMine(params),
    enabled: isAuthenticated,
  })
}

export function usePackageUsageHistory(customerPackageId?: string) {
  return useQuery({
    queryKey: customerPackageQueryKeys.usage(customerPackageId),
    queryFn: () => customerPackageApi.getUsageHistory(customerPackageId!),
    enabled: !!customerPackageId,
  })
}

export function usePurchasePackage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ cafeId, packageId }: { cafeId: string; packageId: string }) =>
      customerPackageApi.purchase(cafeId, packageId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: customerPackageQueryKeys.all })
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? 'Mua gói thất bại. Vui lòng thử lại.')
    },
  })
}
