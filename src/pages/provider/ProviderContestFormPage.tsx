import { useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, PlayCircle, Save } from "lucide-react"
import { useNavigate, useParams } from "react-router"
import { toast } from "sonner"

import { routePaths } from "@/app/router/route-paths"
import {
  cafeApi,
  cafeQueryKeys,
  trackConfigApi,
  trackTypeApi,
  trackTypeQueryKeys,
} from "@/features/cafes/api/cafe.api"
import type { TrackConfig } from "@/features/cafes/types"
import {
  contestApi,
  contestQueryKeys,
} from "@/features/contests/api/contest.api"
import { contestUpsertSchema } from "@/features/contests/schemas/contest.schema"
import type { ContestUpsertBody } from "@/features/contests/types"
import {
  Panel,
  PanelTitle,
  ProviderPageHeader,
} from "@/pages/provider/components/ProviderPrimitives"
import { ProviderShell } from "@/pages/provider/components/ProviderShell"
import { cn } from "@/shared/lib/utils"
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
}

type ResourceLockScope = "FULL_BRANCH" | "SELECTED_TRACKS"

type ResourceLockState = Record<
  string,
  {
    scope: ResourceLockScope
    track_config_ids: string[]
  }
>

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
}

export function ProviderContestFormPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { contestId } = useParams()
  const isEdit = Boolean(contestId)
  const [form, setForm] = useState<ContestFormState>(defaultForm)
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({})
  const [trackConfigsByCafe, setTrackConfigsByCafe] = useState<
    Record<string, TrackConfig[]>
  >({})
  const [resourceLocks, setResourceLocks] = useState<ResourceLockState>({})
  const [extraConfig, setExtraConfig] = useState<Record<string, unknown>>({})

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

  const selectedTemplate = useMemo(
    () =>
      templatesQuery.data?.find(
        (item) => item.id === form.contest_template_id,
      ) ?? null,
    [form.contest_template_id, templatesQuery.data],
  )
  const selectedFormat = useMemo(
    () =>
      formatsQuery.data?.find((item) => item.id === form.contest_format_id) ??
      null,
    [form.contest_format_id, formatsQuery.data],
  )
  const cafes = cafesQuery.data?.data ?? []

  useEffect(() => {
    if (!contestQuery.data) return
    const contest = contestQuery.data
    queueMicrotask(() => {
      setForm({
        name: contest.name,
        description: contest.description ?? "",
        contest_type_id: contest.contest_type?.id ?? "",
        contest_format_id: contest.contest_format?.id ?? "",
        contest_template_id: contest.contest_template?.id ?? "",
        track_type_id: contest.track_type?.id ?? "",
        participating_cafe_ids: contest.participating_branches.map(
          (item) => item.cafe_id,
        ),
        starts_at: toInputDateTime(contest.starts_at),
        ends_at: toInputDateTime(contest.ends_at),
        registration_opens_at: toInputDateTime(
          contest.registration_opens_at ?? contest.starts_at,
        ),
        registration_closes_at: toInputDateTime(
          contest.registration_closes_at ?? contest.starts_at,
        ),
        capacity: String(contest.capacity ?? 16),
        entry_fee: String(contest.entry_fee ?? 0),
        banner_image_url: contest.banner_image_url ?? "",
        vehicle_policy:
          (contest.vehicle_rule
            ?.vehicle_policy as ContestFormState["vehicle_policy"]) ??
          "RENTAL_ONLY",
        assignment_policy:
          (contest.vehicle_rule
            ?.assignment_policy as ContestFormState["assignment_policy"]) ??
          "AT_CHECK_IN",
      })
      setExtraConfig(stripManagedContestConfig(contest.config))

      const existingLocks = Array.isArray(contest.config?.resource_locks)
        ? contest.config.resource_locks
        : []
      setResourceLocks(
        existingLocks.reduce<ResourceLockState>((map, lock) => {
          const value = lock as {
            cafe_id?: string
            scope?: ResourceLockScope
            track_config_ids?: string[]
          }
          if (!value.cafe_id) return map
          map[value.cafe_id] = {
            scope:
              value.scope === "SELECTED_TRACKS"
                ? "SELECTED_TRACKS"
                : "FULL_BRANCH",
            track_config_ids: Array.isArray(value.track_config_ids)
              ? value.track_config_ids
              : [],
          }
          return map
        }, {}),
      )
    })
  }, [contestQuery.data])

  useEffect(() => {
    if (form.contest_template_id) return
    const firstTemplate = templatesQuery.data?.[0]
    if (!firstTemplate) return
    queueMicrotask(() => {
      setForm((current) => ({
        ...current,
        contest_template_id: current.contest_template_id || firstTemplate.id,
      }))
    })
  }, [templatesQuery.data, form.contest_template_id])

  useEffect(() => {
    if (form.participating_cafe_ids.length === 0) {
      queueMicrotask(() => setTrackConfigsByCafe({}))
      return
    }

    let cancelled = false
    void Promise.all(
      form.participating_cafe_ids.map(
        async (cafeId) =>
          [cafeId, await trackConfigApi.listTrackConfigs(cafeId)] as const,
      ),
    ).then((entries) => {
      if (cancelled) return
      setTrackConfigsByCafe(Object.fromEntries(entries))
    })

    return () => {
      cancelled = true
    }
  }, [form.participating_cafe_ids])

  useEffect(() => {
    if (form.participating_cafe_ids.length === 0) return
    queueMicrotask(() =>
      setResourceLocks((current) => {
        const next = { ...current }
        for (const cafeId of form.participating_cafe_ids) {
          const configs = (trackConfigsByCafe[cafeId] ?? []).filter(
            (item) => item.is_active,
          )
          if (configs.length <= 1) {
            next[cafeId] = {
              scope: "FULL_BRANCH",
              track_config_ids: configs.map((item) => item.id),
            }
            continue
          }
          if (!next[cafeId]) {
            next[cafeId] = { scope: "FULL_BRANCH", track_config_ids: [] }
          } else if (next[cafeId].scope === "SELECTED_TRACKS") {
            next[cafeId] = {
              ...next[cafeId],
              track_config_ids: next[cafeId].track_config_ids.filter(
                (trackId) => configs.some((item) => item.id === trackId),
              ),
            }
          }
        }

        for (const cafeId of Object.keys(next)) {
          if (!form.participating_cafe_ids.includes(cafeId)) {
            delete next[cafeId]
          }
        }

        return next
      }),
    )
  }, [form.participating_cafe_ids, trackConfigsByCafe])

  const saveMutation = useMutation({
    mutationFn: async (payload: ContestUpsertBody) =>
      isEdit && contestId
        ? contestApi.updateContest(contestId, payload)
        : contestApi.createContest(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: contestQueryKeys.all })
    },
  })

  const handleSubmit = async () => {
    const runtimeFormat = getRuntimeFormatFromCode(selectedFormat?.code)
    const derivedLocks = buildResourceLocks(
      form.participating_cafe_ids,
      trackConfigsByCafe,
      resourceLocks,
    )

    if (
      derivedLocks.some(
        (item) =>
          item.scope === "SELECTED_TRACKS" &&
          item.track_config_ids.length === 0,
      )
    ) {
      setValidationErrors((current) => ({
        ...current,
        resource_locks:
          "Vui lòng chọn ít nhất một sân khi khóa theo sân cụ thể.",
      }))
      toast.error("Thiếu cấu hình sân thi đấu")
      return
    }

    let startsAt = ""
    let endsAt = ""
    let regOpen = ""
    let regClose = ""
    try {
      if (form.starts_at) startsAt = new Date(form.starts_at).toISOString()
      if (form.ends_at) endsAt = new Date(form.ends_at).toISOString()
      if (form.registration_opens_at)
        regOpen = new Date(form.registration_opens_at).toISOString()
      if (form.registration_closes_at)
        regClose = new Date(form.registration_closes_at).toISOString()
    } catch {
      // keep schema validation below
    }

    const templateDefaults = (selectedTemplate?.defaultConfig ?? {}) as Record<
      string,
      unknown
    >
    const derivedConfig = {
      ...templateDefaults,
      ...extraConfig,
      format: runtimeFormat,
      runtime_format: runtimeFormat,
      leaderboard_mode:
        runtimeFormat === "KNOCKOUT"
          ? "KNOCKOUT_WINS"
          : (templateDefaults.leaderboard_mode ?? "BEST_LAP"),
      drivers_per_match:
        runtimeFormat === "KNOCKOUT"
          ? Number(templateDefaults.drivers_per_match ?? 2)
          : Number(templateDefaults.drivers_per_match ?? 1),
      resource_locks: derivedLocks,
    }

    const rawData = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      contest_type_id: form.contest_type_id,
      contest_format_id: form.contest_format_id,
      contest_template_id: form.contest_template_id,
      track_type_id: form.track_type_id,
      participating_cafe_ids: form.participating_cafe_ids,
      starts_at: startsAt,
      ends_at: endsAt,
      registration_opens_at: regOpen,
      registration_closes_at: regClose,
      capacity: form.capacity ? Number(form.capacity) : NaN,
      entry_fee: form.entry_fee ? Number(form.entry_fee) : NaN,
      banner_image_url: form.banner_image_url.trim() || null,
      vehicle_rule: {
        vehicle_policy: form.vehicle_policy,
        assignment_policy: form.assignment_policy,
      },
      config: derivedConfig,
    }

    const result = contestUpsertSchema.safeParse(rawData)
    if (!result.success) {
      const newErrors: Record<string, string> = {}
      result.error.issues.forEach((err) => {
        const path = err.path.join(".")
        newErrors[path] = err.message
      })
      setValidationErrors(newErrors)
      const firstError = result.error.issues[0]
      toast.error(`Lỗi validation: ${firstError.message}`)
      return
    }

    setValidationErrors({})
    try {
      await saveMutation.mutateAsync(result.data as ContestUpsertBody)
      toast.success(isEdit ? "Đã cập nhật giải đấu" : "Đã tạo giải đấu")
      navigate(routePaths.providerContests)
    } catch (error) {
      toast.error("Không thể lưu giải đấu", {
        description: getErrorMessage(error),
      })
    }
  }

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
                  navigate(
                    routePaths.providerContestRuntime.replace(
                      ":contestId",
                      contestId,
                    ),
                  )
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
        <Panel>
          <PanelTitle
            title="Thông tin giải đấu"
            subtitle="Thiết lập loại giải, lịch thi đấu và mốc đăng ký."
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Tên giải đấu" error={validationErrors["name"]}>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((s) => ({ ...s, name: e.target.value }))
                }
              />
            </Field>
            <Field
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
                {trackTypesQuery.data?.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field
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
                {typesQuery.data?.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field
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
                {formatsQuery.data?.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field
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
                {templatesQuery.data?.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field
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
            </Field>
            <Field label="Kết thúc thi đấu" error={validationErrors["ends_at"]}>
              <Input
                type="datetime-local"
                value={form.ends_at}
                onChange={(e) =>
                  setForm((s) => ({ ...s, ends_at: e.target.value }))
                }
              />
            </Field>
            <Field
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
            </Field>
            <Field
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
            </Field>
            <Field label="Sức chứa tối đa" error={validationErrors["capacity"]}>
              <Input
                value={form.capacity}
                onChange={(e) =>
                  setForm((s) => ({ ...s, capacity: e.target.value }))
                }
              />
            </Field>
            <Field
              label="Lệ phí tham gia (VND)"
              error={validationErrors["entry_fee"]}
            >
              <Input
                value={form.entry_fee}
                onChange={(e) =>
                  setForm((s) => ({ ...s, entry_fee: e.target.value }))
                }
              />
            </Field>
            <Field
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
            </Field>
            <Field
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
            </Field>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel>
            <PanelTitle
              title="Chi nhánh tham gia"
              subtitle="Chọn chi nhánh và cách khóa tài nguyên cho từng nơi tổ chức."
            />
            {validationErrors["participating_cafe_ids"] && (
              <p className="mb-2 text-xs font-semibold text-red-500">
                {validationErrors["participating_cafe_ids"]}
              </p>
            )}
            {validationErrors["resource_locks"] ? (
              <p className="mb-2 text-xs font-semibold text-red-500">
                {validationErrors["resource_locks"]}
              </p>
            ) : null}

            <div className="space-y-3">
              {cafes.map((cafe) => {
                const checked = form.participating_cafe_ids.includes(cafe.id)
                const trackConfigs = (trackConfigsByCafe[cafe.id] ?? []).filter(
                  (item) => item.is_active,
                )
                const lockState = resourceLocks[cafe.id] ?? {
                  scope: "FULL_BRANCH" as const,
                  track_config_ids: [],
                }
                const singleTrack = trackConfigs.length <= 1

                return (
                  <div
                    key={cafe.id}
                    className="rounded-lg border border-[#e5e2e1] p-3"
                  >
                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setForm((current) => ({
                            ...current,
                            participating_cafe_ids: e.target.checked
                              ? [...current.participating_cafe_ids, cafe.id]
                              : current.participating_cafe_ids.filter(
                                  (id) => id !== cafe.id,
                                ),
                          }))
                        }
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[#1c1b1b]">
                          {cafe.name}
                        </p>
                        <p className="text-xs font-medium text-[#747878]">
                          {cafe.district}, {cafe.city}
                        </p>
                      </div>
                    </label>

                    {checked ? (
                      <div className="mt-3 rounded-lg bg-[#fcf8f8] p-3">
                        {singleTrack ? (
                          <p className="text-sm font-semibold text-[#5d5f5f]">
                            Chi nhánh này hiện chỉ có một sân hoạt động. Hệ
                            thống sẽ tự khóa toàn bộ chi nhánh trong khung giờ
                            giải đấu.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            <div className="grid gap-3 md:grid-cols-2">
                              <label className="rounded-lg border border-[#e5e2e1] bg-white px-3 py-2 text-sm font-semibold text-[#1c1b1b]">
                                <input
                                  type="radio"
                                  className="mr-2"
                                  checked={lockState.scope === "FULL_BRANCH"}
                                  onChange={() =>
                                    setResourceLocks((current) => ({
                                      ...current,
                                      [cafe.id]: {
                                        scope: "FULL_BRANCH",
                                        track_config_ids: [],
                                      },
                                    }))
                                  }
                                />
                                Khóa toàn bộ chi nhánh
                              </label>
                              <label className="rounded-lg border border-[#e5e2e1] bg-white px-3 py-2 text-sm font-semibold text-[#1c1b1b]">
                                <input
                                  type="radio"
                                  className="mr-2"
                                  checked={
                                    lockState.scope === "SELECTED_TRACKS"
                                  }
                                  onChange={() =>
                                    setResourceLocks((current) => ({
                                      ...current,
                                      [cafe.id]: {
                                        scope: "SELECTED_TRACKS",
                                        track_config_ids:
                                          current[cafe.id]?.track_config_ids ??
                                          [],
                                      },
                                    }))
                                  }
                                />
                                Chỉ khóa sân được chọn
                              </label>
                            </div>

                            {lockState.scope === "SELECTED_TRACKS" ? (
                              <div className="space-y-2">
                                {trackConfigs.map((trackConfig) => {
                                  const trackChecked =
                                    lockState.track_config_ids.includes(
                                      trackConfig.id,
                                    )
                                  return (
                                    <label
                                      key={trackConfig.id}
                                      className="flex items-start gap-3 rounded-lg border border-[#e5e2e1] bg-white px-3 py-2"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={trackChecked}
                                        onChange={(e) =>
                                          setResourceLocks((current) => {
                                            const existing = current[
                                              cafe.id
                                            ] ?? {
                                              scope: "SELECTED_TRACKS" as const,
                                              track_config_ids: [],
                                            }
                                            return {
                                              ...current,
                                              [cafe.id]: {
                                                ...existing,
                                                scope: "SELECTED_TRACKS",
                                                track_config_ids: e.target
                                                  .checked
                                                  ? [
                                                      ...existing.track_config_ids,
                                                      trackConfig.id,
                                                    ]
                                                  : existing.track_config_ids.filter(
                                                      (id) =>
                                                        id !== trackConfig.id,
                                                    ),
                                              },
                                            }
                                          })
                                        }
                                      />
                                      <div>
                                        <p className="text-sm font-bold text-[#1c1b1b]">
                                          {trackConfig.track_type?.name ??
                                            "Sân thi đấu"}
                                        </p>
                                        <p className="text-xs font-medium text-[#747878]">
                                          Tối đa {trackConfig.max_concurrent}{" "}
                                          lượt thuê cùng lúc
                                        </p>
                                      </div>
                                    </label>
                                  )
                                })}
                              </div>
                            ) : (
                              <p className="text-sm font-semibold text-[#5d5f5f]">
                                Mọi booking mới trong khung giờ giải đấu tại chi
                                nhánh này sẽ bị chặn để dành tài nguyên cho
                                giải.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </Panel>

          <Panel>
            <PanelTitle
              title="Quy tắc vận hành"
              subtitle="Thiết lập xe thi đấu và tóm tắt cách hệ thống sẽ vận hành contest."
            />
            <div className="space-y-4">
              <Field
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
              </Field>
              <Field
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
              </Field>

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

          {isEdit ? (
            <Panel>
              <PanelTitle
                title="Vận hành giải đấu"
                subtitle="Màn này chỉ giữ phần cấu hình. Mọi thao tác tiếp nhận, check-in, xếp nhánh và nhập kết quả nằm ở khu vận hành riêng."
              />
              <div className="rounded-lg border border-dashed border-[#c4c7c8] bg-[#fcf8f8] p-6">
                <p className="text-sm font-semibold text-[#5d5f5f]">
                  Sau khi lưu cấu hình, hãy chuyển sang màn vận hành để tiếp
                  nhận người chơi, check-in, tạo nhánh đấu và nhập kết quả.
                </p>
                <Button
                  type="button"
                  className="mt-4 h-10 gap-2 rounded-lg bg-[#1c1b1b] text-white hover:bg-[#313030]"
                  onClick={() =>
                    navigate(
                      routePaths.providerContestRuntime.replace(
                        ":contestId",
                        contestId!,
                      ),
                    )
                  }
                >
                  <PlayCircle className="size-4" />
                  Mở màn vận hành
                </Button>
              </div>
            </Panel>
          ) : null}
        </div>
      </div>
    </ProviderShell>
  )
}

function Field({
  label,
  className,
  error,
  children,
}: {
  label: string
  className?: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="block text-sm font-bold text-[#1c1b1b]">{label}</Label>
      {children}
      {error ? (
        <p className="mt-1 text-xs font-semibold text-red-500">{error}</p>
      ) : null}
    </div>
  )
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

function getRuntimeFormatFromCode(
  code?: string | null,
): "TIME_TRIAL" | "KNOCKOUT" {
  return code === "TIME_TRIAL" ? "TIME_TRIAL" : "KNOCKOUT"
}

function stripManagedContestConfig(
  config: Record<string, unknown> | null | undefined,
) {
  const nextConfig = { ...(config ?? {}) }
  delete nextConfig.format
  delete nextConfig.runtime_format
  delete nextConfig.resource_locks
  return nextConfig
}

function buildResourceLocks(
  cafeIds: string[],
  trackConfigsByCafe: Record<string, TrackConfig[]>,
  resourceLocks: ResourceLockState,
) {
  return cafeIds.map((cafeId) => {
    const trackConfigs = (trackConfigsByCafe[cafeId] ?? []).filter(
      (item) => item.is_active,
    )
    const lockState = resourceLocks[cafeId]

    if (trackConfigs.length <= 1) {
      return {
        cafe_id: cafeId,
        scope: "FULL_BRANCH" as const,
        track_config_ids: trackConfigs.map((item) => item.id),
      }
    }

    if (lockState?.scope === "SELECTED_TRACKS") {
      return {
        cafe_id: cafeId,
        scope: "SELECTED_TRACKS" as const,
        track_config_ids: lockState.track_config_ids.filter((trackId) =>
          trackConfigs.some((item) => item.id === trackId),
        ),
      }
    }

    return {
      cafe_id: cafeId,
      scope: "FULL_BRANCH" as const,
      track_config_ids: trackConfigs.map((item) => item.id),
    }
  })
}
