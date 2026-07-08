import { useMemo, useState, useEffect, type ReactNode } from "react"
import { CarFront, Clock3, Heart, Images, MapPin, Share2, Star, WalletCards } from "lucide-react"
import { toast } from "sonner"
import type { Cafe } from "@/shared/data/explore-data"
import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { useAuthStore } from "@/features/auth/stores/auth.store"
import { favoriteApi } from "@/features/explore/api/favorite.api"

export function CafeDetailHero({ cafe }: { cafe: Cafe }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [isFavorite, setIsFavorite] = useState(() => {
    try {
      const favs = localStorage.getItem("rcfield_favorite_cafes")
      const list = favs ? JSON.parse(favs) : []
      return Array.isArray(list) && list.includes(cafe.id)
    } catch {
      return false
    }
  })

  useEffect(() => {
    const loadFav = async () => {
      let localFavs: string[] = []
      try {
        const favsStr = localStorage.getItem("rcfield_favorite_cafes")
        if (favsStr) {
          const parsed = JSON.parse(favsStr)
          if (Array.isArray(parsed)) localFavs = parsed
        }
      } catch (e) {
        console.warn("Failed to parse local favorites", e)
      }

      if (isAuthenticated) {
        try {
          const isSynced = localStorage.getItem("rcfield_favorites_synced") === "true"
          let latestFavs = localFavs
          if (!isSynced) {
            latestFavs = await favoriteApi.syncFavorites(localFavs)
            localStorage.setItem("rcfield_favorites_synced", "true")
          } else {
            latestFavs = await favoriteApi.getFavorites()
          }
          localStorage.setItem("rcfield_favorite_cafes", JSON.stringify(latestFavs))
          setIsFavorite(latestFavs.includes(cafe.id))
        } catch (e) {
          console.error("Failed to load favorites from backend", e)
          setIsFavorite(localFavs.includes(cafe.id))
        }
      } else {
        localStorage.removeItem("rcfield_favorites_synced")
        setIsFavorite(localFavs.includes(cafe.id))
      }
    }

    loadFav()
  }, [isAuthenticated, cafe.id])

  const toggleFavorite = async () => {
    try {
      const favs = localStorage.getItem("rcfield_favorite_cafes")
      let list: string[] = favs ? JSON.parse(favs) : []
      if (!Array.isArray(list)) list = []
      
      const isFav = list.includes(cafe.id)
      let updatedList = [...list]

      if (isFav) {
        updatedList = updatedList.filter((id) => id !== cafe.id)
        setIsFavorite(false)
        toast.success("Đã xóa khỏi danh sách yêu thích")
        if (isAuthenticated) {
          await favoriteApi.removeFavorite(cafe.id)
        }
      } else {
        updatedList.push(cafe.id)
        setIsFavorite(true)
        toast.success("Đã thêm vào danh sách yêu thích")
        if (isAuthenticated) {
          await favoriteApi.addFavorite(cafe.id)
        }
      }
      localStorage.setItem("rcfield_favorite_cafes", JSON.stringify(updatedList))
    } catch (error) {
      console.error("Failed to toggle favorite:", error)
      // Rollback
      try {
        const favs = localStorage.getItem("rcfield_favorite_cafes")
        const list = favs ? JSON.parse(favs) : []
        setIsFavorite(Array.isArray(list) && list.includes(cafe.id))
      } catch {
        // ignore
      }
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: cafe.name, url })
      } catch {
        // user cancelled — do nothing
      }
    } else {
      await navigator.clipboard.writeText(url)
      toast.success("Đã sao chép link chi nhánh")
    }
  }
  const images = useMemo(
    () => dedupeImages([cafe.image, ...(cafe.images ?? []), ...cafe.availableVehicles.map((vehicle) => vehicle.image)]),
    [cafe],
  )
  const targetFirstImage = images[0] ?? cafe.image
  const [activeImage, setActiveImage] = useState(targetFirstImage)
  const [prevFirstImage, setPrevFirstImage] = useState(targetFirstImage)

  if (targetFirstImage !== prevFirstImage) {
    setPrevFirstImage(targetFirstImage)
    setActiveImage(targetFirstImage)
  }

  const galleryTiles = buildGalleryTiles(images, activeImage)

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {cafe.trackTypes.map((track) => (
              <Badge key={track} variant="secondary" className="rounded-full px-2.5 py-1 text-[11px]">
                {track}
              </Badge>
            ))}
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">{cafe.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-600">
            <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {cafe.address}</span>
            <span className="flex items-center gap-1.5 font-medium text-amber-600">
              <Star className="h-4 w-4 fill-amber-500" /> {cafe.rating} ({cafe.reviewsCount} đánh giá)
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="outline" size="icon" className="rounded-full" onClick={() => void handleShare()}>
            <Share2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn("rounded-full transition-colors", isFavorite && "bg-red-50 text-red-500 border-red-200 hover:bg-red-100")}
            onClick={toggleFavorite}
          >
            <Heart className={cn("h-4 w-4", isFavorite && "fill-red-500 text-red-500")} />
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="grid gap-2 p-2 md:h-[340px] md:grid-cols-[1.35fr_0.9fr] overflow-hidden">
          <GalleryButton
            image={activeImage}
            label={`${cafe.name} ảnh chính`}
            onClick={() => setActiveImage(activeImage)}
            className="h-[260px] md:h-full"
            imageClassName="rounded-xl"
          />

          <div className="grid grid-cols-2 gap-2 md:grid-rows-2">
            {galleryTiles.slice(0, 4).map((image, index) => (
              <GalleryButton
                key={`${image}-${index}`}
                image={image}
                label={`${cafe.name} ảnh ${index + 2}`}
                onClick={() => setActiveImage(image)}
                className="h-24 md:h-full"
              >
                {index === 3 && images.length > 5 ? (
                  <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-slate-950/45 text-sm font-semibold text-white">
                    <Images className="mr-2 h-4 w-4" />
                    Xem {images.length} ảnh
                  </span>
                ) : null}
              </GalleryButton>
            ))}
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto border-t bg-slate-50/80 p-2">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActiveImage(image)}
              className={cn(
                "h-14 w-20 shrink-0 overflow-hidden rounded-lg border bg-muted transition hover:opacity-100",
                image === activeImage ? "border-slate-950 opacity-100 ring-2 ring-slate-950/10" : "opacity-70",
              )}
            >
              <img src={image} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <QuickFact icon={WalletCards} label="Giá tham khảo" value={cafe.priceRange} />
        <QuickFact icon={Clock3} label="Slot tiêu chuẩn" value="60 phút/slot" />
        <QuickFact icon={CarFront} label="Xe thuê" value={`${cafe.availableVehicles.length} mẫu sẵn sàng`} />
        <QuickFact icon={Star} label="Đánh giá" value={`${cafe.rating}/5 · ${cafe.reviewsCount} lượt`} />
      </div>
    </section>
  )
}

function QuickFact({ icon: Icon, label, value }: { icon: typeof Star; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-xl border bg-white px-3 py-2 shadow-sm">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-medium text-slate-500">{label}</span>
        <span className="block truncate text-xs font-bold text-slate-950">{value}</span>
      </span>
    </div>
  )
}

function GalleryButton({
  image,
  label,
  onClick,
  className,
  imageClassName,
  children,
}: {
  image: string
  label: string
  onClick: () => void
  className?: string
  imageClassName?: string
  children?: ReactNode
}) {
  return (
    <button type="button" onClick={onClick} className={cn("group relative overflow-hidden rounded-xl bg-muted", className)}>
      <img
        src={image}
        alt={label}
        className={cn("h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]", imageClassName)}
      />
      {children}
    </button>
  )
}

function buildGalleryTiles(images: string[], activeImage: string) {
  const rest = images.filter((image) => image !== activeImage)
  return rest.length >= 4 ? rest : [...rest, ...images].filter(Boolean)
}

function dedupeImages(images: string[]) {
  return Array.from(new Set(images.filter(Boolean)))
}
