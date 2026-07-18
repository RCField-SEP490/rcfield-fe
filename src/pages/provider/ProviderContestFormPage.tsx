import { ArrowLeft, PlayCircle, Save } from "lucide-react"
import { useNavigate } from "react-router"

import { routePaths } from "@/app/router/route-paths"
import { ProviderPageHeader } from "@/pages/provider/components/ProviderPrimitives"
import { ProviderShell } from "@/pages/provider/components/ProviderShell"
import { Button } from "@/shared/ui/button"
import { getContestWorkspacePath } from "./contest-runtime/contest-workspace"
import { ContestBasicInfoSection } from "./contest-form/ContestBasicInfoSection"
import { ContestBranchesSection } from "./contest-form/ContestBranchesSection"
import { ContestRulesSection } from "./contest-form/ContestRulesSection"
import { ContestRuntimePanel } from "./contest-form/ContestRuntimePanel"
import { useContestForm } from "./contest-form/useContestForm"

export function ProviderContestFormPage() {
  const navigate = useNavigate()
  const {
    contestId,
    isEdit,
    form,
    setForm,
    validationErrors,
    trackConfigsByCafe,
    resourceLocks,
    setResourceLocks,
    typesQuery,
    formatsQuery,
    templatesQuery,
    trackTypesQuery,
    cafesQuery,
    selectedTemplate,
    selectedFormat,
    saveMutation,
    handleSubmit,
  } = useContestForm()

  return (
    <ProviderShell>
      <ProviderPageHeader
        title={isEdit ? "Chỉnh sửa giải đấu" : "Tạo giải đấu"}
        description="Thiết lập lịch thi đấu, phạm vi khóa sân và luồng vận hành theo đúng nghiệp vụ contest."
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              className="h-10 gap-2 rounded-lg border-[#c4c7c8] bg-[#f6f3f2] text-[#1c1b1b] hover:bg-[#ebe7e7]"
              onClick={() => navigate(routePaths.providerContests)}
            >
              <ArrowLeft className="size-4" />
              Quay lại
            </Button>
            <Button
              type="button"
              onClick={() => void handleSubmit()}
              className="h-10 gap-2 rounded-lg bg-[#1c1b1b] font-bold text-white hover:bg-[#313030]"
              disabled={saveMutation.isPending}
            >
              <Save className="size-4" />
              {saveMutation.isPending ? "Đang lưu..." : "Lưu giải đấu"}
            </Button>
            {isEdit && contestId ? (
              <Button
                type="button"
                variant="outline"
                className="h-10 gap-2 rounded-lg border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                onClick={() =>
                  navigate(getContestWorkspacePath(contestId, "overview"))
                }
              >
                <PlayCircle className="size-4" />
                Mở vận hành giải đấu
              </Button>
            ) : null}
          </>
        }
      />

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <ContestBasicInfoSection
          form={form}
          setForm={setForm}
          validationErrors={validationErrors}
          trackTypes={trackTypesQuery.data}
          contestTypes={typesQuery.data}
          contestFormats={formatsQuery.data}
          contestTemplates={templatesQuery.data}
        />

        <div className="space-y-4">
          <ContestBranchesSection
            form={form}
            setForm={setForm}
            validationErrors={validationErrors}
            cafes={cafesQuery.data?.data ?? []}
            trackConfigsByCafe={trackConfigsByCafe}
            resourceLocks={resourceLocks}
            setResourceLocks={setResourceLocks}
          />

          <ContestRulesSection
            form={form}
            setForm={setForm}
            validationErrors={validationErrors}
            selectedFormat={selectedFormat}
            selectedTemplate={selectedTemplate}
          />

          {isEdit && contestId ? (
            <ContestRuntimePanel contestId={contestId} />
          ) : null}
        </div>
      </div>
    </ProviderShell>
  )
}
