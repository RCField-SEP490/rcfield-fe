import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  BadgePercent,
  Building2,
  CalendarClock,
  Copy,
  Edit3,
  PauseCircle,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react"
import { toast } from "sonner"

import {
  promotionApi,
  type DiscountType,
  type PromoApplicableTo,
  type Promotion,
  type PromotionPayload,
  type ProviderCafe,
} from "@/features/promotions/api/promotion.api"
import { DeleteConfirmationModal } from "@/pages/provider/components/DeleteConfirmationModal"
import { MetricCard, Panel, PanelTitle, StatusBadge } from "@/pages/provider/components/ProviderPrimitives"
import { ProviderShell } from "@/pages/provider/components/ProviderShell"
import { ProviderPageHeader } from "@/pages/provider/components/ProviderPrimitives"
import { cn } from "@/shared/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Switch } from "@/shared/ui/switch"
import { Textarea } from "@/shared/ui/textarea"

type PromotionFormState = {
  code: string
  description: string
  discountType: DiscountType
  discountValue: string
  maxDiscountAmount: string
  minOrderAmount: string
  maxUses: string
  maxUsesPerUser: string
  applicableTo: PromoApplicableTo
  startsAt: string
  expiresAt: string
  isActive: boolean
}

const defaultForm: PromotionFormState = {
  code: "",
  description: "",
  discountType: "PERCENT",
  discountValue: "10",
  maxDiscountAmount: "",
  minOrderAmount: "",
  maxUses: "",
  maxUsesPerUser: "1",
  applicableTo: "ALL",
  startsAt: toDatetimeLocal(new Date()),
  expiresAt: "",
  isActive: true,
}

