import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { StarRating } from "@/features/booking-review/components/StarRating"
import { getProviderReviews, updateReviewVisibility } from "@/features/booking-review/api/review.api"
import type { Review } from "@/features/booking-review/types"

interface ProviderReviewsTabProps {
  cafeId: string
}

export function ProviderReviewsTab({ cafeId }: ProviderReviewsTabProps) {
  const qc = useQueryClient()
  const [status, setStatus] = useState<"" | "VISIBLE" | "HIDDEN">("")
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ["provider-reviews", cafeId, status, page],
    queryFn: () =>
      getProviderReviews({ cafe_id: cafeId, status: status || undefined, page, limit: 20 }),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, next }: { id: string; next: "VISIBLE" | "HIDDEN" }) =>
      updateReviewVisibility(id, next),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["provider-reviews", cafeId] })
    },
  })

  const reviews: Review[] = data?.data ?? []
  const total = data?.total ?? 0
  const newBadge = (data?.newSince24h ?? 0) > 0

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-800">Đánh giá khách hàng</h3>
          {newBadge && (
            <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
              {data?.newSince24h} mới
            </span>
          )}
        </div>
        <select
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs"
          value={status}
          onChange={(e) => { setStatus(e.target.value as "" | "VISIBLE" | "HIDDEN"); setPage(1) }}
        >
          <option value="">Tất cả</option>
          <option value="VISIBLE">Hiện</option>
          <option value="HIDDEN">Ẩn</option>
        </select>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-sm text-slate-400">Đang tải...</div>
      ) : reviews.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-400">Không có đánh giá nào</div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div
              key={r.id}
              className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-4 ${
                r.status === "HIDDEN" ? "border-slate-200 bg-slate-50 opacity-70" : "border-slate-100 bg-white"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-800">{(r as Review & { customerName?: string }).customerName ?? "—"}</p>
                  <StarRating value={r.overallScore} readOnly size="sm" />
                  {r.status === "HIDDEN" && (
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] text-slate-600">Đã ẩn</span>
                  )}
                </div>
                {r.note && <p className="mt-1 text-sm text-slate-600">{r.note}</p>}
                <p className="mt-1 text-xs text-slate-400">
                  {new Date(r.createdAt).toLocaleDateString("vi-VN")}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  toggleMutation.mutate({
                    id: r.id,
                    next: r.status === "VISIBLE" ? "HIDDEN" : "VISIBLE",
                  })
                }
                disabled={toggleMutation.isPending}
              >
                {r.status === "VISIBLE" ? (
                  <><EyeOff className="mr-1 h-3.5 w-3.5" /> Ẩn</>
                ) : (
                  <><Eye className="mr-1 h-3.5 w-3.5" /> Hiện</>
                )}
              </Button>
            </div>
          ))}
        </div>
      )}

      {total > 20 && (
        <div className="flex justify-center gap-2">
          <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Trước
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={page * 20 >= total}
            onClick={() => setPage((p) => p + 1)}
          >
            Sau
          </Button>
        </div>
      )}
    </div>
  )
}
