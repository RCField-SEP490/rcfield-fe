import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, PlayCircle, Save } from "lucide-react"
import { useNavigate, useParams } from "react-router"
import { toast } from "sonner"

import { routePaths } from "@/app/router/route-paths"
import { cafeApi, cafeQueryKeys, trackTypeApi, trackTypeQueryKeys } from "@/features/cafes/api/cafe.api"
import { contestApi, contestQueryKeys } from "@/features/contests/api/contest.api"
import type { ContestUpsertBody } from "@/features/contests/types"
import { Panel, PanelTitle, ProviderPageHeader } from "@/pages/provider/components/ProviderPrimitives"
import { ProviderShell } from "@/pages/provider/components/ProviderShell"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Textarea } from "@/shared/ui/textarea"

type ContestFormState = {
  name: string
  description: string
  contest_type_id: string
  contest_format_id: string
  contest_template_id: string
  track_type_id: string
  participating_cafe_ids: string[]
  starts_at: string
  ends_at: string
  registration_opens_at: string
  registration_closes_at: string
  capacity: string
  entry_fee: string
  banner_image_url: string
  vehicle_policy: "RENTAL_ONLY" | "BYOC_ONLY" | "MIXED"
  assignment_policy: "AT_CHECK_IN" | "PRE_ASSIGNED"
  config_text: string
}

const defaultForm: ContestFormState = {
  name: "",
  description: "",
  contest_type_id: "",
  contest_format_id: "",
  contest_template_id: "",
  track_type_id: "",
  participating_cafe_ids: [],
  starts_at: "",
  ends_at: "",
  registration_opens_at: "",
  registration_closes_at: "",
  capacity: "16",
  entry_fee: "0",
  banner_image_url: "",
  vehicle_policy: "RENTAL_ONLY",
  assignment_policy: "AT_CHECK_IN",
  config_text: "{}",
}

