import { AlertTriangle, Clock, MessageSquare } from "lucide-react"
import { PAIN_POINTS } from "./partner-data"

const ICONS = [
  <AlertTriangle className="size-5 text-red-500" />,
  <Clock className="size-5 text-amber-500" />,
  <MessageSquare className="size-5 text-rose-500" />,
]

export function PartnerPainPoints() {
  return (
    <section className="bg-slate-50 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {/* Header */}
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs font-black uppercase tracking-widest text-orange-500">
            Bạn đang gặp vấn đề này?
          </p>
          <h2 className="text-3xl font-black text-slate-900 md:text-4xl">
            Những nỗi đau của chủ sân RC
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-500">
            Hầu hết chủ sân đều gặp phải — và chúng tôi đã xây dựng RCField để giải quyết triệt để.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PAIN_POINTS.map((point, i) => (
            <div
              key={point.title}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-orange-200 hover:shadow-md"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-orange-100 bg-orange-50">
                {ICONS[i]}
              </div>
              <h3 className="mb-2 text-lg font-black text-slate-900">{point.title}</h3>
              <p className="text-sm leading-6 text-slate-600">{point.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
