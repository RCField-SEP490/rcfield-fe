import { useState } from "react"
import type { Cafe } from "@/shared/data/explore-data"
import { MapPin, Star, ChevronLeft, ChevronRight } from "lucide-react"

const fallbackImages = [
  "https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=800",
]

export function CafeDetailHero({ cafe }: { cafe: Cafe }) {
  const images = [cafe.image, ...fallbackImages]
  const [activeIdx, setActiveIdx] = useState(0)

  const prev = () => setActiveIdx((i) => (i === 0 ? images.length - 1 : i - 1))
  const next = () => setActiveIdx((i) => (i === images.length - 1 ? 0 : i + 1))

  return (
    <div>
      {/* Title row */}
      <div className="mb-3">
        <h1 className="text-xl font-bold text-slate-900">{cafe.name}</h1>
        <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {cafe.address}
          </span>
          <span className="flex items-center gap-1 text-amber-600">
            <Star className="h-3 w-3 fill-current" /> {cafe.rating} ({cafe.reviewsCount})
          </span>
        </div>
      </div>

      {/* Gallery: main image + thumbnails row - compact like hotel detail */}
      <div className="flex gap-2">
        {/* Main image */}
        <div className="relative h-[280px] w-[420px] shrink-0 overflow-hidden border border-slate-200 bg-slate-100">
          <img
            src={images[activeIdx]}
            alt={cafe.name}
            className="h-full w-full object-cover"
          />
          <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 p-1 text-white hover:bg-black/70">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 p-1 text-white hover:bg-black/70">
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="absolute bottom-2 right-2 bg-black/60 px-2 py-0.5 text-[10px] text-white">
            {activeIdx + 1}/{images.length}
          </span>
        </div>

        {/* Thumbnail strip */}
        <div className="flex flex-col gap-1.5 overflow-y-auto">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIdx(idx)}
              className={`h-16 w-24 shrink-0 overflow-hidden border-2 bg-slate-100 ${
                idx === activeIdx ? "border-orange-500" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <img src={img} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* Detail info row */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
        <span className="border border-slate-200 px-2 py-0.5">{cafe.priceRange}</span>
        <span className="border border-slate-200 px-2 py-0.5">{cafe.availableVehicles.length} xe</span>
        {cafe.trackTypes.map((t) => (
          <span key={t} className="border border-slate-200 px-2 py-0.5">{t}</span>
        ))}
        {cafe.features.slice(0, 3).map((f) => (
          <span key={f} className="border border-slate-200 px-2 py-0.5">{f}</span>
        ))}
      </div>
    </div>
  )
}