export function ProviderContestFormPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { contestId } = useParams()
  const isEdit = Boolean(contestId)
  const [form, setForm] = useState<ContestFormState>(defaultForm)

  const typesQuery = useQuery({
    queryKey: contestQueryKeys.catalogTypes(),
    queryFn: contestApi.listContestTypes,
  })
  const formatsQuery = useQuery({
    queryKey: contestQueryKeys.catalogFormats(),
    queryFn: contestApi.listContestFormats,
  })
  const templatesQuery = useQuery({
    queryKey: contestQueryKeys.catalogTemplates({
      contest_type_id: form.contest_type_id || undefined,
      contest_format_id: form.contest_format_id || undefined,
    }),
    queryFn: () =>
      contestApi.listContestTemplates({
        contest_type_id: form.contest_type_id || undefined,
        contest_format_id: form.contest_format_id || undefined,
      }),
  })
  const trackTypesQuery = useQuery({
    queryKey: trackTypeQueryKeys.all,
    queryFn: trackTypeApi.listAll,
  })
  const cafesQuery = useQuery({
    queryKey: cafeQueryKeys.list({ scope: "managed", limit: 100 }),
    queryFn: () => cafeApi.listCafes({ scope: "managed", limit: 100 }),
  })
  const contestQuery = useQuery({
    queryKey: contestQueryKeys.detail(contestId),
    queryFn: () => contestApi.getContest(contestId!),
    enabled: Boolean(contestId),
  })

  useEffect(() => {
    if (!contestQuery.data) return
    const contest = contestQuery.data
    setForm({
      name: contest.name,
      description: contest.description ?? "",
      contest_type_id: contest.contest_type?.id ?? "",
      contest_format_id: contest.contest_format?.id ?? "",
      contest_template_id: contest.contest_template?.id ?? "",
      track_type_id: contest.track_type?.id ?? "",
      participating_cafe_ids: contest.participating_branches.map((item) => item.cafe_id),
      starts_at: toInputDateTime(contest.starts_at),
      ends_at: toInputDateTime(contest.ends_at),
      registration_opens_at: toInputDateTime(contest.registration_opens_at ?? contest.starts_at),
      registration_closes_at: toInputDateTime(contest.registration_closes_at ?? contest.starts_at),
      capacity: String(contest.capacity ?? 16),
      entry_fee: String(contest.entry_fee ?? 0),
      banner_image_url: contest.banner_image_url ?? "",
      vehicle_policy: ((contest.vehicle_rule?.vehicle_policy as ContestFormState["vehicle_policy"]) ?? "RENTAL_ONLY"),
      assignment_policy: ((contest.vehicle_rule?.assignment_policy as ContestFormState["assignment_policy"]) ?? "AT_CHECK_IN"),
      config_text: JSON.stringify(contest.config ?? {}, null, 2),
    })
  }, [contestQuery.data])

  useEffect(() => {
    if (form.contest_template_id) return
    const firstTemplate = templatesQuery.data?.[0]
    if (!firstTemplate) return
    setForm((current) => ({
      ...current,
      contest_template_id: current.contest_template_id || firstTemplate.id,
      config_text:
        current.config_text === "{}"
          ? JSON.stringify(firstTemplate.defaultConfig ?? {}, null, 2)
          : current.config_text,
    }))
  }, [templatesQuery.data, form.contest_template_id])

  const saveMutation = useMutation({
    mutationFn: async (payload: ContestUpsertBody) =>
      isEdit && contestId ? contestApi.updateContest(contestId, payload) : contestApi.createContest(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: contestQueryKeys.all })
    },
  })
  const handleSubmit = async () => {
    try {
      const payload = toPayload(form)
      await saveMutation.mutateAsync(payload)
      toast.success(isEdit ? "Đã cập nhật contest" : "Đã tạo contest")
      navigate(routePaths.providerContests)
    } catch (error) {
      toast.error("Không thể lưu contest", {
        description: getErrorMessage(error),
      })
    }
  }

  const cafes = cafesQuery.data?.data ?? []
  return (
    <ProviderShell>
      <ProviderPageHeader
        title={isEdit ? "Chỉnh sửa contest" : "Tạo contest"}
        description="Form này chỉ dùng dữ liệu catalog từ BE cho type, format và template; FE không hardcode danh mục contest."
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
              className="h-10 gap-2 rounded-lg bg-[#1c1b1b] text-white hover:bg-[#313030] font-bold"
              disabled={saveMutation.isPending}
            >
              <Save className="size-4" />
              {saveMutation.isPending ? "Đang lưu..." : "Lưu contest"}
            </Button>
            {isEdit && contestId ? (
              <Button
                type="button"
                variant="outline"
                className="h-10 gap-2 rounded-lg border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                onClick={() => navigate(routePaths.providerContestRuntime.replace(":contestId", contestId))}
              >
                <PlayCircle className="size-4" />
                Vận hành contest
              </Button>
            ) : null}
          </>
        }
      />

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel>
          <PanelTitle title="Thông tin contest" subtitle="Thiết lập nghiệp vụ và lịch mở đăng ký." />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Tên contest">
              <Input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
            </Field>
            <Field label="Track type">
              <select
                className="h-10 rounded-lg border border-[#c4c7c8] bg-white px-3 text-sm"
                value={form.track_type_id}
                onChange={(e) => setForm((s) => ({ ...s, track_type_id: e.target.value }))}
              >
                <option value="">Chọn track type</option>
                {trackTypesQuery.data?.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Contest type">
              <select
                className="h-10 rounded-lg border border-[#c4c7c8] bg-white px-3 text-sm"
                value={form.contest_type_id}
                onChange={(e) => setForm((s) => ({ ...s, contest_type_id: e.target.value, contest_template_id: "" }))}
              >
                <option value="">Chọn loại contest</option>
                {typesQuery.data?.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Format">
              <select
                className="h-10 rounded-lg border border-[#c4c7c8] bg-white px-3 text-sm"
                value={form.contest_format_id}
                onChange={(e) => setForm((s) => ({ ...s, contest_format_id: e.target.value, contest_template_id: "" }))}
              >
                <option value="">Chọn format</option>
                {formatsQuery.data?.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Template" className="md:col-span-2">
              <select
                className="h-10 w-full rounded-lg border border-[#c4c7c8] bg-white px-3 text-sm"
                value={form.contest_template_id}
                onChange={(e) => setForm((s) => ({ ...s, contest_template_id: e.target.value }))}
              >
                <option value="">Chọn template</option>
                {templatesQuery.data?.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Bắt đầu">
              <Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm((s) => ({ ...s, starts_at: e.target.value }))} />
            </Field>
            <Field label="Kết thúc">
              <Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm((s) => ({ ...s, ends_at: e.target.value }))} />
            </Field>
            <Field label="Mở đăng ký">
              <Input type="datetime-local" value={form.registration_opens_at} onChange={(e) => setForm((s) => ({ ...s, registration_opens_at: e.target.value }))} />
            </Field>
            <Field label="Đóng đăng ký">
              <Input type="datetime-local" value={form.registration_closes_at} onChange={(e) => setForm((s) => ({ ...s, registration_closes_at: e.target.value }))} />
            </Field>
            <Field label="Sức chứa">
              <Input value={form.capacity} onChange={(e) => setForm((s) => ({ ...s, capacity: e.target.value }))} />
            </Field>
            <Field label="Entry fee (VND)">
              <Input value={form.entry_fee} onChange={(e) => setForm((s) => ({ ...s, entry_fee: e.target.value }))} />
            </Field>
            <Field label="Banner image URL" className="md:col-span-2">
              <Input value={form.banner_image_url} onChange={(e) => setForm((s) => ({ ...s, banner_image_url: e.target.value }))} />
            </Field>
            <Field label="Mô tả" className="md:col-span-2">
              <Textarea rows={4} value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
            </Field>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel>
            <PanelTitle title="Chi nhánh tham gia" subtitle="Chọn một hoặc nhiều cơ sở provider đang quản lý." />
            <div className="space-y-2">
              {cafes.map((cafe) => {
                const checked = form.participating_cafe_ids.includes(cafe.id)
                return (
                  <label key={cafe.id} className="flex items-start gap-3 rounded-lg border border-[#e5e2e1] p-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          participating_cafe_ids: e.target.checked
                            ? [...current.participating_cafe_ids, cafe.id]
                            : current.participating_cafe_ids.filter((id) => id !== cafe.id),
                        }))
                      }
                    />
                    <div>
                      <p className="text-sm font-bold text-[#1c1b1b]">{cafe.name}</p>
                      <p className="text-xs font-medium text-[#747878]">
                        {cafe.district}, {cafe.city}
                      </p>
                    </div>
                  </label>
                )
              })}
            </div>
          </Panel>

          <Panel>
            <PanelTitle title="Vehicle policy và config" subtitle="Config JSON này lưu thẳng theo contest để phase sau mở rộng không phải hardcode ở FE." />
            <div className="space-y-4">
              <Field label="Vehicle policy">
                <select
                  className="h-10 w-full rounded-lg border border-[#c4c7c8] bg-white px-3 text-sm"
                  value={form.vehicle_policy}
                  onChange={(e) => setForm((s) => ({ ...s, vehicle_policy: e.target.value as ContestFormState["vehicle_policy"] }))}
                >
                  <option value="RENTAL_ONLY">RENTAL_ONLY</option>
                  <option value="MIXED">MIXED</option>
                  <option value="BYOC_ONLY">BYOC_ONLY</option>
                </select>
              </Field>
              <Field label="Assignment policy">
                <select
                  className="h-10 w-full rounded-lg border border-[#c4c7c8] bg-white px-3 text-sm"
                  value={form.assignment_policy}
                  onChange={(e) => setForm((s) => ({ ...s, assignment_policy: e.target.value as ContestFormState["assignment_policy"] }))}
                >
                  <option value="AT_CHECK_IN">AT_CHECK_IN</option>
                  <option value="PRE_ASSIGNED">PRE_ASSIGNED</option>
                </select>
              </Field>
              <Field label="Config JSON">
                <Textarea rows={14} value={form.config_text} onChange={(e) => setForm((s) => ({ ...s, config_text: e.target.value }))} />
              </Field>
            </div>
          </Panel>

          {isEdit ? (
            <Panel>
              <PanelTitle
                title="Contest runtime workspace"
                subtitle="Luồng event-day, runtime matches, leaderboard và audit đã được tách sang workspace vận hành riêng."
              />
              <div className="rounded-lg border border-dashed border-[#c4c7c8] bg-[#fcf8f8] p-6">
                <p className="text-sm font-semibold text-[#5d5f5f]">
                  Màn hình chỉnh sửa này chỉ giữ phần cấu hình contest. Các thao tác registration live, generate match, result, leaderboard và audit nằm ở workspace runtime riêng để tách domain rõ ràng.
                </p>
                <Button
                  type="button"
                  className="mt-4 h-10 gap-2 rounded-lg bg-[#1c1b1b] text-white hover:bg-[#313030]"
                  onClick={() => navigate(routePaths.providerContestRuntime.replace(":contestId", contestId!))}
                >
                  <PlayCircle className="size-4" />
                  Mở workspace runtime
                </Button>
              </div>
            </Panel>
          ) : null}
        </div>
      </div>
    </ProviderShell>
  )
}

