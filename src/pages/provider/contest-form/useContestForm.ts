import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
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
  buildResourceLocks,
  getErrorMessage,
  getRuntimeFormatFromCode,
  stripManagedContestConfig,
  toInputDateTime,
} from "./contest-form-utils"
import type {
  ContestFormState,
  ResourceLockState,
} from "./contest-form-types"
import { defaultForm } from "./contest-form-types"

export function useContestForm() {
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
            scope?: import("../contest-form/contest-form-types").ResourceLockScope
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

  return {
    contestId,
    isEdit,
    form,
    setForm,
    validationErrors,
    setValidationErrors,
    trackConfigsByCafe,
    resourceLocks,
    setResourceLocks,
    extraConfig,
    setExtraConfig,
    typesQuery,
    formatsQuery,
    templatesQuery,
    trackTypesQuery,
    cafesQuery,
    contestQuery,
    selectedTemplate,
    selectedFormat,
    saveMutation,
    handleSubmit,
  }
}
