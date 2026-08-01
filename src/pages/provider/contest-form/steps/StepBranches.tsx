import type { Dispatch, SetStateAction } from "react"
import { Building2, Crown } from "lucide-react"

import type { BackendCafe } from "@/features/cafes/types"
import { cn } from "@/shared/lib/utils"

import type { ContestFormState } from "../contest-form-types"

/**
 * Bước 1 — chọn chi nhánh tổ chức.
 *
 * Chi nhánh chủ nhà chính là phần tử đầu tiên của `participating_cafe_ids`:
 * backend lấy `branches[0]` làm `contest.cafeId` và gán role HOST. Trước đây thứ
 * tự đó phụ thuộc vào thứ tự provider tick checkbox nên chủ nhà là ngẫu nhiên,
 * và sửa danh sách có thể âm thầm đổi chủ nhà. Ở đây chọn chủ nhà là thao tác
 * tường minh, và nó luôn được đẩy lên đầu mảng.
 */
export function StepBranches({
  form,
  setForm,
  errors,
  cafes,
  isLoading,
}: {
  form: ContestFormState
  setForm: Dispatch<SetStateAction<ContestFormState>>
  errors: Record<string, string>
  cafes: BackendCafe[]
  isLoading: boolean
}) {
  const selectedIds = form.participating_cafe_ids
  const hostId = selectedIds[0] ?? null

  const toggleCafe = (cafeId: string) => {
    setForm((current) => {
      const isSelected = current.participating_cafe_ids.includes(cafeId)
      return {
        ...current,
        participating_cafe_ids: isSelected
          ? current.participating_cafe_ids.filter((id) => id !== cafeId)
          : [...current.participating_cafe_ids, cafeId],
      }
    })
  }

  const setHost = (cafeId: string) => {
    setForm((current) => ({
      ...current,
      participating_cafe_ids: [
        cafeId,
        ...current.participating_cafe_ids.filter((id) => id !== cafeId),
      ],
    }))
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((index) => (
          <div key={index} className="h-20 animate-pulse rounded-xl bg-[#f0eded]" />
        ))}
      </div>
    )
  }

  if (cafes.length === 0) {
    return (
      <p className="border-l-2 border-[#e5e2e1] py-3 pl-4 text-sm font-semibold text-[#747878]">
        Bạn chưa có chi nhánh nào đang hoạt động. Tạo và kích hoạt chi nhánh
        trước khi tổ chức giải đấu.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {errors.participating_cafe_ids ? (
        <p className="text-sm font-bold text-red-600">
          {errors.participating_cafe_ids}
        </p>
      ) : null}

      <ul className="space-y-3">
        {cafes.map((cafe) => {
          const isSelected = selectedIds.includes(cafe.id)
          const isHost = cafe.id === hostId

          return (
            <li key={cafe.id}>
              <div
                className={cn(
                  "rounded-xl border p-4 transition",
                  isSelected
                    ? "border-[#1c1b1b] bg-[#fcf8f8]"
                    : "border-[#e5e2e1] bg-white hover:border-[#c4c7c8]",
                )}
              >
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 size-4 accent-[#1c1b1b]"
                    checked={isSelected}
                    onChange={() => toggleCafe(cafe.id)}
                  />
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f0eded] text-[#5d5f5f]">
                    <Building2 className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-bold text-[#1c1b1b]">
                        {cafe.name}
                      </span>
                      {isHost ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#1c1b1b] px-2.5 py-0.5 text-xs font-bold text-white">
                          <Crown className="size-3" />
                          Chủ nhà
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block text-sm font-medium text-[#747878]">
                      {cafe.district}, {cafe.city}
                    </span>
                  </span>
                </label>

                {isSelected && selectedIds.length > 1 && !isHost ? (
                  <button
                    type="button"
                    onClick={() => setHost(cafe.id)}
                    className="mt-3 ml-[4.25rem] text-sm font-bold text-orange-600 hover:text-orange-700"
                  >
                    Đặt làm chi nhánh chủ nhà
                  </button>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>

      {selectedIds.length > 1 ? (
        <p className="border-l-2 border-amber-300 bg-amber-50/60 py-3 pl-4 text-sm font-medium leading-6 text-amber-900">
          Giải nhiều chi nhánh: ở bước sau, loại đường đua chỉ hiện những loại mà
          <strong> tất cả {selectedIds.length} chi nhánh</strong> đều có sân đang
          hoạt động.
        </p>
      ) : null}
    </div>
  )
}
