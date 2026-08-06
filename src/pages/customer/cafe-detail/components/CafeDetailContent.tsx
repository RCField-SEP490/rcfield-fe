import type { AmenityCatalogItem } from "@/features/cafes/types"
import { AmenityIcon } from "@/features/cafes/lib/amenity-icon"
import { cafeRules, cafeAmenities } from "../cafe-detail-data"
import { CafeRatingAggregate } from "@/features/booking-review/components/CafeRatingAggregate"
import { CafeReviewList } from "@/features/booking-review/components/CafeReviewList"

import { CafeSection } from "./SectionShell"

type AmenityLike = { id?: string; title: string; description?: string | null; icon?: string }

/** Giới thiệu cơ sở + trang thiết bị, gộp làm một mạch đọc thay vì hai khối rời. */
export function CafeAboutSection({
  description,
  amenities,
}: {
  description: string
  amenities?: AmenityCatalogItem[]
}) {
  const displayAmenities: AmenityLike[] =
    amenities && amenities.length > 0 ? amenities : cafeAmenities

  return (
    <CafeSection title="Về cơ sở này">
      <p className="max-w-3xl whitespace-pre-line text-base leading-8 text-slate-700">
        {description}
      </p>

      {displayAmenities.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">
            Trang thiết bị & tiện ích
          </h3>
          <ul className="mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            {displayAmenities.map((item) => (
              <AmenityItem key={item.id ?? item.title} item={item} />
            ))}
          </ul>
        </div>
      )}
    </CafeSection>
  )
}

export function CafeReviewsSection({ cafeId }: { cafeId: string }) {
  return (
    <CafeSection title="Đánh giá từ người chơi">
      <div className="space-y-5">
        <CafeRatingAggregate cafeId={cafeId} />
        <CafeReviewList cafeId={cafeId} />
      </div>
    </CafeSection>
  )
}

export function CafeRulesSection({ rules }: { rules?: string[] }) {
  const displayRules = rules && rules.length > 0 ? rules : cafeRules

  return (
    <CafeSection
      title="Quy định cơ sở"
      lead="Đọc trước để buổi chơi diễn ra suôn sẻ."
    >
      <ol className="max-w-3xl space-y-3">
        {displayRules.map((rule, index) => (
          <li key={index} className="flex gap-3 text-sm leading-6 text-slate-600">
            <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-500">
              {index + 1}
            </span>
            <span>{rule}</span>
          </li>
        ))}
      </ol>
    </CafeSection>
  )
}

/**
 * Một tiện ích.
 *
 * Icon suy ra từ `item.icon` trong dữ liệu. Bản cũ hardcode `<Wrench />` cho mọi
 * tiện ích nên cả lưới ra một dãy cờ-lê giống hệt nhau, đọc xong không nhớ được gì.
 */
function AmenityItem({ item }: { item: AmenityLike }) {
  return (
    <li className="flex gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
        <AmenityIcon keyword={item.icon} className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-slate-900">{item.title}</span>
        {item.description && (
          <span className="mt-0.5 block text-sm leading-6 text-slate-500">
            {item.description}
          </span>
        )}
      </span>
    </li>
  )
}
