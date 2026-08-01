import type { Dispatch, SetStateAction } from "react"
import { Flag, Swords, Timer, type LucideIcon } from "lucide-react"

import type {
  ContestCatalogFormat,
  ContestCatalogType,
  ContestTemplate,
} from "@/features/contests/types"
import { cn } from "@/shared/lib/utils"
import { Input } from "@/shared/ui/input"

import { ContestFormField } from "../ContestFormField"
import type { ContestFormState, RentalDepositMode } from "../contest-form-types"
import type { ContestRuntimeFormat } from "../contest-form-utils"

const FORMAT_META: Record<
  ContestRuntimeFormat,
  { icon: LucideIcon; steps: string[] }
> = {
  TIME_TRIAL: {
    icon: Timer,
    steps: [
      "Mỗi VĐV chạy một lượt tính giờ riêng",
      "Nhập lap tốt nhất hoặc tổng thời gian cho từng lượt",
      "Bảng xếp hạng tính theo thành tích thời gian",
    ],
  },
  KNOCKOUT: {
    icon: Swords,
    steps: [
      "Hệ thống sinh nhánh đấu loại từ danh sách VĐV đã check-in",
      "Mỗi trận chốt người thắng, người thắng đi tiếp",
      "Bảng xếp hạng tính theo số trận thắng",
    ],
  },
  QUALIFYING_FINAL: {
    icon: Flag,
    steps: [
      "Vòng loại: mỗi VĐV chạy một lượt tính giờ, xếp hạng theo lap tốt nhất",
      "Chung kết: top N vào nhánh đấu loại, hạng 1 gặp hạng N",
      "Bảng xếp hạng chung cuộc tính theo số trận thắng ở chung kết",
    ],
  },
}

type VehiclePolicy = ContestFormState["vehicle_policy"]

const VEHICLE_POLICY_OPTIONS: Array<{
  value: VehiclePolicy
  label: string
  hint: string
}> = [
  {
    value: "BYOC_ONLY",
    label: "Khách tự mang xe",
    hint: "VĐV khai báo xe khi đăng ký, nhân viên kiểm tra xe lúc check-in.",
  },
  {
    value: "RENTAL_ONLY",
    label: "Thuê xe của quán",
    hint: "VĐV chọn khung giờ thuê ngay trong form đăng ký, trả một lần cùng lệ phí.",
  },
]

/*
  "Xe thuê hoặc xe cá nhân" (MIXED) không còn là lựa chọn cho giải mới: nó bắt
  nhân viên ngày thi đấu chạy song song hai quy trình check-in khác nhau trong
  cùng một giải. Backend vẫn chấp nhận giá trị này, nên giải cũ đang để MIXED vẫn
  hiện đúng thẻ của nó — không âm thầm đổi chế độ của một giải đang mở đăng ký.
*/
const LEGACY_MIXED_OPTION = {
  value: "MIXED" as const,
  label: "Xe thuê hoặc xe cá nhân",
  hint: "Chế độ cũ — nhân viên phải chạy hai quy trình check-in trong cùng một giải.",
}

const DEPOSIT_MODE_OPTIONS: Array<{
  value: RentalDepositMode
  label: string
  hint: string
}> = [
  {
    value: "WAIVED",
    label: "Không thu cọc",
    hint: "Xe do quán vận hành trong giải",
  },
  {
    value: "REDUCED",
    label: "Thu cọc một phần",
    hint: "Theo % mức cọc chuẩn",
  },
  { value: "FULL", label: "Thu cọc đầy đủ", hint: "Như booking thường" },
]

/**
 * Bước 3 — thể thức thi đấu, luật xe và (nếu cho thuê xe) chính sách giá.
 *
 * Thể thức trình bày thành MỘT danh sách mẫu vận hành thay vì ba dropdown rời
 * (loại giải / hình thức / mẫu). Ba dropdown cũ cho ra 18 tổ hợp nhưng chỉ 3 tổ
 * hợp có template thật; chọn nhầm thì ô mẫu vận hành rỗng và provider kẹt ở đó
 * không có thông báo nào. Mỗi mẫu đã gắn cứng một cặp (loại giải, hình thức) nên
 * chọn mẫu là xác định xong cả ba — tổ hợp sai không dựng được nữa.
 */