export function ProviderPromotionsPage() {
  const [cafes, setCafes] = useState<ProviderCafe[]>([])
  const [selectedCafeId, setSelectedCafeId] = useState("")
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<Promotion | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<PromotionFormState>(defaultForm)
  const [copyOpen, setCopyOpen] = useState(false)
  const [copySourceCafeId, setCopySourceCafeId] = useState("")
  const [copySourcePromotions, setCopySourcePromotions] = useState<Promotion[]>([])
  const [copyPromotionId, setCopyPromotionId] = useState("")
  const [copyLoading, setCopyLoading] = useState(false)
  const [copying, setCopying] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null)
  const [selectedPromotionIds, setSelectedPromotionIds] = useState<string[]>([])
  const [deleteMode, setDeleteMode] = useState<"single" | "selected" | "all" | null>(null)
  const [deleting, setDeleting] = useState(false)

  const selectedCafe = cafes.find((cafe) => cafe.id === selectedCafeId)
  const copySourceCafes = cafes.filter((cafe) => cafe.id !== selectedCafeId)
  const copySourceCafe = cafes.find((cafe) => cafe.id === copySourceCafeId)
  const copyPromotion = copySourcePromotions.find((promotion) => promotion.id === copyPromotionId)
  const selectedPromotions = promotions.filter((promotion) => selectedPromotionIds.includes(promotion.id))
  const allPromotionsSelected = promotions.length > 0 && selectedPromotionIds.length === promotions.length
  const existingPromotionCodes = useMemo(
    () => new Set(promotions.map((promotion) => promotion.code.toUpperCase())),
    [promotions]
  )

  const stats = useMemo(() => {
    const now = Date.now()
    const active = promotions.filter((promotion) => isPromotionLive(promotion, now)).length
    const expiringSoon = promotions.filter((promotion) => {
      if (!promotion.expiresAt || !promotion.isActive) return false
      const expiresAt = new Date(promotion.expiresAt).getTime()
      return expiresAt >= now && expiresAt <= now + 7 * 24 * 60 * 60 * 1000
    }).length
    const uses = promotions.reduce((total, promotion) => total + promotion.usesCount, 0)

    return { active, expiringSoon, uses }
  }, [promotions])

  useEffect(() => {
    let mounted = true

    async function loadCafes() {
      try {
        setLoading(true)
        const data = await promotionApi.listProviderCafes()
        if (!mounted) return
        setCafes(data)
        setSelectedCafeId((current) => current || data[0]?.id || "")
      } catch {
        toast.error("Không tải được danh sách chi nhánh")
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void loadCafes()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!selectedCafeId) {
      setPromotions([])
      return
    }

    let mounted = true

    async function loadPromotions() {
      try {
        setLoading(true)
        const data = await promotionApi.listByCafe(selectedCafeId)
        if (mounted) setPromotions(data)
      } catch {
        toast.error("Không tải được ưu đãi của chi nhánh")
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void loadPromotions()
    return () => {
      mounted = false
    }
  }, [selectedCafeId])

  useEffect(() => {
    setCopyOpen(false)
    setCopySourceCafeId("")
    setCopySourcePromotions([])
    setCopyPromotionId("")
    setSelectedPromotionIds([])
    setDeleteTarget(null)
    setDeleteMode(null)
  }, [selectedCafeId])

  useEffect(() => {
    if (!copyOpen || !copySourceCafeId) {
      setCopySourcePromotions([])
      setCopyPromotionId("")
      return
    }

    let mounted = true

    async function loadSourcePromotions() {
      try {
        setCopyLoading(true)
        const data = await promotionApi.listByCafe(copySourceCafeId)
        if (!mounted) return
        setCopySourcePromotions(data)
        setCopyPromotionId((current) => current || data[0]?.id || "")
      } catch {
        toast.error("Không tải được mã ưu đãi của chi nhánh nguồn")
      } finally {
        if (mounted) setCopyLoading(false)
      }
    }

    void loadSourcePromotions()
    return () => {
      mounted = false
    }
  }, [copyOpen, copySourceCafeId])

  const resetForm = () => {
    setEditing(null)
    setForm(defaultForm)
    setFormOpen(false)
  }

  const startCreate = () => {
    setEditing(null)
    setForm(defaultForm)
    setFormOpen(true)
    setCopyOpen(false)
  }

  const startEdit = (promotion: Promotion) => {
    setEditing(promotion)
    setForm({
      code: promotion.code,
      description: promotion.description ?? "",
      discountType: promotion.discountType,
      discountValue: numberInputValue(promotion.discountValue),
      maxDiscountAmount: numberInputValue(promotion.maxDiscountAmount),
      minOrderAmount: numberInputValue(promotion.minOrderAmount),
      maxUses: promotion.maxUses?.toString() ?? "",
      maxUsesPerUser: promotion.maxUsesPerUser.toString(),
      applicableTo: promotion.applicableTo,
      startsAt: toDatetimeLocal(new Date(promotion.startsAt)),
      expiresAt: promotion.expiresAt ? toDatetimeLocal(new Date(promotion.expiresAt)) : "",
      isActive: promotion.isActive,
    })
    setFormOpen(true)
    setCopyOpen(false)
  }

  const startCopy = () => {
    setEditing(null)
    setFormOpen(false)
    setCopyOpen(true)
    setCopySourceCafeId((current) => current || copySourceCafes[0]?.id || "")
  }

  const togglePromotionSelection = (promotionId: string) => {
    setSelectedPromotionIds((ids) =>
      ids.includes(promotionId) ? ids.filter((id) => id !== promotionId) : [...ids, promotionId]
    )
  }

  const toggleAllPromotions = () => {
    setSelectedPromotionIds(allPromotionsSelected ? [] : promotions.map((promotion) => promotion.id))
  }

  const openSingleDelete = (promotion: Promotion) => {
    setDeleteTarget(promotion)
    setDeleteMode("single")
  }

  const openSelectedDelete = () => {
    if (selectedPromotionIds.length === 0) return
    setDeleteTarget(null)
    setDeleteMode("selected")
  }

  const openDeleteAll = () => {
    if (promotions.length === 0) return
    setDeleteTarget(null)
    setDeleteMode("all")
  }

  const savePromotion = async () => {
    if (!selectedCafeId) return
    const validationMessage = getPromotionFormError(form)
    if (validationMessage) {
      toast.error(validationMessage)
      return
    }

    try {
      setSaving(true)
      const payload = toPayload(form)
      const saved = editing
        ? await promotionApi.update(selectedCafeId, editing.id, payload)
        : await promotionApi.create(selectedCafeId, payload)

      setPromotions((items) => editing ? items.map((item) => item.id === saved.id ? saved : item) : [saved, ...items])
      toast.success(editing ? "Đã cập nhật ưu đãi" : "Đã tạo ưu đãi")
      resetForm()
    } catch (error) {
      toast.error("Không lưu được ưu đãi", {
        description: getErrorMessage(error),
      })
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (promotion: Promotion) => {
    if (!selectedCafeId) return

    try {
      const updated = await promotionApi.update(selectedCafeId, promotion.id, {
        is_active: !promotion.isActive,
      })
      setPromotions((items) => items.map((item) => item.id === updated.id ? updated : item))
      toast.success(updated.isActive ? "Đã bật ưu đãi" : "Đã tắt ưu đãi")
    } catch (error) {
      toast.error("Không đổi được trạng thái ưu đãi", {
        description: getErrorMessage(error),
      })
    }
  }

  const deletePromotion = async (promotion: Promotion) => {
    if (!selectedCafeId) return
    try {
      await promotionApi.remove(selectedCafeId, promotion.id)
      setPromotions((items) => items.filter((item) => item.id !== promotion.id))
      toast.success("Đã xóa ưu đãi")
      setDeleteTarget(null)
    } catch (error) {
      toast.error("Không xóa được ưu đãi", {
        description: getErrorMessage(error),
      })
    }
  }

  const deletePromotions = async (ids: string[]) => {
    if (!selectedCafeId) return
    const uniqueIds = Array.from(new Set(ids))
    if (uniqueIds.length === 0) return

    try {
      setDeleting(true)
      await Promise.all(uniqueIds.map((id) => promotionApi.remove(selectedCafeId, id)))
      setPromotions((items) => items.filter((item) => !uniqueIds.includes(item.id)))
      setSelectedPromotionIds((items) => items.filter((id) => !uniqueIds.includes(id)))
      toast.success(uniqueIds.length === 1 ? "Đã xóa ưu đãi" : `Đã xóa ${uniqueIds.length} mã ưu đãi`)
      setDeleteTarget(null)
      setDeleteMode(null)
    } catch (error) {
      toast.error("Không xóa được ưu đãi", {
        description: getErrorMessage(error),
      })
    } finally {
      setDeleting(false)
    }
  }

  const confirmDelete = () => {
    if (deleteMode === "single" && deleteTarget) {
      void deletePromotions([deleteTarget.id])
      return
    }
    if (deleteMode === "selected") {
      void deletePromotions(selectedPromotionIds)
      return
    }
    if (deleteMode === "all") {
      void deletePromotions(promotions.map((promotion) => promotion.id))
    }
  }

  const copyPromotionToSelectedCafe = async () => {
    if (!selectedCafeId || !copyPromotion) return
    if (existingPromotionCodes.has(copyPromotion.code.toUpperCase())) {
      toast.error("Mã ưu đãi này đã có ở chi nhánh đang chọn")
      return
    }

    try {
      setCopying(true)
      const saved = await promotionApi.create(selectedCafeId, promotionToPayload(copyPromotion))
      setPromotions((items) => [saved, ...items])
      toast.success(`Đã thêm mã ${saved.code} vào ${selectedCafe?.name ?? "chi nhánh đang chọn"}`)
      setCopyOpen(false)
      setCopyPromotionId("")
    } catch (error) {
      toast.error("Không sao chép được mã ưu đãi", {
        description: getErrorMessage(error),
      })
    } finally {
      setCopying(false)
    }
  }

  return (
    <ProviderShell>
      <ProviderPageHeader
        title="Ưu đãi theo chi nhánh"
        description="Chọn một chi nhánh bạn sở hữu để tạo, chỉnh sửa và theo dõi mã ưu đãi riêng cho chi nhánh đó."
      />

      <section className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Panel className="lg:sticky lg:top-28 lg:self-start">
          <PanelTitle title="Chi nhánh áp dụng" subtitle="Ưu đãi chỉ hiển thị và được cấu hình trong phạm vi chi nhánh đang chọn." />
          <div className="space-y-3">
            {cafes.map((cafe) => (
              <button
                key={cafe.id}
                type="button"
                onClick={() => {
                  setSelectedCafeId(cafe.id)
                  resetForm()
                }}
                className={cn(
                  "w-full rounded-lg border p-4 text-left transition",
                  selectedCafeId === cafe.id
                    ? "border-orange-200 bg-orange-50 shadow-sm"
                    : "border-[#e5e2e1] bg-white hover:bg-[#f6f3f2]"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-[#1c1b1b]">{cafe.name}</p>
                    <p className="mt-1 text-xs font-medium text-[#747878]">
                      {cafe.district}, {cafe.city}
                    </p>
                  </div>
                  <StatusBadge status={cafe.status} />
                </div>
                <p className="mt-3 line-clamp-2 text-xs font-medium text-[#444748]">{cafe.address}</p>
              </button>
            ))}
          </div>
          {!loading && cafes.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#c4c7c8] bg-[#f6f3f2] p-5 text-sm font-medium text-[#747878]">
              Bạn chưa có chi nhánh nào để cấu hình ưu đãi.
            </div>
          ) : null}
        </Panel>

        <div className="space-y-4">
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MetricCard label="Đang hoạt động" value={String(stats.active)} helper="Theo chi nhánh đang chọn" icon={<BadgePercent />} tone="success" />
            <MetricCard label="Sắp hết hạn" value={String(stats.expiringSoon)} helper="Trong 7 ngày tới" icon={<CalendarClock />} tone={stats.expiringSoon ? "warning" : "neutral"} />
            <MetricCard label="Lượt dùng" value={String(stats.uses)} helper="Tổng lượt dùng mã" icon={<Building2 />} tone="info" />
          </section>

          {formOpen ? (
            <PromotionForm
              cafe={selectedCafe}
              form={form}
              editing={editing}
              saving={saving}
              onChange={setForm}
              onCancel={resetForm}
              onSave={() => void savePromotion()}
            />
          ) : null}

          {copyOpen ? (
            <CopyPromotionPanel
              targetCafe={selectedCafe}
              sourceCafes={copySourceCafes}
              sourceCafeId={copySourceCafeId}
              sourceCafe={copySourceCafe}
              promotions={copySourcePromotions}
              existingCodes={existingPromotionCodes}
              selectedPromotionId={copyPromotionId}
              loading={copyLoading}
              copying={copying}
              onSourceCafeChange={(value) => {
                setCopySourceCafeId(value)
                setCopyPromotionId("")
              }}
              onPromotionChange={setCopyPromotionId}
              onCancel={() => setCopyOpen(false)}
              onCopy={() => void copyPromotionToSelectedCafe()}
            />
          ) : null}

          <Panel>
            <PanelTitle
              title={selectedCafe ? `Danh sách ưu đãi - ${selectedCafe.name}` : "Danh sách ưu đãi"}
              subtitle="Mỗi mã chỉ thuộc chi nhánh đang chọn. Dùng tắt hoạt động để giữ lịch sử lượt dùng."
              action={
                <div className="flex flex-nowrap items-center gap-2">
                  <Button disabled={!selectedCafeId || copySourceCafes.length === 0} variant="outline" onClick={startCopy} className="h-9 whitespace-nowrap rounded-lg bg-white">
                    <Copy className="mr-2 size-4" />
                    Thêm từ chi nhánh
                  </Button>
                  <Button disabled={!selectedCafeId} variant="outline" onClick={startCreate} className="h-9 whitespace-nowrap rounded-lg bg-white">
                    <Plus className="mr-2 size-4" />
                    Thêm mã
                  </Button>
                </div>
              }
            />

            {loading ? (
              <div className="rounded-lg border border-[#e5e2e1] bg-[#f6f3f2] p-8 text-center text-sm font-semibold text-[#747878]">
                Đang tải dữ liệu ưu đãi...
              </div>
            ) : promotions.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#c4c7c8] bg-[#fcf8f8] p-10 text-center">
                <BadgePercent className="mx-auto size-10 text-[#747878]" />
                <h3 className="mt-4 text-lg font-bold text-[#1c1b1b]">Chi nhánh này chưa có ưu đãi</h3>
                <p className="mt-2 text-sm font-medium text-[#747878]">Tạo mã đầu tiên để khách hàng áp dụng khi đặt sân hoặc thuê xe.</p>
                <Button disabled={!selectedCafeId} onClick={startCreate} className="mt-5 rounded-lg bg-[#1c1b1b] text-white hover:bg-[#313030]">
                  <Plus className="mr-2 size-4" />
                  Tạo ưu đãi
                </Button>
              </div>
            ) : (
              <div className="grid gap-3">
                <div className="flex flex-col gap-3 rounded-lg border border-[#e5e2e1] bg-[#fcf8f8] p-3 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex items-center gap-3 text-sm font-bold text-[#1c1b1b]">
                    <input
                      type="checkbox"
                      checked={allPromotionsSelected}
                      onChange={toggleAllPromotions}
                      className="size-4 rounded border-[#c4c7c8] accent-orange-600"
                    />
                    Chọn tất cả ({selectedPromotionIds.length}/{promotions.length})
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button disabled={selectedPromotionIds.length === 0} variant="outline" onClick={openSelectedDelete} className="h-9 rounded-lg bg-white text-red-600 hover:bg-red-50">
                      <Trash2 className="mr-2 size-4" />
                      Xóa đã chọn
                    </Button>
                    <Button disabled={promotions.length === 0} variant="outline" onClick={openDeleteAll} className="h-9 rounded-lg bg-white text-red-600 hover:bg-red-50">
                      <Trash2 className="mr-2 size-4" />
                      Xóa hết
                    </Button>
                  </div>
                </div>
                {promotions.map((promotion) => (
                  <PromotionRow
                    key={promotion.id}
                    promotion={promotion}
                    selected={selectedPromotionIds.includes(promotion.id)}
                    onSelect={() => togglePromotionSelection(promotion.id)}
                    onEdit={() => startEdit(promotion)}
                    onToggle={() => void toggleActive(promotion)}
                    onDelete={() => openSingleDelete(promotion)}
                  />
                ))}
              </div>
            )}
          </Panel>
        </div>
      </section>

      <DeleteConfirmationModal
        isOpen={!!deleteMode}
        onClose={() => {
          if (deleting) return
          setDeleteTarget(null)
          setDeleteMode(null)
        }}
        onConfirm={confirmDelete}
        offerData={
          deleteMode === "selected"
            ? {
                code: `Xóa ${selectedPromotions.length} mã đã chọn`,
                description: `Các mã này sẽ bị xóa khỏi ${selectedCafe?.name ?? "chi nhánh đang chọn"}.`,
                details: "Kiểm tra lại danh sách trước khi xác nhận.",
                items: selectedPromotions.map((promotion) => promotionToDeleteItem(promotion)),
              }
            : deleteMode === "all"
              ? {
                  code: `Xóa tất cả ${promotions.length} mã`,
                  description: `Toàn bộ mã ưu đãi của ${selectedCafe?.name ?? "chi nhánh đang chọn"} sẽ bị xóa.`,
                  details: "Thao tác này áp dụng cho toàn bộ danh sách hiện tại.",
                  items: promotions.map((promotion) => promotionToDeleteItem(promotion)),
                }
              : deleteTarget
            ? {
                code: deleteTarget.code,
                status: getPromotionStatus(deleteTarget).label,
                statusClassName: getPromotionStatus(deleteTarget).className,
                description: deleteTarget.description || "Chưa có mô tả",
                details: `${formatDiscount(deleteTarget)} · Đã dùng ${deleteTarget.usesCount}/${deleteTarget.maxUses ?? "∞"}`,
              }
            : null
        }
      />

      <AlertDialog open={false} onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}>
        <AlertDialogContent className="max-w-md rounded-xl border border-[#e5e2e1] bg-white p-0 text-[#1c1b1b]">
          <div className="p-5">
            <AlertDialogHeader className="place-items-start text-left">
              <AlertDialogMedia className="mb-3 rounded-lg bg-red-50 text-red-600">
                <AlertTriangle className="size-6" />
              </AlertDialogMedia>
              <AlertDialogTitle className="text-xl font-extrabold">
                Xóa mã ưu đãi?
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-2 text-sm font-medium leading-6 text-[#5d5f5f]">
                Mã này sẽ bị xóa khỏi chi nhánh đang chọn. Nếu mã đã phát sinh lượt dùng, hệ thống sẽ không cho xóa và bạn nên tắt hoạt động để giữ lịch sử.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {deleteTarget ? (
              <div className="mt-5 rounded-lg border border-red-100 bg-red-50/60 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-white px-2.5 py-1 font-mono text-sm font-extrabold text-[#1c1b1b]">
                    {deleteTarget.code}
                  </span>
                  <Badge className={cn("border font-bold", getPromotionStatus(deleteTarget).className)}>
                    {getPromotionStatus(deleteTarget).label}
                  </Badge>
                </div>
                <p className="mt-2 text-sm font-semibold text-[#444748]">
                  {deleteTarget.description || "Chưa có mô tả"}
                </p>
                <p className="mt-2 text-xs font-bold uppercase text-[#747878]">
                  {formatDiscount(deleteTarget)} · Đã dùng {deleteTarget.usesCount}/{deleteTarget.maxUses ?? "∞"}
                </p>
              </div>
            ) : null}
          </div>

          <AlertDialogFooter className="m-0 rounded-b-xl border-t border-[#e5e2e1] bg-[#fcf8f8] px-5 py-4">
            <AlertDialogCancel disabled={deleting} className="rounded-lg bg-white">
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              variant="destructive"
              onClick={(event) => {
                event.preventDefault()
                if (deleteTarget) void deletePromotion(deleteTarget)
              }}
              className="rounded-lg"
            >
              <Trash2 className="mr-2 size-4" />
              {deleting ? "Đang xóa..." : "Xóa ưu đãi"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProviderShell>
  )
}

function PromotionForm({
  cafe,
  form,
  editing,
  saving,
  onChange,
  onCancel,
  onSave,
}: {
  cafe?: ProviderCafe
  form: PromotionFormState
  editing: Promotion | null
  saving: boolean
  onChange: (form: PromotionFormState) => void
  onCancel: () => void
  onSave: () => void
}) {
  const setField = <K extends keyof PromotionFormState>(key: K, value: PromotionFormState[K]) => {
    onChange({ ...form, [key]: value })
  }
  const minStartsAt = toDatetimeLocal(new Date())
  const minExpiresAt = form.startsAt || minStartsAt
  const handleStartsAtChange = (value: string) => {
    onChange({
      ...form,
      startsAt: value,
      expiresAt: form.expiresAt && isBeforeDatetimeLocal(form.expiresAt, value) ? "" : form.expiresAt,
    })
  }
  const handleExpiresAtChange = (value: string) => {
    setField("expiresAt", value && isBeforeDatetimeLocal(value, minExpiresAt) ? minExpiresAt : value)
  }

  return (
    <Panel className="border-orange-200">
      <PanelTitle
        title={editing ? `Chỉnh sửa ${editing.code}` : "Tạo ưu đãi mới"}
        subtitle={cafe ? `Áp dụng cho chi nhánh: ${cafe.name}` : "Chọn chi nhánh trước khi tạo ưu đãi."}
        action={
          <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-lg">
            <X className="size-5" />
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Mã ưu đãi">
          <Input value={form.code} onChange={(event) => setField("code", event.target.value.toUpperCase())} placeholder="EX: DRIFTNIGHT20" className="h-11 rounded-lg bg-white font-mono font-bold" />
        </Field>
        <Field label="Phạm vi áp dụng">
          <select value={form.applicableTo} onChange={(event) => setField("applicableTo", event.target.value as PromoApplicableTo)} className="h-11 w-full rounded-lg border border-[#c4c7c8] bg-white px-3 text-sm font-semibold">
            <option value="ALL">Tất cả booking</option>
            <option value="RENTAL">Thuê xe</option>
            <option value="BYOC">Mang xe cá nhân</option>
          </select>
        </Field>
        <Field label="Loại giảm giá">
          <select value={form.discountType} onChange={(event) => setField("discountType", event.target.value as DiscountType)} className="h-11 w-full rounded-lg border border-[#c4c7c8] bg-white px-3 text-sm font-semibold">
            <option value="PERCENT">Phần trăm</option>
            <option value="FIXED">Số tiền cố định</option>
          </select>
        </Field>
        <Field label={form.discountType === "PERCENT" ? "Giá trị giảm (%)" : "Giá trị giảm (VND)"}>
          <Input type="number" min="0" value={form.discountValue} onChange={(event) => setField("discountValue", event.target.value)} className="h-11 rounded-lg bg-white" />
        </Field>
        <Field label="Giảm tối đa">
          <Input type="number" min="0" value={form.maxDiscountAmount} onChange={(event) => setField("maxDiscountAmount", event.target.value)} placeholder="Bỏ trống nếu không giới hạn" className="h-11 rounded-lg bg-white" />
        </Field>
        <Field label="Đơn tối thiểu">
          <Input type="number" min="0" value={form.minOrderAmount} onChange={(event) => setField("minOrderAmount", event.target.value)} placeholder="Bỏ trống nếu không yêu cầu" className="h-11 rounded-lg bg-white" />
        </Field>
        <Field label="Tổng lượt dùng">
          <Input type="number" min="1" value={form.maxUses} onChange={(event) => setField("maxUses", event.target.value)} placeholder="Không giới hạn" className="h-11 rounded-lg bg-white" />
        </Field>
        <Field label="Lượt dùng mỗi khách">
          <Input type="number" min="1" value={form.maxUsesPerUser} onChange={(event) => setField("maxUsesPerUser", event.target.value)} className="h-11 rounded-lg bg-white" />
        </Field>
        <Field label="Bắt đầu">
          <Input type="datetime-local" min={minStartsAt} value={form.startsAt} onChange={(event) => handleStartsAtChange(event.target.value)} className="h-11 rounded-lg bg-white" />
        </Field>
        <Field label="Kết thúc">
          <Input type="datetime-local" min={minExpiresAt} value={form.expiresAt} onChange={(event) => handleExpiresAtChange(event.target.value)} className="h-11 rounded-lg bg-white" />
        </Field>
        <div className="md:col-span-2">
          <Field label="Mô tả">
            <Textarea value={form.description} onChange={(event) => setField("description", event.target.value)} placeholder="Điều kiện áp dụng hoặc ghi chú nội bộ" className="min-h-24 rounded-lg bg-white" />
          </Field>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-[#e5e2e1] bg-[#f6f3f2] px-4 py-3 md:col-span-2">
          <div>
            <p className="text-sm font-bold text-[#1c1b1b]">Đang hoạt động</p>
            <p className="text-xs font-medium text-[#747878]">Tắt để giữ mã nhưng không cho khách sử dụng.</p>
          </div>
          <Switch checked={form.isActive} onCheckedChange={(checked) => setField("isActive", checked)} />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3 border-t border-[#e5e2e1] pt-5">
        <Button variant="outline" onClick={onCancel} className="rounded-lg bg-white">Hủy</Button>
        <Button disabled={saving} onClick={onSave} className="rounded-lg bg-[#1c1b1b] text-white hover:bg-[#313030]">
          <Save className="mr-2 size-4" />
          {saving ? "Đang lưu..." : editing ? "Lưu thay đổi" : "Lưu ưu đãi"}
        </Button>
      </div>
    </Panel>
  )
}

function CopyPromotionPanel({
  targetCafe,
  sourceCafes,
  sourceCafeId,
  sourceCafe,
  promotions,
  existingCodes,
  selectedPromotionId,
  loading,
  copying,
  onSourceCafeChange,
  onPromotionChange,
  onCancel,
  onCopy,
}: {
  targetCafe?: ProviderCafe
  sourceCafes: ProviderCafe[]
  sourceCafeId: string
  sourceCafe?: ProviderCafe
  promotions: Promotion[]
  existingCodes: Set<string>
  selectedPromotionId: string
  loading: boolean
  copying: boolean
  onSourceCafeChange: (value: string) => void
  onPromotionChange: (value: string) => void
  onCancel: () => void
  onCopy: () => void
}) {
  const selectedPromotion = promotions.find((promotion) => promotion.id === selectedPromotionId)
  const selectedPromotionExists = selectedPromotion ? existingCodes.has(selectedPromotion.code.toUpperCase()) : false

  return (
    <Panel className="border-orange-200">
      <PanelTitle
        title="Thêm mã từ chi nhánh khác"
        subtitle={targetCafe ? `Sao chép mã ưu đãi sang chi nhánh: ${targetCafe.name}` : "Chọn chi nhánh đích trước khi sao chép mã."}
        action={
          <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-lg">
            <X className="size-5" />
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Chi nhánh nguồn">
          <select
            value={sourceCafeId}
            onChange={(event) => onSourceCafeChange(event.target.value)}
            className="h-11 w-full rounded-lg border border-[#c4c7c8] bg-white px-3 text-sm font-semibold"
          >
            {sourceCafes.map((cafe) => (
              <option key={cafe.id} value={cafe.id}>
                {cafe.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Mã đã tạo">
          <select
            value={selectedPromotionId}
            onChange={(event) => onPromotionChange(event.target.value)}
            disabled={loading || promotions.length === 0}
            className="h-11 w-full rounded-lg border border-[#c4c7c8] bg-white px-3 text-sm font-semibold disabled:bg-[#f6f3f2]"
          >
            {loading ? <option>Đang tải mã ưu đãi...</option> : null}
            {!loading && promotions.length === 0 ? <option>Chi nhánh này chưa có mã</option> : null}
            {!loading
              ? promotions.map((promotion) => {
                  const exists = existingCodes.has(promotion.code.toUpperCase())
                  return (
                  <option key={promotion.id} value={promotion.id} disabled={exists}>
                    {promotion.code} - {formatDiscount(promotion)}{exists ? " (đã có)" : ""}
                  </option>
                  )
                })
              : null}
          </select>
        </Field>
      </div>

      {selectedPromotion ? (
        <div className="mt-4 rounded-lg border border-[#e5e2e1] bg-[#fcf8f8] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-white px-2.5 py-1 font-mono text-sm font-extrabold text-[#1c1b1b]">
              {selectedPromotion.code}
            </span>
            <Badge className={cn("border font-bold", getPromotionStatus(selectedPromotion).className)}>
              {getPromotionStatus(selectedPromotion).label}
            </Badge>
          </div>
          <p className="mt-2 text-sm font-semibold text-[#444748]">
            {sourceCafe?.name} {"->"} {targetCafe?.name}
          </p>
          <p className="mt-1 text-sm font-medium text-[#747878]">
            {selectedPromotion.description || "Chưa có mô tả"}
          </p>
          <p className="mt-3 text-xs font-bold uppercase text-[#747878]">
            {formatDiscount(selectedPromotion)} · {applicableLabel(selectedPromotion.applicableTo)}
          </p>
          {selectedPromotionExists ? (
            <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              Mã này đã có ở chi nhánh đích, vui lòng chọn mã khác.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 flex justify-end gap-3 border-t border-[#e5e2e1] pt-5">
        <Button variant="outline" onClick={onCancel} className="rounded-lg bg-white">Hủy</Button>
        <Button disabled={copying || !selectedPromotionId || !targetCafe || selectedPromotionExists} onClick={onCopy} className="rounded-lg bg-[#1c1b1b] text-white hover:bg-[#313030]">
          <Copy className="mr-2 size-4" />
          {copying ? "Đang thêm..." : "Thêm vào chi nhánh"}
        </Button>
      </div>
    </Panel>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="font-mono text-[11px] uppercase tracking-wider text-[#747878]">{label}</Label>
      {children}
    </div>
  )
}

function PromotionRow({
  promotion,
  selected,
  onSelect,
  onEdit,
  onToggle,
  onDelete,
}: {
  promotion: Promotion
  selected: boolean
  onSelect: () => void
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
}) {
  const status = getPromotionStatus(promotion)

  return (
    <article className={cn(
      "grid gap-4 rounded-lg border bg-white p-4 transition hover:bg-[#fcf8f8] lg:grid-cols-[auto_1.2fr_1fr_1fr_auto] lg:items-center",
      selected ? "border-orange-300 bg-orange-50/60" : "border-[#e5e2e1]"
    )}>
      <label className="flex items-center gap-2 self-start lg:self-center" aria-label={`Chọn mã ${promotion.code}`}>
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          className="size-4 rounded border-[#c4c7c8] accent-orange-600"
        />
      </label>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-[#f6f3f2] px-2.5 py-1 font-mono text-sm font-extrabold text-[#1c1b1b]">
            {promotion.code}
          </span>
          <Badge className={cn("border font-bold", status.className)}>{status.label}</Badge>
        </div>
        <p className="mt-2 line-clamp-2 text-sm font-medium text-[#444748]">
          {promotion.description || "Chưa có mô tả"}
        </p>
      </div>
      <div>
        <p className="font-mono text-[10px] uppercase tracking-wider text-[#747878]">Giá trị</p>
        <p className="mt-1 text-sm font-extrabold text-[#1c1b1b]">{formatDiscount(promotion)}</p>
        <p className="mt-1 text-xs font-medium text-[#747878]">{applicableLabel(promotion.applicableTo)}</p>
      </div>
      <div>
        <p className="font-mono text-[10px] uppercase tracking-wider text-[#747878]">Lượt dùng</p>
        <p className="mt-1 text-sm font-extrabold text-[#1c1b1b]">
          {promotion.usesCount}/{promotion.maxUses ?? "∞"}
        </p>
        <p className="mt-1 text-xs font-medium text-[#747878]">Mỗi khách: {promotion.maxUsesPerUser}</p>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" size="icon" onClick={onEdit} className="rounded-lg bg-white">
          <Edit3 className="size-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={onToggle} className="rounded-lg bg-white">
          <PauseCircle className="size-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={onDelete} className="rounded-lg bg-white text-red-600 hover:bg-red-50">
          <Trash2 className="size-4" />
        </Button>
      </div>
    </article>
  )
}

function toPayload(form: PromotionFormState): PromotionPayload {
  return {
    code: form.code.trim().toUpperCase(),
    description: form.description.trim() || null,
    discount_type: form.discountType,
    discount_value: Number(form.discountValue),
    max_discount_amount: optionalNumber(form.maxDiscountAmount),
    min_order_amount: optionalNumber(form.minOrderAmount),
    max_uses: optionalNumber(form.maxUses),
    max_uses_per_user: Number(form.maxUsesPerUser || 1),
    applicable_to: form.applicableTo,
    starts_at: new Date(form.startsAt).toISOString(),
    expires_at: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
    is_active: form.isActive,
  }
}

function promotionToPayload(promotion: Promotion): PromotionPayload {
  return {
    code: promotion.code,
    description: promotion.description,
    discount_type: promotion.discountType,
    discount_value: Number(promotion.discountValue),
    max_discount_amount: promotion.maxDiscountAmount === null ? null : Number(promotion.maxDiscountAmount),
    min_order_amount: promotion.minOrderAmount === null ? null : Number(promotion.minOrderAmount),
    max_uses: promotion.maxUses,
    max_uses_per_user: promotion.maxUsesPerUser,
    applicable_to: promotion.applicableTo,
    starts_at: promotion.startsAt,
    expires_at: promotion.expiresAt,
    is_active: promotion.isActive,
  }
}

function promotionToDeleteItem(promotion: Promotion) {
  return {
    id: promotion.id,
    code: promotion.code,
    status: getPromotionStatus(promotion).label,
    statusClassName: getPromotionStatus(promotion).className,
    description: promotion.description || "Chưa có mô tả",
    details: `${formatDiscount(promotion)} · Đã dùng ${promotion.usesCount}/${promotion.maxUses ?? "∞"}`,
  }
}

function getPromotionFormError(form: PromotionFormState) {
  if (!form.code.trim()) return "Vui lòng nhập mã ưu đãi"
  if (!form.discountValue.trim() || Number(form.discountValue) <= 0) {
    return "Giá trị giảm phải lớn hơn 0"
  }
  if (!form.maxUsesPerUser.trim() || Number(form.maxUsesPerUser) <= 0) {
    return "Lượt dùng mỗi khách phải lớn hơn 0"
  }
  if (!isValidDatetimeLocal(form.startsAt)) return "Vui lòng chọn thời gian bắt đầu hợp lệ"
  if (form.expiresAt && isBeforeDatetimeLocal(form.expiresAt, form.startsAt)) {
    return "Thời gian kết thúc phải sau thời gian bắt đầu"
  }
  return null
}

function optionalNumber(value: string): number | null {
  return value.trim() ? Number(value) : null
}

function toDatetimeLocal(date: Date) {
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 16)
}

function isBeforeDatetimeLocal(value: string, min: string) {
  return new Date(value).getTime() < new Date(min).getTime()
}

function isValidDatetimeLocal(value: string) {
  return value.trim().length > 0 && !Number.isNaN(new Date(value).getTime())
}

function numberInputValue(value: string | null) {
  return value === null ? "" : String(Number(value))
}

function isPromotionLive(promotion: Promotion, now = Date.now()) {
  if (!promotion.isActive) return false
  if (new Date(promotion.startsAt).getTime() > now) return false
  if (promotion.expiresAt && new Date(promotion.expiresAt).getTime() < now) return false
  if (promotion.maxUses !== null && promotion.usesCount >= promotion.maxUses) return false
  return true
}

function getPromotionStatus(promotion: Promotion) {
  if (!promotion.isActive) return { label: "Đã tắt", className: "border-slate-200 bg-slate-50 text-slate-600" }
  if (new Date(promotion.startsAt).getTime() > Date.now()) return { label: "Sắp chạy", className: "border-blue-200 bg-blue-50 text-blue-700" }
  if (promotion.expiresAt && new Date(promotion.expiresAt).getTime() < Date.now()) return { label: "Hết hạn", className: "border-red-200 bg-red-50 text-red-700" }
  if (promotion.maxUses !== null && promotion.usesCount >= promotion.maxUses) return { label: "Hết lượt", className: "border-amber-200 bg-amber-50 text-amber-700" }
  return { label: "Active", className: "border-emerald-200 bg-emerald-50 text-emerald-700" }
}

function formatDiscount(promotion: Promotion) {
  if (promotion.discountType === "PERCENT") {
    const cap = promotion.maxDiscountAmount ? `, tối đa ${formatMoney(promotion.maxDiscountAmount)}` : ""
    return `${Number(promotion.discountValue)}%${cap}`
  }
  return formatMoney(promotion.discountValue)
}

function formatMoney(value: string) {
  return `${Number(value).toLocaleString("vi-VN")} đ`
}

function applicableLabel(value: PromoApplicableTo) {
  return {
    ALL: "Tất cả booking",
    RENTAL: "Thuê xe",
    BYOC: "Mang xe cá nhân",
  }[value]
}

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response
    return response?.data?.message
  }
  return undefined
}
