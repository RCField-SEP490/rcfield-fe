import { Wrench } from "lucide-react"
import type { AmenityCatalogItem } from "@/features/cafes/types"
import { cafeRules, cafeAmenities } from "../cafe-detail-data"
import { TrackConfigList } from "./TrackConfigList"
import { CafeRatingAggregate } from "@/features/booking-review/components/CafeRatingAggregate"
import { CafeReviewList } from "@/features/booking-review/components/CafeReviewList"

export function CafeDetailContent({
  description,
  amenities,
  rules,
  cafeId,
}: {
  description: string
  amenities?: AmenityCatalogItem[]
  rules?: string[]
  cafeId?: string
}) {
  const displayAmenities = amenities && amenities.length > 0 ? amenities : null
  const displayRules = rules && rules.length > 0 ? rules : cafeRules

  return (
    <div className="space-y-10">
      {cafeId && (
        <>
          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900">Loại sân</h2>
            <TrackConfigList cafeId={cafeId} />
          </section>
          <SectionDivider />
        </>
      )}

      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">Về cơ sở này</h2>
        <div className="space-y-3 text-sm leading-6 text-slate-600">
          <p>{description}</p>
        </div>
      </section>

      {displayAmenities !== null && (
        <>
          <SectionDivider />
          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900">Trang thiết bị & Tiện ích</h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {displayAmenities.map((item) => <AmenityItem key={item.id} item={item} />)}
            </div>
          </section>
        </>
      )}

      {displayAmenities === null && cafeAmenities.length > 0 && (
        <>
          <SectionDivider />
          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900">Trang thiết bị & Tiện ích</h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {cafeAmenities.map((item) => (
                <article key={item.title} className="flex gap-2.5 rounded-xl border border-slate-200 bg-white p-3 transition-all hover:shadow-sm">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-blue-50 text-blue-600">
                    <Wrench className="h-3.5 w-3.5" />
                  </span>
                  <span>
                    <span className="block text-xs font-semibold text-slate-900">{item.title}</span>
                    <span className="mt-0.5 block text-[11px] text-slate-500">{item.description}</span>
                  </span>
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      {cafeId && (
        <>
          <SectionDivider />
          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900">Đánh giá</h2>
            <CafeRatingAggregate cafeId={cafeId} />
            <CafeReviewList cafeId={cafeId} />
          </section>
        </>
      )}

      <SectionDivider />

      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">Quy định cơ sở</h2>
        <div className="space-y-2">
          {displayRules.map((rule, index) => (
            <div key={index} className="flex gap-2.5 text-xs leading-5 text-slate-600">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border border-slate-300 bg-slate-100 text-[8px] font-bold text-slate-600">{index + 1}</span>
              <span>{rule}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function AmenityItem({ item }: { item: AmenityCatalogItem }) {
  return (
    <article className="flex gap-2.5 rounded-xl border border-slate-200 bg-white p-3 transition-all hover:shadow-sm">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-blue-50 text-blue-600">
        <Wrench className="h-3.5 w-3.5" />
      </span>
      <span>
        <span className="block text-xs font-semibold text-slate-900">{item.title}</span>
        {item.description && (
          <span className="mt-0.5 block text-[11px] text-slate-500">{item.description}</span>
        )}
      </span>
    </article>
  )
}

function SectionDivider() {
  return <div className="h-px bg-slate-200" />
}
