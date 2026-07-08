import { HOW_IT_WORKS } from "./partner-data"

export function PartnerHowItWorks() {
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {/* Header */}
        <div className="mb-16 text-center">
          <p className="mb-3 text-xs font-black uppercase tracking-widest text-orange-500">
            Quy trình
          </p>
          <h2 className="text-3xl font-black text-slate-900 md:text-4xl">
            Bắt đầu trong 3 bước đơn giản
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-500">
            Từ đăng ký đến nhận booking đầu tiên — thường mất chưa đến 1 giờ.
          </p>
        </div>

        {/* Steps */}
        <div className="relative grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Connector line — desktop only */}
          <div
            className="pointer-events-none absolute top-8 left-0 right-0 hidden h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent lg:block"
            aria-hidden
          />

          {HOW_IT_WORKS.map((step) => (
            <div key={step.number} className="relative flex flex-col items-center text-center lg:items-center">
              {/* Number bubble */}
              <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-orange-200 bg-orange-50">
                <span className="text-2xl font-black text-orange-500">{step.number}</span>
              </div>
              <h3 className="mb-3 text-xl font-black text-slate-900">{step.title}</h3>
              <p className="max-w-xs text-sm leading-6 text-slate-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
