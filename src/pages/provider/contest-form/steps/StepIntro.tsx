import type { Dispatch, SetStateAction } from "react"
import { useMutation } from "@tanstack/react-query"
import { Upload } from "lucide-react"
import { toast } from "sonner"

import { contestApi } from "@/features/contests/api/contest.api"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"

import { ContestFormField } from "../ContestFormField"
import type { ContestFormState } from "../contest-form-types"

export type SummaryRow = {
  label: string
  value: string
  stepIndex: number
}

const MAX_BANNER_BYTES = 5 * 1024 * 1024
const ACCEPTED_BANNER_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"]

/**
 * Bước 5 — phần khách nhìn thấy, kèm bảng kiểm lại toàn bộ cấu hình.
 *
 * Bảng tóm tắt có nút "Sửa" nhảy thẳng về đúng bước liên quan, để provider không
 * phải bấm Quay lại nhiều lần chỉ để đổi một giá trị.
 */
export function StepIntro({
  form,
  setForm,
  errors,
  contestId,
  summaryRows,
  onEditStep,
}: {
  form: ContestFormState
  setForm: Dispatch<SetStateAction<ContestFormState>>
  errors: Record<string, string>
  contestId?: string
  summaryRows: SummaryRow[]
  onEditStep: (index: number) => void
}) {
  const uploadBannerMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!contestId) throw new Error("Cần lưu giải đấu trước khi upload banner")
      return contestApi.uploadBanner(contestId, file)
    },
    onSuccess: (data) => {
      setForm((current) => ({ ...current, banner_image_url: data.banner_image_url }))
      toast.success("Upload banner thành công")
    },
    onError: () => {
      toast.error("Không thể upload banner")
    },
  })

  const handleBannerFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > MAX_BANNER_BYTES) {
      toast.error("Ảnh tối đa 5MB")
      return
    }
    if (!ACCEPTED_BANNER_TYPES.includes(file.type)) {
      toast.error("Chỉ hỗ trợ JPG, PNG, WEBP")
      return
    }
    uploadBannerMutation.mutate(file)
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <ContestFormField label="Tên giải đấu" error={errors.name}>
          <Input
            className="h-11"
            placeholder="Ví dụ: RCField Drift Cup 2026"
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
          />
        </ContestFormField>

        <ContestFormField label="Mô tả giải đấu" error={errors.description}>
          <Textarea
            rows={5}
            placeholder="Thể lệ tóm tắt, giải thưởng, lưu ý cho VĐV..."
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
          />
          <p className="text-xs leading-5 text-[#747878]">
            Hiển thị ở phần "Đôi nét về giải đấu" trên trang công khai.
          </p>
        </ContestFormField>

        <ContestFormField label="Banner giải đấu" error={errors.banner_image_url}>
          <div className="space-y-3">
            <Input
              className="h-11"
              placeholder="https://..."
              value={form.banner_image_url}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  banner_image_url: event.target.value,
                }))
              }
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-10 gap-2 rounded-lg"
                disabled={!contestId || uploadBannerMutation.isPending}
                onClick={() =>
                  document.getElementById("contest-banner-file")?.click()
                }
              >
                <Upload className="size-4" />
                {uploadBannerMutation.isPending ? "Đang upload..." : "Upload ảnh"}
              </Button>
              <input
                id="contest-banner-file"
                type="file"
                accept={ACCEPTED_BANNER_TYPES.join(",")}
                className="hidden"
                onChange={handleBannerFileChange}
              />
              {!contestId ? (
                <p className="text-sm text-[#747878]">
                  Tạo giải đấu xong mới upload được ảnh — tạm thời có thể dán
                  đường dẫn ảnh.
                </p>
              ) : null}
            </div>
            {form.banner_image_url ? (
              <div className="overflow-hidden rounded-xl border border-[#e5e2e1]">
                <img
                  src={form.banner_image_url}
                  alt="Xem trước banner"
                  className="h-40 w-full object-cover"
                />
              </div>
            ) : null}
          </div>
        </ContestFormField>
      </section>

      <section>
        <h3 className="text-sm font-black uppercase tracking-[0.14em] text-[#adaaaa]">
          Kiểm lại cấu hình
        </h3>
        <dl className="mt-4 divide-y divide-[#e5e2e1] border-y border-[#e5e2e1]">
          {summaryRows.map((row) => (
            <div
              key={row.label}
              className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3"
            >
              <dt className="w-44 shrink-0 text-sm font-semibold text-[#747878]">
                {row.label}
              </dt>
              <dd className="min-w-0 flex-1 text-sm font-bold text-[#1c1b1b]">
                {row.value}
              </dd>
              <button
                type="button"
                onClick={() => onEditStep(row.stepIndex)}
                className="shrink-0 text-sm font-bold text-orange-600 hover:text-orange-700"
              >
                Sửa
              </button>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}
