import type { CafeSearchParams } from "@/shared/data/explore-data"

interface FilterSection {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}

export function ExploreFiltersSidebar(props: {
  city: string
  onCityChange: (v: string) => void
  trackType: string
  onTrackTypeChange: (v: string) => void
  priceRange: string
  onPriceRangeChange: (v: string) => void
  feature: string
  onFeatureChange: (v: string) => void
  vehicleType: string
  onVehicleTypeChange: (v: string) => void
  date: string
  onDateChange: (v: string) => void
  activeFilterCount: number
  onClear: () => void
}) {
  const sections: FilterSection[] = [
    {
      label: "Thành phố", value: props.city, onChange: props.onCityChange,
      options: [
        { value: "all", label: "Tất cả" },
        { value: "Hồ Chí Minh", label: "Hồ Chí Minh" },
        { value: "Hà Nội", label: "Hà Nội" },
        { value: "Đà Nẵng", label: "Đà Nẵng" },
        { value: "Hải Phòng", label: "Hải Phòng" },
      ],
    },
    {
      label: "Loại đường đua", value: props.trackType, onChange: props.onTrackTypeChange,
      options: [
        { value: "all", label: "Tất cả" },
        { value: "Drift", label: "Drift" },
        { value: "Offroad", label: "Offroad" },
        { value: "Touring", label: "Touring" },
        { value: "Mini-Z", label: "Mini-Z" },
        { value: "Drag", label: "Drag" },
      ],
    },
    {
      label: "Khung giá", value: props.priceRange, onChange: props.onPriceRangeChange,
      options: [
        { value: "all", label: "Tất cả" },
        { value: "under100", label: "Dưới 100k/h" },
        { value: "100to200", label: "100k - 200k/h" },
        { value: "over200", label: "Trên 200k/h" },
      ],
    },
    {
      label: "Tiện ích", value: props.feature, onChange: props.onFeatureChange,
      options: [
        { value: "all", label: "Tất cả" },
        { value: "Serious Inspection", label: "Kiểm xe" },
        { value: "Đồ ăn & Nước uống", label: "F&B" },
        { value: "Hệ thống Đèn đêm", label: "Đèn đêm" },
        { value: "Pit Lane chuyên nghiệp", label: "Pit Lane" },
        { value: "Mát lạnh Điều hòa", label: "Điều hòa" },
      ],
    },
    {
      label: "Loại xe", value: props.vehicleType, onChange: props.onVehicleTypeChange,
      options: [
        { value: "all", label: "Tất cả" },
        { value: "Drift", label: "Drift" },
        { value: "Offroad", label: "Offroad" },
        { value: "Touring", label: "Touring" },
        { value: "Mini", label: "Mini-Z" },
      ],
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Bộ lọc</h3>
        {props.activeFilterCount > 0 && (
          <button onClick={props.onClear} className="text-xs font-semibold text-orange-600 hover:text-orange-700">
            Xoá {props.activeFilterCount}
          </button>
        )}
      </div>

      {sections.map((section) => (
        <div key={section.label}>
          <p className="mb-1.5 text-xs font-semibold text-slate-700">{section.label}</p>
          <div className="space-y-0.5">
            {section.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => section.onChange(opt.value)}
                className={`block w-full px-2 py-1.5 text-left text-xs transition ${
                  section.value === opt.value
                    ? "bg-slate-900 font-semibold text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div>
        <p className="mb-1.5 text-xs font-semibold text-slate-700">Ngày</p>
        <input
          type="date"
          value={props.date}
          onChange={(e) => props.onDateChange(e.target.value)}
          className="w-full border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-slate-400"
        />
      </div>
    </div>
  )
}
