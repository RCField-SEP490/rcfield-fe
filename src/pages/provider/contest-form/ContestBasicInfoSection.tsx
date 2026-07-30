import type { Dispatch, SetStateAction } from "react"
import { useMutation } from "@tanstack/react-query"
import { Upload } from "lucide-react"
import { toast } from "sonner"

import type { TrackType } from "@/features/cafes/types"
import type {
  ContestCatalogFormat,
  ContestCatalogType,
  ContestTemplate,
} from "@/features/contests/types"
import { contestApi } from "@/features/contests/api/contest.api"
import {
  Panel,
  PanelTitle,
} from "@/pages/provider/components/ProviderPrimitives"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"

import { ContestFormField } from "./ContestFormField"
import type { ContestFormState } from "./contest-form-types"

interface ContestBasicInfoSectionProps {
  form: ContestFormState
  setForm: Dispatch<SetStateAction<ContestFormState>>
  validationErrors: Record<string, string>
  trackTypes: TrackType[] | undefined
  contestTypes: ContestCatalogType[] | undefined
  contestFormats: ContestCatalogFormat[] | undefined
  contestTemplates: ContestTemplate[] | undefined
  contestId?: string
}

export function ContestBasicInfoSection({
  form,
  setForm,
  validationErrors,
  trackTypes,
  contestTypes,
  contestFormats,
  contestTemplates,
  contestId,
}: ContestBasicInfoSectionProps) {
  const uploadBannerMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!contestId) throw new Error("Cần lưu contest trước khi upload banner")
      return contestApi.uploadBanner(contestId, file)
    },
    onSuccess: (data) => {
      setForm((s) => ({ ...s, banner_image_url: data.banner_image_url }))
      toast.success("Upload banner thành công")
    },
    onError: () => {
      toast.error("Không thể upload banner")
    },
  })

  const handleBannerFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh tối đa 5MB")
      return
    }
    if (!["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type)) {
      toast.error("Chỉ hỗ trợ JPG, PNG, WEBP")
      return
    }
    uploadBannerMutation.mutate(file)
  }
  return (
    <Panel>
      <PanelTitle
        title="Thông tin giải đấu"
        subtitle="Thiết lập loại giải, lịch thi đấu và mốc đăng ký."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <ContestFormField label="Tên giải đấu" error={validationErrors["name"]}>
          <Input
            value={form.name}
            onChange={(e) =>
              setForm((s) => ({ ...s, name: e.target.value }))
            }
          />
        </ContestFormField>
        <ContestFormField
          label="Loại đường đua"
          error={validationErrors["track_type_id"]}
        >
          <select
            className="h-10 rounded-lg border border-[#c4c7c8] bg-white px-3 text-sm"
            value={form.track_type_id}
            onChange={(e) =>
              setForm((s) => ({ ...s, track_type_id: e.target.value }))
            }
          >
            <option value="">Chọn loại đường đua</option>
            {trackTypes?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </ContestFormField>
        <ContestFormField
          label="Loại giải"
          error={validationErrors["contest_type_id"]}
        >
          <select
            className="h-10 rounded-lg border border-[#c4c7c8] bg-white px-3 text-sm"
            value={form.contest_type_id}
            onChange={(e) =>
              setForm((s) => ({
                ...s,
                contest_type_id: e.target.value,
                contest_template_id: "",
              }))
            }
          >
            <option value="">Chọn loại giải</option>
            {contestTypes?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </ContestFormField>
        <ContestFormField
          label="Hình thức thi đấu"
          error={validationErrors["contest_format_id"]}
        >
          <select
            className="h-10 rounded-lg border border-[#c4c7c8] bg-white px-3 text-sm"
            value={form.contest_format_id}
            onChange={(e) =>
              setForm((s) => ({
                ...s,
                contest_format_id: e.target.value,
                contest_template_id: "",
              }))
            }
          >
            <option value="">Chọn hình thức thi đấu</option>
            {contestFormats?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.code === "QUALIFYING_FINAL"
                  ? "Vòng loại + Chung kết (Grand Prix)"
                  : item.name}
              </option>
            ))}
          </select>
        </ContestFormField>
        <ContestFormField
          label="Mẫu vận hành"
          className="md:col-span-2"
          error={validationErrors["contest_template_id"]}
        >
          <select
            className="h-10 w-full rounded-lg border border-[#c4c7c8] bg-white px-3 text-sm"
            value={form.contest_template_id}
            onChange={(e) =>
              setForm((s) => ({
                ...s,
                contest_template_id: e.target.value,
              }))
            }
          >
            <option value="">Chọn mẫu vận hành</option>
            {contestTemplates?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </ContestFormField>
        <ContestFormField
          label="Bắt đầu thi đấu"
          error={validationErrors["starts_at"]}
        >
          <Input
            type="datetime-local"
            value={form.starts_at}
            onChange={(e) =>
              setForm((s) => ({ ...s, starts_at: e.target.value }))
            }
          />
        </ContestFormField>
        <ContestFormField label="Kết thúc thi đấu" error={validationErrors["ends_at"]}>
          <Input
            type="datetime-local"
            value={form.ends_at}
            onChange={(e) =>
              setForm((s) => ({ ...s, ends_at: e.target.value }))
            }
          />
        </ContestFormField>
        <ContestFormField
          label="Mở đăng ký"
          error={validationErrors["registration_opens_at"]}
        >
          <Input
            type="datetime-local"
            value={form.registration_opens_at}
            onChange={(e) =>
              setForm((s) => ({
                ...s,
                registration_opens_at: e.target.value,
              }))
            }
          />
        </ContestFormField>
        <ContestFormField
          label="Đóng đăng ký"
          error={validationErrors["registration_closes_at"]}
        >
          <Input
            type="datetime-local"
            value={form.registration_closes_at}
            onChange={(e) =>
              setForm((s) => ({
                ...s,
                registration_closes_at: e.target.value,
              }))
            }
          />
        </ContestFormField>
        <ContestFormField label="Sức chứa tối đa" error={validationErrors["capacity"]}>
          <Input
            value={form.capacity}
            onChange={(e) =>
              setForm((s) => ({ ...s, capacity: e.target.value }))
            }
          />
        </ContestFormField>
        <ContestFormField
          label="Lệ phí tham gia (VND)"
          error={validationErrors["entry_fee"]}
        >
          <Input
            value={form.entry_fee}
            onChange={(e) =>
              setForm((s) => ({ ...s, entry_fee: e.target.value }))
            }
          />
        </ContestFormField>
        <ContestFormField
          label="Banner giải đấu"
          className="md:col-span-2"
          error={validationErrors["banner_image_url"]}
        >
          <div className="space-y-3">
            <Input
              value={form.banner_image_url}
              onChange={(e) =>
                setForm((s) => ({ ...s, banner_image_url: e.target.value }))
              }
              placeholder="https://..."
            />
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-10 gap-2 rounded-lg"
                disabled={!contestId || uploadBannerMutation.isPending}
                onClick={() => document.getElementById("contest-banner-file")?.click()}
              >
                <Upload className="size-4" />
                {uploadBannerMutation.isPending ? "Đang upload..." : "Upload ảnh"}
              </Button>
              <input
                id="contest-banner-file"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                className="hidden"
                onChange={handleBannerFileChange}
              />
              {!contestId ? (
                <p className="text-xs text-muted-foreground">
                  Lưu contest trước để upload banner
                </p>
              ) : null}
            </div>
            {form.banner_image_url ? (
              <div className="rounded-xl border border-border bg-muted/30 p-2">
                <img
                  src={form.banner_image_url}
                  alt="Banner preview"
                  className="h-32 w-full rounded-lg object-cover"
                />
              </div>
            ) : null}
          </div>
        </ContestFormField>
        <ContestFormField
          label="Mô tả"
          className="md:col-span-2"
          error={validationErrors["description"]}
        >
          <Textarea
            rows={4}
            value={form.description}
            onChange={(e) =>
              setForm((s) => ({ ...s, description: e.target.value }))
            }
          />
        </ContestFormField>
      </div>
    </Panel>
  )
}
