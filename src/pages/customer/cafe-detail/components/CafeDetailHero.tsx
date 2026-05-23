import { useMemo, useState } from "react"
import type { Cafe } from "@/shared/data/explore-data"
import { MapPin, Star, ChevronLeft, ChevronRight, Images } from "lucide-react"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/lib/utils"

const fallbackImages = [
  "https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&q=80&w=900",
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&q=80&w=900",
  "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=900",
]

export function CafeDetailHero({ cafe }: { cafe: Cafe }) {
  const images = useMemo(() => dedupeImages([cafe.image, ...cafe.availableVehicles.map((vehicle) => vehicle.image), ...fallbackImages]), [cafe])
  const [activeIdx, setActiveIdx] = useState(0)
  const activeImage = images[activeIdx] ?? cafe.image

  const prev = () => setActiveIdx((index) => (index === 0 ? images.length - 1 : index - 1))
  const next = () => setActiveIdx((index) => (index === images.length - 1 ? 0 : index + 1))

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{cafe.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {cafe.address}</span>
          <span className="flex items-center gap-1 text-yellow-600"><Star className="h-4 w-4 fill-yellow-500" /> {cafe.rating} ({cafe.reviewsCount} đánh giá)</span>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-3 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="relative h-[300px] overflow-hidden rounded-lg bg-muted md:h-[360px]">
            <img src={activeImage} alt={cafe.name} className="h-full w-full object-cover" />
            {images.length > 1 && (
              <>
                <Button type="button" variant="secondary" size="icon" onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/90 shadow"><ChevronLeft className="h-4 w-4" /></Button>
                <Button type="button" variant="secondary" size="icon" onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/90 shadow"><ChevronRight className="h-4 w-4" /></Button>
              </>
            )}
            <Badge className="absolute bottom-3 right-3 gap-1 bg-background text-foreground shadow"><Images className="h-3 w-3" /> {activeIdx + 1}/{images.length}</Badge>
          </div>

          <div className="hidden gap-3 lg:grid">
            {images.slice(1, 3).map((image, index) => (
              <button key={`${image}-${index}`} type="button" onClick={() => setActiveIdx(index + 1)} className="overflow-hidden rounded-lg border bg-muted">
                <img src={image} alt={`${cafe.name} ${index + 2}`} className="h-full min-h-0 w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActiveIdx(index)}
              className={cn("h-16 w-24 shrink-0 overflow-hidden rounded-md border bg-muted opacity-75 transition hover:opacity-100", index === activeIdx && "border-primary opacity-100 ring-2 ring-primary/20")}
            >
              <img src={image} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">{cafe.priceRange}</Badge>
        <Badge variant="outline">{cafe.availableVehicles.length} xe thuê</Badge>
        {cafe.trackTypes.map((track) => <Badge key={track} variant="secondary">{track}</Badge>)}
        {cafe.features.slice(0, 4).map((feature) => <Badge key={feature} variant="outline">{feature}</Badge>)}
      </div>
    </section>
  )
}

function dedupeImages(images: string[]) {
  return Array.from(new Set(images.filter(Boolean)))
}
