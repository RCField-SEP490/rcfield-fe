import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { 
  mockCustomerVehicles, 
  type MockVehicle 
} from "@/shared/data/user-mock-data"
import { 
  Car, 
  Plus, 
  CheckCircle, 
  Clock, 
  XCircle,
  Cpu,
  Bookmark,
  Wifi
} from "lucide-react"

import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardFooter } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { Label } from "@/shared/ui/label"
import { Input } from "@/shared/ui/input"
import { toast } from "sonner"
import { CustomerSubNav } from "./components/CustomerSubNav"

// Zod Schema for Vehicle Registration
const vehicleSchema = z.object({
  name: z.string().min(3, { message: "Tên xe phải có ít nhất 3 ký tự" }),
  scale: z.string().min(1, { message: "Vui lòng nhập tỉ lệ xe (ví dụ: 1/10)" }),
  chassisType: z.enum(["Drift", "Touring", "Crawler", "Off-Road"]),
  frequency: z.string().min(3, { message: "Vui lòng nhập tần số điều khiển (ví dụ: 2.4 GHz)" })
})

type VehicleFormValues = z.infer<typeof vehicleSchema>

export function CustomerVehiclesPage() {
  const [vehicles, setVehicles] = useState<MockVehicle[]>(mockCustomerVehicles)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      name: "",
      scale: "1/10",
      chassisType: "Drift",
      frequency: "2.4 GHz"
    }
  })

  // Submit handler for new Vehicle
  const onSubmit = (data: VehicleFormValues) => {
    const newVehicle: MockVehicle = {
      vehicleId: `VH-${Math.floor(100 + Math.random() * 900)}`,
      name: data.name,
      scale: data.scale,
      chassisType: data.chassisType,
      frequency: data.frequency,
      status: "pending",
      imageUrl: "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&q=80&w=400",
      registeredDate: new Date().toISOString().split('T')[0]
    }

    setVehicles(prev => [newVehicle, ...prev])
    setIsFormOpen(false)
    reset()
    toast.success("Gửi yêu cầu đăng ký xe thành công!", {
      description: `Mẫu xe ${data.name} đang chờ Ban quản trị phê duyệt tần số & thông số kỹ thuật.`
    })
  }

  // Get status color helper
  const getStatusBadge = (status: MockVehicle["status"]) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-700 border-none font-bold text-[10px] flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Đã duyệt
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-amber-500/10 text-amber-700 border-none font-bold text-[10px] flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Đang chờ duyệt
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-red-500/10 text-red-700 border-none font-bold text-[10px] flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Bị từ chối
          </Badge>
        )
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6 md:p-12 relative">
      
      {/* Decorative glows */}
      <div className="absolute top-0 left-[10%] w-[350px] h-[350px] rounded-full bg-orange-400/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[350px] h-[350px] rounded-full bg-indigo-400/10 blur-[100px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        
        {/* Header Ribbon */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
              <Car className="h-4 w-4 text-orange-500" />
              Đội xe BYOC cá nhân
            </div>
            <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight">
              Xe RC Cá Nhân Đăng Ký
            </h1>
          </div>

          <Button 
            className="bg-slate-950 hover:bg-slate-900 text-white font-bold h-11 px-5 rounded-xl shadow-md flex items-center gap-2 transition-all shrink-0"
            onClick={() => setIsFormOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Đăng ký xe BYOC mới
          </Button>
        </div>

        {/* SUB NAVIGATION BAR FOR CUSTOMER SPACE */}
        <CustomerSubNav activeTab="vehicles" />

        {/* VEHICLES GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vh) => (
            <Card key={vh.vehicleId} className="border-slate-200/80 shadow-sm overflow-hidden hover:shadow-md transition-all flex flex-col bg-white">
              
              {/* Vehicle Card Header Cover Image */}
              <div className="h-40 w-full overflow-hidden relative bg-slate-100">
                <img 
                  src={vh.imageUrl} 
                  alt={vh.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                
                {/* Float status badge */}
                <div className="absolute top-3 right-3">
                  {getStatusBadge(vh.status)}
                </div>

                <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded bg-black/60 text-[9px] font-extrabold text-white tracking-wider uppercase">
                  ID: {vh.vehicleId}
                </div>
              </div>

              {/* Card Body */}
              <CardContent className="p-5 flex-grow space-y-4 text-xs font-semibold text-slate-600">
                <div>
                  <h3 className="text-base font-extrabold text-slate-950 leading-tight min-h-[40px] flex items-center">
                    {vh.name}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">ĐĂNG KÝ: {vh.registeredDate}</p>
                </div>

                {/* Specs List */}
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

              {/* Warning Notice for BYOC approved cars */}
              {vh.status === "approved" && (
                <CardFooter className="bg-slate-50 px-5 py-3 border-t border-slate-100 text-[10px] font-semibold text-slate-500">
                  <span>* Tay cầm Sanwa đã được gán kênh riêng tại Drift Town.</span>
                </CardFooter>
              )}

            </Card>
          ))}
        </div>

      </div>

      {/* REGISTER BYOC FORM DIALOG MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200/80 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200 text-left relative">
            
            {/* Modal header */}
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-950 flex items-center gap-2">
                <Car className="h-5 w-5 text-orange-500" />
                Đăng ký xe BYOC cá nhân
              </h3>
              <p className="text-xs font-semibold text-slate-500">
                Khai báo thông số kỹ thuật xe để Ban quản trị đối soát tần số tránh trùng bước sóng.
              </p>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              
              {/* Name */}
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

              {/* Scale & Chassis Grid */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* Scale */}
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

                {/* Chassis Type */}
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

              {/* Frequency */}
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

              {/* Action buttons */}
              <div className="flex items-center gap-3 justify-end pt-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="border-slate-200 font-bold h-10 text-xs rounded-xl"
                  onClick={() => {
                    setIsFormOpen(false)
                    reset()
                  }}
                >
                  Hủy bỏ
                </Button>
                <Button 
                  type="submit" 
                  className="bg-slate-950 hover:bg-slate-900 text-white font-bold h-10 text-xs rounded-xl"
                >
                  Yêu cầu đăng ký
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}