function Field({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div className={className}>
      <Label className="mb-2 block text-sm font-bold text-[#1c1b1b]">{label}</Label>
      {children}
    </div>
  )
}

function toPayload(form: ContestFormState): ContestUpsertBody {
  let parsedConfig: Record<string, unknown> = {}
  try {
    parsedConfig = JSON.parse(form.config_text || "{}") as Record<string, unknown>
  } catch {
    parsedConfig = {}
  }

  return {
    name: form.name.trim(),
    description: form.description.trim() || null,
    contest_type_id: form.contest_type_id,
    contest_format_id: form.contest_format_id,
    contest_template_id: form.contest_template_id,
    track_type_id: form.track_type_id,
    participating_cafe_ids: form.participating_cafe_ids,
    starts_at: new Date(form.starts_at).toISOString(),
    ends_at: new Date(form.ends_at).toISOString(),
    registration_opens_at: new Date(form.registration_opens_at).toISOString(),
    registration_closes_at: new Date(form.registration_closes_at).toISOString(),
    capacity: Number(form.capacity),
    entry_fee: Number(form.entry_fee),
    banner_image_url: form.banner_image_url.trim() || null,
    vehicle_rule: {
      vehicle_policy: form.vehicle_policy,
      assignment_policy: form.assignment_policy,
    },
    config: parsedConfig,
  }
}

function toInputDateTime(value: string) {
  const date = new Date(value)
  const offset = date.getTimezoneOffset()
  const normalized = new Date(date.getTime() - offset * 60_000)
  return normalized.toISOString().slice(0, 16)
}

function getErrorMessage(error: unknown) {
  const maybe = error as { response?: { data?: { message?: string } } }
  return maybe.response?.data?.message ?? "Vui lòng kiểm tra lại dữ liệu."
}
