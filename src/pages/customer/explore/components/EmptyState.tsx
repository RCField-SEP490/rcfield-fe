import { SlidersHorizontal } from "lucide-react"
import { Button } from "@/shared/ui/button"

interface EmptyStateProps {
  onClear: () => void
}

export function EmptyState({ onClear }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-200/60 shadow-sm min-h-[300px] space-y-4">
      <div className="h-14 w-14 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
        <SlidersHorizontal className="h-7 w-7" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-black text-slate-900">Không tìm thấy sân chơi/xe phù hợp</h3>
        <p className="text-xs text-slate-500 font-semibold max-w-sm">
          Thử thay đổi từ khóa tìm kiếm hoặc mở rộng các bộ lọc nâng cao như khoảng giá, loại đường đua để nhận thêm kết quả.
        </p>
      </div>
      <Button
        onClick={onClear}
        className="bg-slate-950 hover:bg-orange-500 text-white font-bold h-9 text-xs rounded-xl"
      >
        Đặt lại bộ lọc
      </Button>
    </div>
  )
}
