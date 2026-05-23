import type { Cafe } from "@/shared/data/explore-data"

export function ExploreMapPanel({ cafes, active, onSelectCafe }: { cafes: Cafe[]; active: boolean; onClose: () => void; onSelectCafe: (cafe: Cafe) => void; compact?: boolean }) {
  if (!active) return null

  return (
    <div className="h-full">
      <div className="relative h-full overflow-hidden bg-slate-900">
        <div className="absolute inset-0 opacity-70" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, rgba(249,115,22,.24), transparent 28%), radial-gradient(circle at 80% 30%, rgba(14,165,233,.22), transparent 24%), linear-gradient(135deg, #0f172a 0%, #111827 45%, #171717 100%)" }} />
        <svg className="absolute inset-0 h-full w-full text-white/15" aria-hidden="true">
          <path d="M20 80 C160 140 230 40 380 110 S560 180 620 80" fill="none" stroke="currentColor" strokeWidth="18" strokeLinecap="round" />
          <path d="M60 340 C180 250 260 280 350 210 S520 120 650 210" fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
        </svg>
        <div className="absolute left-3 top-3 flex items-center gap-1.5 bg-black/60 px-2 py-1 text-[10px] font-medium text-white">
          <svg className="h-3 w-3 text-orange-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          {cafes.length} cơ sở
        </div>
        {cafes.map((cafe) => (
          <button
            key={cafe.id}
            type="button"
            onClick={() => onSelectCafe(cafe)}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${cafe.coordinates.x}%`, top: `${cafe.coordinates.y}%` }}
          >
            <span className="flex h-6 w-6 items-center justify-center border border-white bg-orange-500 text-white shadow-lg">
              <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