export function StepFormat({
  form,
  setForm,
  errors,
  contestTypes,
  contestFormats,
  contestTemplates,
  runtimeFormat,
}: {
  form: ContestFormState
  setForm: Dispatch<SetStateAction<ContestFormState>>
  errors: Record<string, string>
  contestTypes: ContestCatalogType[]
  contestFormats: ContestCatalogFormat[]
  contestTemplates: ContestTemplate[]
  runtimeFormat: ContestRuntimeFormat
}) {
  const formatById = new Map(contestFormats.map((item) => [item.id, item]))
  const typeById = new Map(contestTypes.map((item) => [item.id, item]))

  const selectTemplate = (template: ContestTemplate) => {
    setForm((current) => ({
      ...current,
      contest_template_id: template.id,
      contest_type_id: template.contestTypeId ?? "",
      contest_format_id: template.contestFormatId ?? "",
    }))
  }

  const allowsRental = form.vehicle_policy !== "BYOC_ONLY"
  const vehiclePolicyOptions =
    form.vehicle_policy === "MIXED"
      ? [...VEHICLE_POLICY_OPTIONS, LEGACY_MIXED_OPTION]
      : VEHICLE_POLICY_OPTIONS

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-sm font-black uppercase tracking-[0.14em] text-[#adaaaa]">
          Thể thức thi đấu
        </h3>
        {errors.contest_template_id ? (
          <p className="mt-2 text-sm font-bold text-red-600">
            {errors.contest_template_id}
          </p>
        ) : null}

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {contestTemplates.map((template) => {
            const format = template.contestFormatId
              ? formatById.get(template.contestFormatId)
              : undefined
            const type = template.contestTypeId
              ? typeById.get(template.contestTypeId)
              : undefined
            const meta =
              FORMAT_META[
                (format?.code as ContestRuntimeFormat) ?? "KNOCKOUT"
              ] ?? FORMAT_META.KNOCKOUT
            const Icon = meta.icon
            const isSelected = template.id === form.contest_template_id

            return (
              <button
                key={template.id}
                type="button"
                onClick={() => selectTemplate(template)}
                className={cn(
                  "flex flex-col rounded-xl border p-4 text-left transition",
                  isSelected
                    ? "border-[#1c1b1b] bg-[#fcf8f8] ring-1 ring-[#1c1b1b]"
                    : "border-[#e5e2e1] bg-white hover:border-[#c4c7c8]",
                )}
              >
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-xl",
                    isSelected
                      ? "bg-[#1c1b1b] text-white"
                      : "bg-[#f0eded] text-[#5d5f5f]",
                  )}
                >
                  <Icon className="size-5" />
                </span>

                <span className="mt-3 block text-base font-bold text-[#1c1b1b]">
                  {template.name}
                </span>
                {template.description ? (
                  <span className="mt-1 block text-xs leading-5 text-[#747878]">
                    {template.description}
                  </span>
                ) : null}

                <span className="mt-3 flex flex-wrap gap-1.5">
                  {type ? (
                    <span className="rounded-full bg-[#f0eded] px-2 py-0.5 text-[11px] font-bold text-[#5d5f5f]">
                      {type.name}
                    </span>
                  ) : null}
                  {format ? (
                    <span className="rounded-full bg-[#f0eded] px-2 py-0.5 text-[11px] font-bold text-[#5d5f5f]">
                      {format.name}
                    </span>
                  ) : null}
                </span>
              </button>
            )
          })}
        </div>

        {form.contest_template_id ? (
          <div className="mt-4 rounded-xl border border-[#e5e2e1] bg-[#fcf8f8] p-4">
            <p className="text-sm font-bold text-[#1c1b1b]">
              Hệ thống sẽ vận hành như sau
            </p>
            <ol className="mt-2 space-y-1.5">
              {FORMAT_META[runtimeFormat].steps.map((line, index) => (
                <li key={line} className="text-sm leading-6 text-[#5d5f5f]">
                  {index + 1}. {line}
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        {runtimeFormat === "QUALIFYING_FINAL" && form.contest_template_id ? (
          <div className="mt-4 max-w-xs">
            <ContestFormField label="Số VĐV vào chung kết" error={errors.finalists}>
              <Input
                type="number"
                min={2}
                max={16}
                className="h-11"
                value={form.finalists}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    finalists: event.target.value,
                  }))
                }
              />
              <p className="text-xs leading-5 text-[#747878]">
                Từ 2 đến 16. Sau vòng loại, top N theo lap tốt nhất vào nhánh
                chung kết.
              </p>
            </ContestFormField>
          </div>
        ) : null}
      </section>

      <section>
        <h3 className="text-sm font-black uppercase tracking-[0.14em] text-[#adaaaa]">
          Xe thi đấu
        </h3>
        {errors.vehicle_policy ? (
          <p className="mt-2 text-sm font-bold text-red-600">
            {errors.vehicle_policy}
          </p>
        ) : null}

        {form.vehicle_policy === "MIXED" ? (
          <p className="mt-3 border-l-2 border-amber-300 bg-amber-50/60 py-2.5 pl-4 text-sm leading-6 text-amber-900">
            Giải này đang dùng chế độ hỗn hợp — chế độ đã ngừng đề xuất. Chọn một
            trong hai chế độ bên dưới để nhân viên ngày thi đấu chỉ phải chạy một
            quy trình check-in.
          </p>
        ) : null}

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {vehiclePolicyOptions.map((option) => {
            const isSelected = option.value === form.vehicle_policy
            return (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    vehicle_policy: option.value,
                  }))
                }
                className={cn(
                  "rounded-xl border p-4 text-left transition",
                  isSelected
                    ? "border-[#1c1b1b] bg-[#fcf8f8] ring-1 ring-[#1c1b1b]"
                    : "border-[#e5e2e1] bg-white hover:border-[#c4c7c8]",
                )}
              >
                <span className="block text-base font-bold text-[#1c1b1b]">
                  {option.label}
                </span>
                <span className="mt-1 block text-xs leading-5 text-[#747878]">
                  {option.hint}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {allowsRental ? (
        <section>
          <h3 className="text-sm font-black uppercase tracking-[0.14em] text-[#adaaaa]">
            Giá thuê xe trong giải
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5d5f5f]">
            VĐV thuê xe đã trả lệ phí giải, nên thường không thu thêm tiền sân và
            không bắt đặt cọc. Đổi ở đây nếu quán bạn làm khác.
          </p>

          <div className="mt-4 space-y-4">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#e5e2e1] bg-white p-4">
              <input
                type="checkbox"
                className="mt-0.5 size-4 accent-[#1c1b1b]"
                checked={form.rental_waive_slot_fee}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    rental_waive_slot_fee: event.target.checked,
                  }))
                }
              />
              <span>
                <span className="block text-sm font-bold text-[#1c1b1b]">
                  Miễn tiền sân cho VĐV thuê xe
                </span>
                <span className="mt-0.5 block text-xs leading-5 text-[#747878]">
                  Bỏ tick nghĩa là VĐV trả cả lệ phí giải lẫn tiền thuê sân theo
                  giờ như booking thường.
                </span>
              </span>
            </label>

            <div>
              <p className="text-sm font-bold text-[#1c1b1b]">Đặt cọc xe</p>
              <div className="mt-2 grid gap-3 md:grid-cols-3">
                {DEPOSIT_MODE_OPTIONS.map((option) => {
                  const isSelected = option.value === form.rental_deposit_mode
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          rental_deposit_mode: option.value,
                        }))
                      }
                      className={cn(
                        "rounded-xl border px-3 py-3 text-left transition",
                        isSelected
                          ? "border-[#1c1b1b] bg-[#fcf8f8]"
                          : "border-[#e5e2e1] bg-white hover:border-[#c4c7c8]",
                      )}
                    >
                      <span className="block text-sm font-bold text-[#1c1b1b]">
                        {option.label}
                      </span>
                      <span className="mt-0.5 block text-xs text-[#747878]">
                        {option.hint}
                      </span>
                    </button>
                  )
                })}
              </div>

              {form.rental_deposit_mode === "REDUCED" ? (
                <div className="mt-3 max-w-xs">
                  <ContestFormField
                    label="Thu bao nhiêu % mức cọc chuẩn"
                    error={errors.rental_deposit_percent}
                  >
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      className="h-11"
                      value={form.rental_deposit_percent}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          rental_deposit_percent: event.target.value,
                        }))
                      }
                    />
                  </ContestFormField>
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <ContestFormField
                label="Cho thuê xe sớm trước giờ thi (phút)"
                error={errors.rental_window_before}
              >
                <Input
                  type="number"
                  min={0}
                  className="h-11"
                  value={form.rental_window_before}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      rental_window_before: event.target.value,
                    }))
                  }
                />
                <p className="text-xs leading-5 text-[#747878]">
                  Để VĐV chạy thử làm quen xe trước khi vào giải.
                </p>
              </ContestFormField>
              <ContestFormField
                label="Cho trả xe muộn sau giờ thi (phút)"
                error={errors.rental_window_after}
              >
                <Input
                  type="number"
                  min={0}
                  className="h-11"
                  value={form.rental_window_after}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      rental_window_after: event.target.value,
                    }))
                  }
                />
              </ContestFormField>
            </div>

            <ContestFormField
              label="Thời điểm gán xe thuê"
              error={errors.assignment_policy}
            >
              <select
                className="h-11 w-full max-w-md rounded-lg border border-[#c4c7c8] bg-white px-3 text-sm"
                value={form.assignment_policy}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    assignment_policy: event.target
                      .value as ContestFormState["assignment_policy"],
                  }))
                }
              >
                <option value="AT_CHECK_IN">Gán xe khi VĐV tới check-in</option>
                <option value="PRE_ASSIGNED">Gán xe sẵn trước ngày thi đấu</option>
              </select>
              <p className="text-xs leading-5 text-amber-700">
                Lựa chọn này được lưu nhưng hệ thống chưa áp dụng — luồng gán xe
                trước ngày thi chưa được cài đặt.
              </p>
            </ContestFormField>
          </div>
        </section>
      ) : null}
    </div>
  )
}
