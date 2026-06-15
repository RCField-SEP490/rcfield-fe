import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  mockCustomerReviews,
  type MockReview
} from "@/shared/data/user-mock-data"
import {
  Star,
  Plus,
  Calendar,
  MapPin,
  ThumbsUp,
  Award,
} from "lucide-react"

import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card"
import { Label } from "@/shared/ui/label"
import { Input } from "@/shared/ui/input"
import { toast } from "sonner"
import { CustomerSubNav } from "./components/CustomerSubNav"
import { CustomerPageShell } from "./components/CustomerPageShell"

// Zod validation for reviews
const reviewSchema = z.object({
  cafeName: z.string().min(1, { message: "Vui lòng chọn cơ sở cafe" }),
  trackName: z.string().min(1, { message: "Vui lòng nhập tên đường đua" }),
  rating: z.number().min(1).max(5),
  comment: z.string().min(5, { message: "Nội dung phản hồi phải chứa ít nhất 5 ký tự" })
})

type ReviewFormValues = z.infer<typeof reviewSchema>

export function CustomerReviewsPage() {
  const [reviews, setReviews] = useState<MockReview[]>(mockCustomerReviews)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [hoveredStar, setHoveredStar] = useState<number | null>(null)
  const [selectedRating, setSelectedRating] = useState(5)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      cafeName: "Drift Town Sài Gòn",
      trackName: "Đường đua Super Drift A",
      rating: 5,
      comment: ""
    }
  })

  // Submit handler
  const onSubmit = (data: ReviewFormValues) => {
    const newReview: MockReview = {
      reviewId: `RV-${reviews.length + 101}`,
      cafeName: data.cafeName,
      trackName: data.trackName,
      rating: data.rating,
      comment: data.comment,
      dateCreated: new Date().toISOString().split('T')[0]
    }

    setReviews(prev => [newReview, ...prev])
    setIsFormOpen(false)
    reset()
    setSelectedRating(5)
    toast.success("Đăng tải phản hồi thành công!", {
      description: "Cảm ơn đóng góp của bạn để nâng cấp chất lượng dịch vụ của RCField!"
    })
  }

  const handleStarClick = (starNum: number) => {
    setSelectedRating(starNum)
    setValue("rating", starNum)
  }

  return (
    <CustomerPageShell>
        <CustomerSubNav activeTab="reviews" />

        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-700">Đánh giá & Phản hồi của tôi</h2>
          <Button
            className="bg-slate-950 hover:bg-slate-900 text-white font-bold h-9 px-4 rounded-xl text-xs"
            onClick={() => setIsFormOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Viết đánh giá mới
          </Button>
        </div>

        {/* REVIEWS GRID LIST */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map((rev) => (
            <Card key={rev.reviewId} className="border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col bg-white overflow-hidden">
              
              {/* Review Card Header */}
              <CardHeader className="pb-3 flex flex-row items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base font-extrabold text-slate-950 flex items-center gap-1.5">
                    {rev.cafeName}
                  </CardTitle>
                  <CardDescription className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {rev.trackName}
                  </CardDescription>
                </div>
                
                {/* Rating display */}
                <div className="flex items-center gap-0.5 bg-orange-50 px-2 py-1 rounded-lg">
                  <Star className="h-3.5 w-3.5 text-orange-500 fill-orange-500 shrink-0" />
                  <span className="text-xs font-extrabold text-orange-950">{rev.rating}.0</span>
                </div>
              </CardHeader>

              {/* Review content comment */}
              <CardContent className="text-xs text-slate-700 font-semibold leading-relaxed border-t border-slate-50 pt-3.5 flex-grow">
                <p className="italic text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  "{rev.comment}"
                </p>
              </CardContent>

              {/* Card Footer actions */}
              <CardFooter className="bg-slate-50/50 px-5 py-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Ngày đăng: {rev.dateCreated}
                </span>

                <div className="flex items-center gap-1 text-slate-500 hover:text-slate-900 cursor-pointer">
                  <ThumbsUp className="h-3.5 w-3.5" />
                  Hữu ích
                </div>
              </CardFooter>

            </Card>
          ))}
        </div>

      {/* CREATE REVIEW DIALOG MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200/80 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200 text-left relative">
            
            {/* Modal title */}
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-950 flex items-center gap-2">
                <Award className="h-5 w-5 text-orange-500" />
                Viết đánh giá & Nhận xét
              </h3>
              <p className="text-xs font-semibold text-slate-500">
                Chia sẻ trải nghiệm thực tế để giúp cộng đồng tay đua RC lựa chọn sân chơi phù hợp.
              </p>
            </div>

            {/* Review Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              
              {/* Select Cafe */}
              <div className="space-y-1.5">
                <Label htmlFor="cafeName" className="text-xs font-bold text-slate-700">Cơ sở Cafe liên kết</Label>
                <select 
                  id="cafeName" 
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs font-semibold focus:border-orange-500 focus:outline-none"
                  {...register("cafeName")}
                >
                  <option value="Drift Town Sài Gòn">Drift Town Sài Gòn</option>
                  <option value="RC Cafe Hà Nội Speed">RC Cafe Hà Nội Speed</option>
                  <option value="Mini Racer Đà Nẵng">Mini Racer Đà Nẵng</option>
                </select>
              </div>

              {/* Track Name */}
              <div className="space-y-1.5">
                <Label htmlFor="trackName" className="text-xs font-bold text-slate-700">Tên đường đua chạy thử</Label>
                <Input 
                  id="trackName" 
                  type="text" 
                  placeholder="Đường đua Super Drift A" 
                  className={`h-10 rounded-lg border-slate-200 focus:border-orange-500 ${errors.trackName ? 'border-red-500' : ''}`}
                  {...register("trackName")}
                />
                {errors.trackName && (
                  <p className="text-[11px] font-bold text-red-500">{errors.trackName.message}</p>
                )}
              </div>

              {/* Rating Star selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Điểm số (Sao)</Label>
                <div className="flex items-center gap-1.5 select-none pt-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleStarClick(star)}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(null)}
                      className="p-1 hover:scale-110 transition-transform focus:outline-none"
                    >
                      <Star 
                        className={`h-7 w-7 transition-all duration-150 ${star <= (hoveredStar ?? selectedRating) ? 'text-orange-500 fill-orange-500' : 'text-slate-200'}`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-extrabold text-orange-950 ml-2">
                    {selectedRating}.0 / 5.0
                  </span>
                </div>
              </div>

              {/* Review text */}
              <div className="space-y-1.5">
                <Label htmlFor="comment" className="text-xs font-bold text-slate-700">Nội dung nhận xét</Label>
                <textarea 
                  id="comment" 
                  rows={4}
                  placeholder="Nêu cảm nghĩ về cơ sở vật chất, hệ thống chấm điểm Ledger, chất lượng thuê xe..."
                  className={`w-full p-3 rounded-lg border border-slate-200 text-xs font-semibold focus:border-orange-500 focus:outline-none ${errors.comment ? 'border-red-500' : ''}`}
                  {...register("comment")}
                />
                {errors.comment && (
                  <p className="text-[11px] font-bold text-red-500">{errors.comment.message}</p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 justify-end pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="border-slate-200 font-bold h-10 text-xs rounded-xl"
                  onClick={() => {
                    setIsFormOpen(false)
                    reset()
                  }}
                >
                  Hủy bỏ
                </Button>
                <Button 
                  type="submit" 
                  className="bg-slate-950 hover:bg-slate-900 text-white font-bold h-10 text-xs rounded-xl"
                >
                  Đăng tải đánh giá
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}

    </CustomerPageShell>
  )
}
