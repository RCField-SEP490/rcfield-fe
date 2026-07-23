import type { Dispatch, SetStateAction } from "react"

import type { TrackType } from "@/features/cafes/types"
import type {
  ContestCatalogFormat,
  ContestCatalogType,
  ContestTemplate,
} from "@/features/contests/types"
import {
  Panel,
  PanelTitle,
} from "@/pages/provider/components/ProviderPrimitives"
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
}

export function ContestBasicInfoSection({
  form,
  setForm,
  validationErrors,
  trackTypes,
  contestTypes,
  contestFormats,
  contestTemplates,
}: ContestBasicInfoSectionProps) {
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
          <Input
            value={form.banner_image_url}
            onChange={(e) =>
              setForm((s) => ({ ...s, banner_image_url: e.target.value }))
            }
          />
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
