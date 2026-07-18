import type { Dispatch, SetStateAction } from "react"

import type {
  ContestCatalogFormat,
  ContestTemplate,
} from "@/features/contests/types"
import {
  Panel,
  PanelTitle,
} from "@/pages/provider/components/ProviderPrimitives"

import { ContestFormField } from "./ContestFormField"
import type { ContestFormState } from "./contest-form-types"

interface ContestRulesSectionProps {
  form: ContestFormState
  setForm: Dispatch<SetStateAction<ContestFormState>>
  validationErrors: Record<string, string>
  selectedFormat: ContestCatalogFormat | null
  selectedTemplate: ContestTemplate | null
}

export function ContestRulesSection({
  form,
  setForm,
  validationErrors,
  selectedFormat,
  selectedTemplate,
}: ContestRulesSectionProps) {
  return (
    <Panel>
      <PanelTitle
        title="Quy tắc vận hành"
        subtitle="Thiết lập xe thi đấu và tóm tắt cách hệ thống sẽ vận hành contest."
      />
      <div className="space-y-4">
        <ContestFormField
          label="Nguồn xe thi đấu"
          error={validationErrors["vehicle_rule.vehicle_policy"]}
        >
          <select
            className="h-10 w-full rounded-lg border border-[#c4c7c8] bg-white px-3 text-sm"
            value={form.vehicle_policy}
            onChange={(e) =>
              setForm((s) => ({
                ...s,
                vehicle_policy: e.target
                  .value as ContestFormState["vehicle_policy"],
              }))
            }
          >
            <option value="RENTAL_ONLY">Chỉ dùng xe thuê</option>
            <option value="MIXED">Xe thuê hoặc xe cá nhân</option>
            <option value="BYOC_ONLY">Chỉ dùng xe cá nhân</option>
          </select>
        </ContestFormField>
        <ContestFormField
          label="Thời điểm gán xe"
          error={validationErrors["vehicle_rule.assignment_policy"]}
        >
          <select
            className="h-10 w-full rounded-lg border border-[#c4c7c8] bg-white px-3 text-sm"
            value={form.assignment_policy}
            onChange={(e) =>
              setForm((s) => ({
                ...s,
                assignment_policy: e.target
                  .value as ContestFormState["assignment_policy"],
              }))
            }
          >
            <option value="AT_CHECK_IN">Gán xe khi check-in</option>
            <option value="PRE_ASSIGNED">
              Gán xe trước khi check-in
            </option>
          </select>
        </ContestFormField>

        <div className="rounded-lg border border-[#e5e2e1] bg-[#fcf8f8] p-4">
          <p className="text-sm font-bold text-[#1c1b1b]">
            Tóm tắt vận hành
          </p>
          <div className="mt-3 space-y-2 text-sm font-semibold text-[#5d5f5f]">
            <p>Hình thức thi đấu: {selectedFormat?.name ?? "--"}</p>
            <p>Mẫu vận hành: {selectedTemplate?.name ?? "--"}</p>
            <p>
              Luồng bắt buộc: Đăng ký → Duyệt → Check-in → Xếp nhánh → Thi
              đấu
            </p>
            <p>Người chơi chỉ được vào thi đấu sau khi đã check-in.</p>
          </div>
        </div>
      </div>
    </Panel>
  )
}
