import { useEffect, useState, type FormEvent } from "react"
import { ImagePlus } from "lucide-react"

import type { MenuItem, MenuUpsertBody } from "@/features/menu/types"
import { uploadImage } from "@/features/uploads/api/upload.api"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Textarea } from "@/shared/ui/textarea"

type ProviderMenuItemFormDialogProps = {
  open: boolean
  item: MenuItem | null
  isPending: boolean
  categoryOptions?: string[]
  onOpenChange: (open: boolean) => void
  onSubmit: (values: MenuUpsertBody) => Promise<void>
}

const defaultValues: MenuUpsertBody = {
  name: "",
  description: "",
  price: 0,
  category: "Đồ uống",
  image_url: null,
  is_available: true,
}

export function ProviderMenuItemFormDialog({
  open,
  item,
  isPending,
  categoryOptions = [],
  onOpenChange,
  onSubmit,
}: ProviderMenuItemFormDialogProps) {
  const [values, setValues] = useState<MenuUpsertBody>(defaultValues)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!open) return
    if (!item) {
      setValues(defaultValues)
      return
    }

    setValues({
      name: item.name,
      description: item.description ?? "",
      price: Number(item.price),
      category: item.category ?? "",
      image_url: item.imageUrl ?? null,
      is_available: item.isAvailable,
    })
  }, [item, open])

  const setField = <K extends keyof MenuUpsertBody>(field: K, value: MenuUpsertBody[K]) => {
    setValues((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await onSubmit({
      name: values.name.trim(),
      description: values.description?.trim() ? values.description.trim() : null,
      price: Number(values.price),
      category: values.category?.trim() ? values.category.trim() : null,
      image_url: values.image_url?.trim() ? values.image_url.trim() : null,
      is_available: values.is_available ?? true,
    })
  }

  const handleUpload = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    try {
      const uploaded = await uploadImage(file, "menu")
      setField("image_url", uploaded.url)
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] max-w-2xl sm:max-w-2xl overflow-y-auto rounded-xl bg-white p-0">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="border-b border-[#e5e2e1] px-5 py-4">
            <DialogTitle className="text-xl font-bold text-[#1c1b1b]">{item ? "Cập nhật món" : "Thêm món"}</DialogTitle>
            <DialogDescription>Quản lý món ăn/uống của cơ sở provider bằng dữ liệu backend.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField label="Tên món" value={values.name} onChange={(value) => setField("name", value)} required />
              <NumberField label="Giá bán" value={values.price} onChange={(value) => setField("price", value ?? 0)} min={0} />
              <CategoryField
                value={values.category ?? ""}
                onChange={(value) => setField("category", value)}
                suggestions={categoryOptions}
              />
              <TextField label="Image URL" value={values.image_url ?? ""} onChange={(value) => setField("image_url", value)} />
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-bold text-[#1c1b1b]">Mô tả</span>
              <Textarea
                value={values.description ?? ""}
                onChange={(event) => setField("description", event.target.value)}
                className="min-h-24 rounded-lg border-[#c4c7c8]"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-[1fr_180px] sm:items-center">
              <label className="block cursor-pointer rounded-lg border border-dashed border-[#c4c7c8] bg-[#fcf8f8] p-4 text-sm font-semibold text-[#444748] hover:bg-[#f6f3f2]">
                <span className="flex items-center gap-2">
                  <ImagePlus className="size-4" />
                  {uploading ? "Đang upload ảnh..." : "Upload ảnh món"}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={uploading || isPending}
                  className="sr-only"
                  onChange={(event) => void handleUpload(event.target.files?.[0])}
                />
              </label>
              <Label className="rounded-lg border border-[#e5e2e1] px-3 py-3">
                <Checkbox
                  checked={values.is_available ?? true}
                  onCheckedChange={(checked) => setField("is_available", checked === true)}
                />
                Đang bán
              </Label>
            </div>

            {values.image_url ? (
              <div className="flex items-center gap-3 rounded-lg border border-[#e5e2e1] bg-[#fcf8f8] p-3 min-w-0 overflow-hidden">
                <img src={values.image_url} alt="" className="size-16 shrink-0 rounded-md object-cover" />
                <span className="min-w-0 flex-1 truncate text-xs font-medium text-[#444748]">{values.image_url}</span>
              </div>
            ) : null}
          </div>

          <DialogFooter className="px-5">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending || uploading}>
              Hủy
            </Button>
            <Button type="submit" disabled={isPending || uploading || values.name.trim().length < 2} className="bg-[#1c1b1b] text-white hover:bg-[#313030]">
              {isPending ? "Đang lưu..." : item ? "Lưu thay đổi" : "Tạo món"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function TextField({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-bold text-[#1c1b1b]">{label}</span>
      <Input value={value} onChange={(event) => onChange(event.target.value)} required={required} className="rounded-lg border-[#c4c7c8]" />
    </label>
  )
}

function CategoryField({
  value,
  onChange,
  suggestions,
}: {
  value: string
  onChange: (value: string) => void
  suggestions: string[]
}) {
  const listId = "menu-category-suggestions"
  return (
    <label className="block space-y-2">
      <span className="text-sm font-bold text-[#1c1b1b]">Danh mục</span>
      <Input
        value={value}
        list={listId}
        placeholder="VD: Đồ uống, Đồ ăn, Tráng miệng..."
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border-[#c4c7c8]"
      />
      <datalist id={listId}>
        {suggestions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </label>
  )
}

function NumberField({
  label,
  value,
  onChange,
  min,
}: {
  label: string
  value: number
  onChange: (value: number | null) => void
  min?: number
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-bold text-[#1c1b1b]">{label}</span>
      <Input
        type="number"
        value={Number.isFinite(value) ? value : ""}
        min={min}
        step="1000"
        onChange={(event) => onChange(event.target.value === "" ? null : Number(event.target.value))}
        className="rounded-lg border-[#c4c7c8]"
      />
    </label>
  )
}
