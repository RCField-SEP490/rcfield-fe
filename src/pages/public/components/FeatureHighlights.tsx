import { CalendarCheck, Camera, Clock, MapPin, Receipt } from "lucide-react"

const features = [
  {
    icon: MapPin,
    color: "bg-orange-500",
    title: "Tìm sân gần bạn",
    desc: "Lọc theo thành phố, loại track, giá thuê xe và tiện ích. Xem trực tiếp trên bản đồ.",
  },
  {
    icon: CalendarCheck,
    color: "bg-emerald-500",
    title: "Đặt lịch & giữ chỗ",
    desc: "Chọn khung giờ, đặt xe thuê (RENTAL) hoặc mang xe cá nhân (BYOC). Thanh toán online, slot giữ ngay.",
  },
  {
    icon: Camera,
    color: "bg-violet-500",
    title: "Kiểm tra xe minh bạch",
    desc: "Chụp ảnh 4 góc xe trước và sau phiên chơi. Không còn tranh chấp không đáng có.",
  },
  {
    icon: Clock,
    color: "bg-sky-500",
    title: "Theo dõi phiên live",
    desc: "Nhận thông báo đếm ngược thời gian. Gia hạn phiên hoặc order F&B ngay trên app.",
  },
  {
    icon: Receipt,
    color: "bg-amber-500",
    title: "Thanh toán rõ ràng",
    desc: "Hóa đơn chi tiết từng khoản dịch vụ. Thanh toán bồi thường nếu xe có hư hỏng.",
  },
]

export function FeatureHighlights() {
  return (
    <section id="features" className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {/* Header */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-orange-600">
            Mọi thứ bạn cần
          </p>
          <h2 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
            Từ tìm sân đến checkout — <br className="hidden md:block" />
            một luồng, không đứt quãng.
          </h2>
        </div>

        {/* 5 features — first 3 big, last 2 wide */}
        <div className="grid gap-4 md:grid-cols-3">
          {features.slice(0, 3).map(({ icon: Icon, color, title, desc }) => (
            <div
              key={title}
              className="group rounded-3xl border border-slate-100 bg-slate-50/60 p-7 transition-all duration-300 hover:bg-white hover:shadow-lg hover:shadow-slate-200/60 hover:-translate-y-1"
            >
              <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-md ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-lg font-black text-slate-900">{title}</h3>
              <p className="text-sm font-medium leading-6 text-slate-500">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {features.slice(3).map(({ icon: Icon, color, title, desc }) => (
            <div
              key={title}
              className="group flex items-start gap-5 rounded-3xl border border-slate-100 bg-slate-50/60 p-7 transition-all duration-300 hover:bg-white hover:shadow-lg hover:shadow-slate-200/60 hover:-translate-y-1"
            >
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-md ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="mb-1.5 text-lg font-black text-slate-900">{title}</h3>
                <p className="text-sm font-medium leading-6 text-slate-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
