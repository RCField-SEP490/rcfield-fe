import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Car,
  Plus,
  CheckCircle,
  Clock,
  XCircle,
  Cpu,
  Bookmark,
  Wifi,
  Trash2,
  Loader2,
} from "lucide-react"

import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardFooter } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { Label } from "@/shared/ui/label"
import { Input } from "@/shared/ui/input"
import { toast } from "sonner"
import { CustomerSubNav } from "./components/CustomerSubNav"
import { CustomerPageShell } from "./components/CustomerPageShell"
import { customerVehicleApi, type CustomerVehicle } from "@/features/vehicles/api/customer-vehicle.api"

// Zod Schema for Vehicle Registration
const vehicleSchema = z.object({
  name: z.string().min(3, { message: "Tên xe phải có ít nhất 3 ký tự" }),
  scale: z.string().min(1, { message: "Vui lòng nhập tỉ lệ xe (ví dụ: 1/10)" }),
  chassisType: z.enum(["Drift", "Touring", "Crawler", "Off-Road"]),
  frequency: z.string().min(3, { message: "Vui lòng nhập tần số điều khiển (ví dụ: 2.4 GHz)" })
})

type VehicleFormValues = z.infer<typeof vehicleSchema>

export function CustomerVehiclesPage() {
  const [vehicles, setVehicles] = useState<CustomerVehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const fetchVehicles = async () => {
    try {
      setLoading(true)
      const data = await customerVehicleApi.list()
      setVehicles(data)
    } catch (err) {
      toast.error("Không thể tải danh sách xe")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVehicles()
  }, [])

  const { register, handleSubmit, reset, formState: { errors } } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      name: "",
      scale: "1/10",
      chassisType: "Drift",
      frequency: "2.4 GHz"
    }
  })

  const onSubmit = async (data: VehicleFormValues) => {
    try {
      setSubmitting(true)
      const newVehicle = await customerVehicleApi.create({
        name: data.name,
        scale: data.scale,
        chassisType: data.chassisType,
        frequency: data.frequency,
        imageUrl: "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&q=80&w=400"
      })
      setVehicles(prev => [newVehicle, ...prev])
      setIsFormOpen(false)
      reset()
      toast.success("Gửi yêu cầu đăng ký xe thành công!", {
        description: `Mẫu xe ${data.name} đang chờ Ban quản trị phê duyệt tần số & thông số kỹ thuật.`
      })
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Đăng ký xe thất bại")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa xe này không?")) return
    try {
      await customerVehicleApi.delete(id)
      setVehicles(prev => prev.filter(v => v.id !== id))
      toast.success("Xóa xe thành công")
    } catch (err) {
      toast.error("Xóa xe thất bại")
    }
  }

  const getStatusBadge = (status?: string) => {
    const norm = (status || "PENDING").toLowerCase()
    if (norm === "approved" || norm === "confirmed") {
      return (
        <Badge className="bg-emerald-500/10 text-emerald-700 border-none font-bold text-[10px] flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Đã duyệt
        </Badge>
      )
    }
    if (norm === "pending") {
      return (
        <Badge className="bg-amber-500/10 text-amber-700 border-none font-bold text-[10px] flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Đang chờ duyệt
        </Badge>
      )
    }
    return (
      <Badge className="bg-red-500/10 text-red-700 border-none font-bold text-[10px] flex items-center gap-1">
        <XCircle className="h-3 w-3" />
        Bị từ chối
      </Badge>
    )
  }

  return (
    <CustomerPageShell>
      <CustomerSubNav activeTab="vehicles" />

      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-700">Xe RC cá nhân đăng ký</h2>
        <Button
          className="bg-slate-950 hover:bg-slate-900 text-white font-bold h-9 px-4 rounded-xl text-xs"
          onClick={() => setIsFormOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Đăng ký mới
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
        </div>
      ) : vehicles.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <Car className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">Chưa có xe cá nhân nào được đăng ký</p>
          <p className="text-xs text-slate-400 mt-1">Đăng ký xe để sử dụng dịch vụ BYOC (Bring Your Own Car)</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vh) => (
            <Card key={vh.id} className="border-slate-200/80 shadow-sm overflow-hidden hover:shadow-md transition-all flex flex-col bg-white group relative">
              <div className="h-40 w-full overflow-hidden relative bg-slate-100">
                <img 
                  src={vh.imageUrl || "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&q=80&w=400"} 
                  alt={vh.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  {getStatusBadge(vh.status)}
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-7 w-7 rounded-lg bg-red-600 hover:bg-red-705 text-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(vh.id)
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded bg-black/60 text-[9px] font-extrabold text-white tracking-wider uppercase">
                  ID: {vh.id.substring(0, 8).toUpperCase()}
                </div>
              </div>

              <CardContent className="p-5 flex-grow space-y-4 text-xs font-semibold text-slate-600">
                <div>
                  <h3 className="text-base font-extrabold text-slate-950 leading-tight min-h-[40px] flex items-center">
                    {vh.name}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">
                    ĐĂNG KÝ: {vh.createdAt ? new Date(vh.createdAt).toLocaleDateString("vi-VN") : "N/A"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3.5 border-t border-slate-50 pt-4">
                  <div className="flex items-center gap-1.5">
                    <Bookmark className="h-4 w-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="block text-[8px] text-slate-400 uppercase font-bold">Tỉ lệ</span>
                      <span className="text-slate-900 font-bold">{vh.scale}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Cpu className="h-4 w-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="block text-[8px] text-slate-400 uppercase font-bold">Chassis</span>
                      <span className="text-slate-900 font-bold">{vh.chassisType}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2">
                    <Wifi className="h-4 w-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="block text-[8px] text-slate-400 uppercase font-bold">Tần số & Tay cầm</span>
                      <span className="text-slate-900 font-bold">{vh.frequency}</span>
                    </div>
                  </div>
                </div>
              </CardContent>

              {vh.status?.toLowerCase() === "approved" && (
                <CardFooter className="bg-slate-50 px-5 py-3 border-t border-slate-100 text-[10px] font-semibold text-slate-500">
                  <span>* Tay cầm Sanwa đã được gán kênh riêng tại Drift Town.</span>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200/80 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200 text-left relative">
            
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-950 flex items-center gap-2">
                <Car className="h-5 w-5 text-orange-500" />
                Đăng ký xe BYOC cá nhân
              </h3>
              <p className="text-xs font-semibold text-slate-500">
                Khai báo thông số kỹ thuật xe để Ban quản trị đối soát tần số tránh trùng bước sóng.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-bold text-slate-700">Tên xe / Model</Label>
                <Input 
                  id="name" 
                  type="text" 
                  placeholder="Yokomo YD-2ZX Drift Special" 
                  className={`h-10 rounded-lg border-slate-200 focus:border-orange-500 ${errors.name ? 'border-red-500' : ''}`}
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-[11px] font-bold text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="scale" className="text-xs font-bold text-slate-700">Tỉ lệ Scale</Label>
                  <Input 
                    id="scale" 
                    type="text" 
                    placeholder="1/10" 
                    className={`h-10 rounded-lg border-slate-200 focus:border-orange-500 ${errors.scale ? 'border-red-500' : ''}`}
                    {...register("scale")}
                  />
                  {errors.scale && (
                    <p className="text-[11px] font-bold text-red-500">{errors.scale.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="chassisType" className="text-xs font-bold text-slate-700">Thể loại</Label>
                  <select 
                    id="chassisType" 
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs font-semibold focus:border-orange-500 focus:outline-none"
                    {...register("chassisType")}
                  >
                    <option value="Drift">Drift (Sân gỗ/nhám)</option>
                    <option value="Touring">Touring (Đường trường)</option>
                    <option value="Crawler">Crawler (Leo núi)</option>
                    <option value="Off-Road">Off-Road (Đa địa hình)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="frequency" className="text-xs font-bold text-slate-700">Tần số & Bộ tay cầm điều khiển</Label>
                <Input 
                  id="frequency" 
                  type="text" 
                  placeholder="2.4 GHz (Sanwa / Futaba)" 
                  className={`h-10 rounded-lg border-slate-200 focus:border-orange-500 ${errors.frequency ? 'border-red-500' : ''}`}
                  {...register("frequency")}
                />
                {errors.frequency && (
                  <p className="text-[11px] font-bold text-red-500">{errors.frequency.message}</p>
                )}
              </div>

              <div className="flex items-center gap-3 justify-end pt-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="border-slate-200 font-bold h-10 text-xs rounded-xl"
                  onClick={() => {
                    setIsFormOpen(false)
                    reset()
                  }}
                  disabled={submitting}
                >
                  Hủy bỏ
                </Button>
                <Button 
                  type="submit" 
                  className="bg-slate-950 hover:bg-slate-900 text-white font-bold h-10 text-xs rounded-xl flex items-center gap-1.5"
                  disabled={submitting}
                >
                  {submitting && <Loader2 className="h-3 w-3 animate-spin" />}
                  Yêu cầu đăng ký
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </CustomerPageShell>
  )
}
