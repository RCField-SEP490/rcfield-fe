import { Camera, Coffee, Gauge, Route, Snowflake, Wrench } from "lucide-react"
import { cafeAmenities, cafeRules, type CafeAmenity } from "../cafe-detail-data"

const amenityIcons = {
  timer: Gauge,
  tool: Wrench,
  road: Route,
  snow: Snowflake,
  coffee: Coffee,
  camera: Camera,
}

export function CafeDetailContent({ description }: { description: string }) {
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">Về cơ sở này</h2>
        <div className="space-y-3 text-sm leading-6 text-slate-600">
          <p>{description}</p>
          <p>Khu vực pit được chuẩn hóa với bàn thao tác, nguồn sạc, máy nén khí và màn hình timing. Không gian lounge thoải mái cho khán giả và thành viên nghỉ giữa các chặng đua.</p>
        </div>
      </section>

      <SectionDivider />

      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">Trang thiết bị & Tiện ích</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {cafeAmenities.map((item) => <AmenityItem key={item.title} item={item} />)}
        </div>
      </section>

      <SectionDivider />

      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">Quy định cơ sở</h2>
        <div className="space-y-2">
          {cafeRules.map((rule, index) => (
            <div key={rule} className="flex gap-2.5 text-xs leading-5 text-slate-600">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border border-slate-300 bg-slate-100 text-[8px] font-bold text-slate-600">{index + 1}</span>
              <span>{rule}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function AmenityItem({ item }: { item: CafeAmenity }) {
  const Icon = amenityIcons[item.icon]
  return (
    <article className="flex gap-2.5 border border-slate-200 bg-white p-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-blue-50 text-blue-600"><Icon className="h-3.5 w-3.5" /></span>
      <span>
        <span className="block text-xs font-semibold text-slate-900">{item.title}</span>
        <span className="mt-0.5 block text-[11px] text-slate-500">{item.description}</span>
      </span>
    </article>
  )
}

function SectionDivider() {
  return <div className="h-px bg-slate-200" />
}
