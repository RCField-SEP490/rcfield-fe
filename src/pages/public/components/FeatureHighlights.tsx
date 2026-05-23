import { CalendarCheck, Car, MapPin, ShieldCheck } from "lucide-react"
import { landingFeatures } from "@/shared/data/landing-data"

const icons = {
  map: MapPin,
  calendar: CalendarCheck,
  shield: ShieldCheck,
  car: Car,
}

export function FeatureHighlights() {
  return (
    <section className="border-y border-slate-200 bg-slate-50 py-16">
      <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
        <div className="mb-10 max-w-2xl space-y-3">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">Hệ sinh thái RC</p>
          <h2 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">Tập trung vào thao tác người chơi cần nhất.</h2>
          <p className="font-medium leading-7 text-slate-600">Mọi khối UI đều tách data và component để sau này mở rộng API, booking, payment hoặc quản trị cơ sở.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {landingFeatures.map((feature) => {
            const Icon = icons[feature.icon]
            return (
              <article key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-black text-slate-950">{feature.title}</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-500">{feature.description}</p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
