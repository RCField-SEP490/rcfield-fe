import { useState } from "react"
import { Minus, Plus, ZoomIn } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/ui/dialog"

type ZoomableInspectionImageProps = {
  src: string
  alt: string
  className?: string
  buttonClassName?: string
}

const MIN_ZOOM = 1
const MAX_ZOOM = 3
const ZOOM_STEP = 0.5

/** Opens check-in / checkout evidence in a lightbox with explicit zoom controls. */
export function ZoomableInspectionImage({
  src,
  alt,
  className,
  buttonClassName,
}: ZoomableInspectionImageProps) {
  const [open, setOpen] = useState(false)
  const [zoom, setZoom] = useState(MIN_ZOOM)

  const changeZoom = (direction: 1 | -1) => {
    setZoom((current) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, current + direction * ZOOM_STEP)))
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setZoom(MIN_ZOOM)
          setOpen(true)
        }}
        className={cn(
          "group relative block w-full overflow-hidden text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ea580c] focus-visible:ring-offset-2",
          buttonClassName,
        )}
        aria-label={`Phóng to ${alt}`}
      >
        <img src={src} alt={alt} className={cn("h-full w-full object-cover", className)} />
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30 group-focus-visible:bg-black/30">
          <span className="rounded-full bg-black/70 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            <ZoomIn className="size-4" />
          </span>
        </span>
      </button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (nextOpen) setZoom(MIN_ZOOM)
          setOpen(nextOpen)
        }}
      >
        <DialogContent className="max-h-[96vh] max-w-[calc(100%-1rem)] gap-3 overflow-hidden bg-slate-950 p-3 text-white sm:max-w-5xl" showCloseButton>
          <DialogHeader className="pr-10">
            <DialogTitle className="text-white">{alt}</DialogTitle>
            <DialogDescription className="text-slate-300">Dùng nút +/- để phóng to, thu nhỏ và cuộn để xem chi tiết ảnh.</DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-auto rounded-lg bg-black p-3">
            <img
              src={src}
              alt={alt}
              style={{ width: `${zoom * 100}%`, maxWidth: "none", transition: "width 150ms ease" }}
              className="mx-auto h-auto object-contain"
            />
          </div>
          <div className="flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={zoom <= MIN_ZOOM}
              onClick={() => changeZoom(-1)}
              aria-label="Thu nhỏ ảnh"
            >
              <Minus className="size-4" />
            </Button>
            <span className="min-w-14 text-center text-xs font-bold text-slate-200">{Math.round(zoom * 100)}%</span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={zoom >= MAX_ZOOM}
              onClick={() => changeZoom(1)}
              aria-label="Phóng to ảnh"
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
