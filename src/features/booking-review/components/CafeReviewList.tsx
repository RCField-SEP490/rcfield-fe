import { useQuery } from "@tanstack/react-query"
import { StarRating } from "./StarRating"
import { Button } from "@/shared/ui/button"
import { getCafeReviews } from "../api/review.api"
import { useState } from "react"

interface CafeReviewListProps {
  cafeId: string
}

export function CafeReviewList({ cafeId }: CafeReviewListProps) {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useQuery({
    queryKey: ["cafe-reviews", cafeId, page],
    queryFn: () => getCafeReviews(cafeId, page),
  })

  const reviews = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / 10)

  if (isLoading) {
    return <div className="py-4 text-center text-sm text-slate-400">Đang tải đánh giá...</div>
  }

  if (!reviews.length) {
    return null
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="rounded-xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-800">{review.customerName}</p>
              <p className="text-xs text-slate-400">
                {new Date(review.createdAt).toLocaleDateString("vi-VN")}
              </p>
            </div>
            <StarRating value={review.overallScore} readOnly size="sm" />
          </div>
          {review.note && (
            <p className="mt-2 text-sm text-slate-600">{review.note}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            {review.staffScore && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                Nhân viên: {review.staffScore}/5
              </span>
            )}
            {review.facilityScore && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                Cơ sở: {review.facilityScore}/5
              </span>
            )}
            {review.vehicleScore && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                Xe: {review.vehicleScore}/5
              </span>
            )}
          </div>
        </div>
      ))}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Trước
          </Button>
          <span className="flex items-center text-xs text-slate-500">
            {page} / {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Sau
          </Button>
        </div>
      )}
    </div>
  )
}
