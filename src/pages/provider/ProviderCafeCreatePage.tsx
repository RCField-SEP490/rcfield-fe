import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router"
import { toast } from "sonner"

import { routePaths } from "@/app/router/route-paths"
import { cafeApi, cafeQueryKeys } from "@/features/cafes/api/cafe.api"
import type { CafeUpsertBody } from "@/features/cafes/types"
import { ProviderCafeForm } from "@/pages/provider/components/ProviderCafeForm"
import { ProviderPageHeader } from "@/pages/provider/components/ProviderPrimitives"
import { ProviderShell } from "@/pages/provider/components/ProviderShell"
import { Button } from "@/shared/ui/button"

export function ProviderCafeCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: async ({ values, files }: { values: CafeUpsertBody; files: File[] }) => {
      const cafe = await cafeApi.createCafe(values)
      if (files.length > 0) {
        await cafeApi.uploadCafeImages(cafe.id, files)
      }
      return cafe
    },
    onSuccess: async (cafe) => {
      await queryClient.invalidateQueries({ queryKey: cafeQueryKeys.all })
      toast.success("Đã tạo cơ sở", { description: cafe.name })
      navigate(routePaths.providerCafeDetail.replace(":cafeId", cafe.id))
    },
    onError: () => {
      toast.error("Không thể tạo cơ sở", {
        description: "Vui lòng kiểm tra dữ liệu nhập và trạng thái tài khoản provider.",
      })
    },
  })

  return (
    <ProviderShell>
      <ProviderPageHeader
        title="Thêm cơ sở"
        description="Tạo cơ sở xe RC mới cho provider. Cơ sở mới sẽ ở trạng thái chờ duyệt."
        actions={
          <Button type="button" variant="outline" onClick={() => navigate(routePaths.providerCafes)} className="h-10 gap-2 rounded-lg border-[#c4c7c8] bg-[#f1edec] text-[#1c1b1b] hover:bg-[#e5e2e1]">
            <ArrowLeft className="size-5" />
            Danh sách cơ sở
          </Button>
        }
      />
      <div className="p-4 md:p-6">
        <ProviderCafeForm
          isPending={createMutation.isPending}
          submitLabel="Tạo cơ sở"
          onCancel={() => navigate(routePaths.providerCafes)}
          onSubmit={async (values, files) => {
            await createMutation.mutateAsync({ values, files })
          }}
        />
      </div>
    </ProviderShell>
  )
}
