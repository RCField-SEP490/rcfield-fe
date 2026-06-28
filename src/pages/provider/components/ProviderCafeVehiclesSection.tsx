import { useState } from "react"
import { useNavigate } from "react-router"
import {
  Activity,
  AlertTriangle,
  Car,
  ChevronDown,
  ChevronRight,
  Compass,
  Edit2,
  Eye,
  MoreVertical,
  Plus,
  Trash2,
  Wrench,
} from "lucide-react"

import { routePaths } from "@/app/router/route-paths"
import { useVehicleUnits } from "@/features/vehicles/hooks/useVehicleUnits"
import { useVehicleCatalogs } from "@/features/vehicles/hooks/useVehicleCatalogs"
import { useDeleteVehicleCatalog } from "@/features/vehicles/hooks/useVehicleCatalogMutations"
import { VehicleStatus, VehicleTier } from "@/features/vehicles/types"
import type { VehicleCatalog, VehicleUnit } from "@/features/vehicles/types"
import { cn, sanitizeImageUrl, getCatalogImageUrl } from "@/shared/lib/utils"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"

interface ProviderCafeVehiclesSectionProps {
  cafeId: string
}

export function ProviderCafeVehiclesSection({ cafeId }: ProviderCafeVehiclesSectionProps) {
  const navigate = useNavigate()

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [isCatalogDeleteOpen, setIsCatalogDeleteOpen] = useState(false)
  const [catalogToDelete, setCatalogToDelete] = useState<VehicleCatalog | null>(null)

  const { data: units = [], isLoading: isUnitsLoading } = useVehicleUnits(cafeId)
  const { data: catalogs = [], isLoading: isCatalogsLoading } = useVehicleCatalogs(cafeId)
  const deleteCatalogMutation = useDeleteVehicleCatalog(cafeId)

  const toggleExpand = (catalogId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(catalogId)) next.delete(catalogId)
      else next.add(catalogId)
      return next
    })
  }

  const unitsForCatalog = (catalogId: string) =>
    units.filter((u) => (u.catalogId || u.catalog?.id) === catalogId)

  const totalCount = units.length
  const availableCount = units.filter((u) => u.status === VehicleStatus.AVAILABLE).length
  const maintenanceCount = units.filter((u) => u.status === VehicleStatus.MAINTENANCE).length
  const retiredCount = units.filter((u) => u.status === VehicleStatus.RETIRED).length

  const handleDeleteCatalogSubmit = async () => {
    if (!catalogToDelete) return
    try {
      await deleteCatalogMutation.mutateAsync(catalogToDelete.id)
      setIsCatalogDeleteOpen(false)
      setCatalogToDelete(null)
    } catch {}
  }

  const formatVND = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value)

  const isLoading = isUnitsLoading || isCatalogsLoading

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#c4c7c8] bg-white p-4 shadow-sm">
        <div>
          <h3 className="text-base font-extrabold text-zinc-800">Quản lý Đội xe</h3>
          <p className="text-xs text-zinc-500 font-semibold mt-0.5">
            Danh mục mẫu xe và từng xe vật lý tại cơ sở này.
          </p>
        </div>
        <Button
          onClick={() => navigate(`${routePaths.providerVehicleCatalogCreate}?cafeId=${cafeId}`)}
          className="h-10 gap-2 rounded-lg bg-[#1c1b1b] text-white hover:bg-[#313030] font-bold shadow-sm"
        >
          <Plus className="size-4" />
          Thêm danh mục
        </Button>
      </div>

      {/* KPI row */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          label="Tổng số xe"
          value={totalCount.toString()}
          icon={Car}
          accentClass="text-indigo-600"
          bgClass="bg-indigo-50"
        />
        <KpiCard
          label="Sẵn sàng"
          value={availableCount.toString()}
          icon={Activity}
          accentClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <KpiCard
          label="Bảo dưỡng"
          value={maintenanceCount.toString()}
          icon={Wrench}
          accentClass="text-amber-600"
          bgClass="bg-amber-50"
        />
        <KpiCard
          label="Ngừng hoạt động"
          value={retiredCount.toString()}
          icon={AlertTriangle}
          accentClass="text-rose-600"
          bgClass="bg-rose-50"
        />
      </section>

      {/* Catalog accordion list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : catalogs.length === 0 ? (
        <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-[#c4c7c8] bg-white p-8 text-center">
          <Car className="size-10 text-zinc-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-800 mb-1">Chưa có danh mục xe nào</h3>
          <p className="text-sm text-zinc-500 font-semibold max-w-sm mb-5">
            Tạo danh mục mẫu xe đầu tiên để quản lý xe vật lý và giá thuê giờ.
          </p>
          <Button
            onClick={() => navigate(`${routePaths.providerVehicleCatalogCreate}?cafeId=${cafeId}`)}
            className="h-10 bg-[#1c1b1b] text-white rounded-lg hover:bg-[#313030] font-bold"
          >
            Tạo danh mục đầu tiên
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {catalogs.map((catalog) => {
            const catalogUnits = unitsForCatalog(catalog.id)
            const isExpanded = expandedIds.has(catalog.id)
            const catalogImageUrl = getCatalogImageUrl(catalog)

            return (
              <div
                key={catalog.id}
                className="overflow-hidden rounded-xl border border-[#c4c7c8] bg-white shadow-sm"
              >
                {/* Catalog header row */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-zinc-50 transition-colors select-none"
                  onClick={() => toggleExpand(catalog.id)}
                >
                  {/* Thumbnail */}
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-[#f6f3f2] border border-[#e5e2e1]">
                    {catalogImageUrl ? (
                      <img
                        src={catalogImageUrl}
                        alt={catalog.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-zinc-300">
                        <Car className="size-7 stroke-[1]" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-sm font-extrabold text-zinc-900 truncate">{catalog.name}</h4>
                      <Badge
                        className={cn(
                          "text-[10px] font-bold shrink-0 border",
                          catalog.tier === VehicleTier.RESTRICTED
                            ? "bg-red-50 text-red-700 border-red-200"
                            : catalog.tier === VehicleTier.PREMIUM
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-zinc-100 text-zinc-600 border-zinc-200"
                        )}
                      >
                        {catalog.tier}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 font-semibold">
                      <span className="font-bold text-zinc-700">{formatVND(catalog.hourlyRate)}/giờ</span>
                      <span className="flex items-center gap-1">
                        <Car className="size-3" />
                        {catalogUnits.length} xe
                      </span>
                      {catalog.compatibleTrackTypes && catalog.compatibleTrackTypes.length > 0 && (
                        <span className="hidden sm:flex items-center gap-1 truncate">
                          <Compass className="size-3 shrink-0" />
                          {catalog.compatibleTrackTypes
                            .map((t) => (typeof t === "string" ? t : t.name))
                            .join(", ")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    className="flex items-center gap-1 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="flex size-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 transition-colors"
                        >
                          <MoreVertical className="size-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 rounded-lg bg-white border-[#c4c7c8]">
                        <DropdownMenuItem
                          onClick={() =>
                            navigate(
                              `${routePaths.providerVehicleCatalogEdit.replace(":catalogId", catalog.id)}?cafeId=${cafeId}`
                            )
                          }
                          className="cursor-pointer gap-2 py-2"
                        >
                          <Edit2 className="size-4" />
                          <span>Chỉnh sửa danh mục</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setCatalogToDelete(catalog)
                            setIsCatalogDeleteOpen(true)
                          }}
                          className="cursor-pointer gap-2 py-2 text-red-600 focus:text-red-700 focus:bg-red-50"
                        >
                          <Trash2 className="size-4" />
                          <span>Xóa danh mục</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <button
                      type="button"
                      onClick={() => toggleExpand(catalog.id)}
                      className="flex size-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="size-4" />
                      ) : (
                        <ChevronRight className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Inline unit list */}
                {isExpanded && (
                  <div className="border-t border-[#e5e2e1] bg-[#fafaf9]">
                    {catalogUnits.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Car className="size-8 text-zinc-300 mb-2" />
                        <p className="text-sm font-bold text-zinc-600 mb-1">Chưa có xe nào trong danh mục này</p>
                        <Button
                          size="sm"
                          onClick={() =>
                            navigate(
                              `${routePaths.providerVehicleUnitCreate.replace(":catalogId", catalog.id)}?cafeId=${cafeId}`
                            )
                          }
                          className="h-8 mt-2 gap-1.5 rounded-lg bg-[#1c1b1b] text-white hover:bg-[#313030] font-bold text-xs"
                        >
                          <Plus className="size-3.5" />
                          Thêm xe đầu tiên
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <div className="divide-y divide-[#f0edec]">
                          {catalogUnits.map((unit) => (
                            <UnitRow
                              key={unit.id}
                              unit={unit}
                              catalog={catalog}
                              cafeId={cafeId}
                            />
                          ))}
                        </div>
                        <div className="flex justify-end border-t border-[#e5e2e1] p-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              navigate(
                                `${routePaths.providerVehicleUnitCreate.replace(":catalogId", catalog.id)}?cafeId=${cafeId}`
                              )
                            }
                            className="h-8 gap-1.5 rounded-lg border-[#c4c7c8] font-bold text-xs text-zinc-700 hover:bg-zinc-50"
                          >
                            <Plus className="size-3.5" />
                            Thêm xe
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Delete Catalog Dialog */}
      <Dialog open={isCatalogDeleteOpen} onOpenChange={setIsCatalogDeleteOpen}>
        <DialogContent className="max-w-md rounded-xl bg-white border border-[#c4c7c8] p-6">
          <DialogHeader>
            <div className="flex size-12 items-center justify-center rounded-full bg-red-50 text-red-600 mb-2">
              <AlertTriangle className="size-6" />
            </div>
            <DialogTitle className="text-lg font-bold text-[#1c1b1b]">
              Xác nhận xóa danh mục?
            </DialogTitle>
            <DialogDescription className="text-sm text-[#444748] pt-1">
              Bạn có chắc chắn muốn xóa danh mục{" "}
              <strong>{catalogToDelete?.name}</strong>? Hành động này sẽ xóa toàn bộ cấu hình giá
              của danh mục và không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCatalogDeleteOpen(false)
                setCatalogToDelete(null)
              }}
              className="h-10 rounded-lg border-[#c4c7c8] font-bold"
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleDeleteCatalogSubmit}
              disabled={deleteCatalogMutation.isPending}
              className="h-10 rounded-lg bg-red-600 text-white hover:bg-red-700 font-bold"
            >
              {deleteCatalogMutation.isPending ? "Đang xóa..." : "Xác nhận xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function UnitRow({
  unit,
  catalog,
  cafeId,
}: {
  unit: VehicleUnit
  catalog: VehicleCatalog
  cafeId: string
}) {
  const navigate = useNavigate()
  const catalogId = unit.catalogId || unit.catalog?.id || catalog.id

  const statusConfig = {
    AVAILABLE: {
      label: "Sẵn sàng",
      dot: "bg-emerald-500",
      badge: "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    IN_USE: {
      label: "Đang thuê",
      dot: "bg-blue-500",
      badge: "text-blue-700 bg-blue-50 border-blue-200",
    },
    MAINTENANCE: {
      label: "Bảo trì",
      dot: "bg-amber-500",
      badge: "text-amber-700 bg-amber-50 border-amber-200",
    },
    RETIRED: {
      label: "Hỏng",
      dot: "bg-rose-500",
      badge: "text-rose-700 bg-rose-50 border-rose-200",
    },
  }[unit.status] ?? {
    label: "Không rõ",
    dot: "bg-gray-400",
    badge: "text-gray-700 bg-gray-50 border-gray-200",
  }

  const imageUrl =
    sanitizeImageUrl(unit.distinctive_image_url) ||
    getCatalogImageUrl(catalog) ||
    "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?q=80&w=200&auto=format&fit=crop"

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/80 transition-colors">
      <div className="size-10 shrink-0 overflow-hidden rounded-lg border border-zinc-100 bg-zinc-50">
        <img
          src={imageUrl}
          alt={unit.identifier}
          className="h-full w-full object-cover"
          onError={(e) => {
            ;(e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?q=80&w=200&auto=format&fit=crop"
          }}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-extrabold text-zinc-900 truncate">{unit.identifier}</p>
        {unit.color && (
          <p className="text-xs text-zinc-500 font-semibold truncate">{unit.color}</p>
        )}
      </div>

      <span
        className={cn(
          "hidden sm:inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-extrabold shrink-0",
          statusConfig.badge
        )}
      >
        <span className={cn("size-1.5 rounded-full", statusConfig.dot)} />
        {statusConfig.label}
      </span>

      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          navigate(
            `${routePaths.providerVehicleDetail
              .replace(":catalogId", catalogId)
              .replace(":vehicleId", unit.id)}?cafeId=${cafeId}&from=catalogs`
          )
        }
        className="h-7 rounded-lg text-xs font-bold gap-1 border-zinc-200 text-zinc-700 hover:bg-zinc-50 shrink-0"
      >
        <Eye className="size-3.5" />
        <span className="hidden sm:inline">Xem chi tiết</span>
      </Button>
    </div>
  )
}

function KpiCard({
  label,
  value,
  icon: Icon,
  accentClass,
  bgClass,
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  accentClass: string
  bgClass: string
}) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-zinc-200/60 bg-white p-5 shadow-sm">
      <div
        className={cn(
          "absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl",
          bgClass
        )}
      >
        <Icon className={cn("size-5", accentClass)} />
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-extrabold text-zinc-900 leading-tight">{value}</p>
      </div>
    </article>
  )
}
