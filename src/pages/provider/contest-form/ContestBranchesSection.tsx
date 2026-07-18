import type { Dispatch, SetStateAction } from "react"

import type { BackendCafe, TrackConfig } from "@/features/cafes/types"
import {
  Panel,
  PanelTitle,
} from "@/pages/provider/components/ProviderPrimitives"

import type { ContestFormState, ResourceLockState } from "./contest-form-types"

interface ContestBranchesSectionProps {
  form: ContestFormState
  setForm: Dispatch<SetStateAction<ContestFormState>>
  validationErrors: Record<string, string>
  cafes: BackendCafe[]
  trackConfigsByCafe: Record<string, TrackConfig[]>
  resourceLocks: ResourceLockState
  setResourceLocks: Dispatch<SetStateAction<ResourceLockState>>
}

export function ContestBranchesSection({
  form,
  setForm,
  validationErrors,
  cafes,
  trackConfigsByCafe,
  resourceLocks,
  setResourceLocks,
}: ContestBranchesSectionProps) {
  return (
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
  )
}
