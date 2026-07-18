import type { TrackConfig } from "@/features/cafes/types"

import type { ResourceLockState } from "./contest-form-types"

export function toInputDateTime(value: string) {
  const date = new Date(value)
  const offset = date.getTimezoneOffset()
  const normalized = new Date(date.getTime() - offset * 60_000)
  return normalized.toISOString().slice(0, 16)
}

export function getErrorMessage(error: unknown) {
  const maybe = error as { response?: { data?: { message?: string } } }
  return maybe.response?.data?.message ?? "Vui lòng kiểm tra lại dữ liệu."
}

export function getRuntimeFormatFromCode(
  code?: string | null,
): "TIME_TRIAL" | "KNOCKOUT" {
  return code === "TIME_TRIAL" ? "TIME_TRIAL" : "KNOCKOUT"
}

export function stripManagedContestConfig(
  config: Record<string, unknown> | null | undefined,
) {
  const nextConfig = { ...(config ?? {}) }
  delete nextConfig.format
  delete nextConfig.runtime_format
  delete nextConfig.resource_locks
  return nextConfig
}

export function buildResourceLocks(
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
