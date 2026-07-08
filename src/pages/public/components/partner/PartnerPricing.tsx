import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router"
import { CheckCircle2, MessageCircle } from "lucide-react"
import { subscriptionApi } from "@/features/subscriptions/api/subscription.api"
import type { PlanName } from "@/features/subscriptions/types"
import { routePaths } from "@/app/router/route-paths"
import { Button } from "@/shared/ui/button"
import { PLAN_DISPLAY, ZALO_OA_URL, formatPrice, getPlanFeatures } from "./partner-data"

const PLAN_ORDER: PlanName[] = ["TRIAL", "STARTER", "GROWTH", "PRO"]

function PricingSkeletons() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-[320px] animate-pulse motion-reduce:animate-none rounded-2xl bg-slate-800/50"
        />
      ))}
    </div>
  )
}

function ContactBanner() {
  return (
    <div className="rounded-2xl border border-amber-300/60 bg-amber-50 p-10 text-center">
      <p className="mb-2 text-lg font-black text-slate-900">Không thể tải bảng giá hiện tại</p>
      <p className="mb-6 text-sm text-slate-600">
        Vui lòng liên hệ để được tư vấn và nhận báo giá trực tiếp từ đội ngũ RCField.
      </p>
      <Button asChild className="h-12 rounded-xl bg-orange-600 px-6 font-black text-white hover:bg-orange-500 min-h-[44px]">
        <a href={ZALO_OA_URL} target="_blank" rel="noopener noreferrer">
          <MessageCircle className="mr-2 size-4" />
          Liên hệ qua Zalo
        </a>
      </Button>
    </div>
  )
}

export function PartnerPricing() {
  const { data: plans, isLoading, isError } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: subscriptionApi.listSubscriptionPlans,
    staleTime: 5 * 60 * 1000,
  })

  const sortedPlans = plans
    ? PLAN_ORDER.map((name) => plans.find((p) => p.name === name)).filter(Boolean)
    : []

  return (
    <section className="bg-slate-50 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {/* Header */}
        <div className="mb-16 text-center">
          <p className="mb-3 text-xs font-black uppercase tracking-widest text-orange-500">
            Bảng giá
          </p>
          <h2 className="text-3xl font-black text-slate-900 md:text-4xl">
            Gói phù hợp cho mọi quy mô sân
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-500">
            Bắt đầu miễn phí 30 ngày — không cần thẻ tín dụng, không cam kết dài hạn.
          </p>
        </div>

        {/* Content */}
        {isLoading ? (
          <PricingSkeletons />
        ) : isError || sortedPlans.length === 0 ? (
          <ContactBanner />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {sortedPlans.map((plan) => {
              if (!plan) return null
              const meta = PLAN_DISPLAY[plan.name as PlanName]
              const { price, period } = formatPrice(plan)
              const features = getPlanFeatures(plan)
              const isPro = plan.name === "PRO"

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-2xl border p-6 transition-all ${
                    meta.isHighlighted
                      ? "scale-105 border-orange-500 bg-gradient-to-b from-orange-600 to-orange-700 shadow-2xl shadow-orange-600/30 z-10"
                      : "border-slate-200 bg-white shadow-sm hover:border-orange-200 hover:shadow-md"
                  }`}
                >
                  {/* Popular badge */}
                  {meta.badge && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-4 py-1 text-xs font-black text-orange-600">
                      {meta.badge}
                    </div>
                  )}

                  {/* Plan name */}
                  <p className={`text-xs font-black uppercase tracking-widest ${meta.isHighlighted ? "text-orange-200" : "text-slate-500"}`}>
                    {meta.label}
                  </p>

                  {/* Price */}
                  <div className="mt-3 mb-6">
                    <span className={`text-3xl font-black ${meta.isHighlighted ? "text-white" : "text-slate-900"}`}>
                      {price}
                    </span>
                    <span className={`ml-1 text-sm ${meta.isHighlighted ? "text-orange-200" : "text-slate-500"}`}>
                      {period}
                    </span>
                    {plan.isTrial && (
                      <p className={`mt-1 text-[11px] ${meta.isHighlighted ? "text-orange-200" : "text-slate-500"}`}>
                        Không cần thẻ tín dụng
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="flex-1 space-y-2.5 mb-6">
                    {features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm">
                        <CheckCircle2 className={`size-4 shrink-0 ${meta.isHighlighted ? "text-orange-200" : "text-emerald-500"}`} />
                        <span className={meta.isHighlighted ? "text-orange-100" : "text-slate-700"}>{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  {isPro ? (
                    <a
                      href={ZALO_OA_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex min-h-[44px] items-center justify-center rounded-xl px-4 py-2.5 text-sm font-black transition-all ${
                        meta.isHighlighted
                          ? "bg-white text-orange-600 hover:bg-orange-50"
                          : "border border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                      }`}
                    >
                      {meta.cta}
                    </a>
                  ) : (
                    <Link
                      to={routePaths.providerRegister}
                      className={`flex min-h-[44px] items-center justify-center rounded-xl px-4 py-2.5 text-sm font-black transition-all ${
                        meta.isHighlighted
                          ? "bg-white text-orange-600 hover:bg-orange-50"
                          : "bg-orange-600 text-white hover:bg-orange-500"
                      }`}
                    >
                      {meta.cta}
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
