import { ArrowRight } from "lucide-react"
import { landingSteps } from "@/shared/data/landing-data"

export function HowItWorks() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="space-y-3">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">Luồng đặt lịch</p>
            <h2 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">Từ ý định chơi đến booking chỉ qua ba bước.</h2>
          </div>
          <div className="grid gap-4">
            {landingSteps.map((step, index) => (
              <article key={step.title} className="group grid gap-5 rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-white shadow-md shadow-slate-900/20 transition-colors group-hover:bg-orange-600">{index + 1}</span>
                <div>
                  <h3 className="font-black text-slate-950">{step.title}</h3>
                  <p className="mt-1 text-sm font-medium leading-6 text-slate-500">{step.description}</p>
                </div>
                <ArrowRight className="hidden h-5 w-5 text-orange-500 transition-transform group-hover:translate-x-1 sm:block" />
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
