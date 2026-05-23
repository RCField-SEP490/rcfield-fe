export interface FilterOption {
  value: string
  label: string
}

export const CITY_OPTIONS: FilterOption[] = [
  { value: "all", label: "Tất cả thành phố" },
  { value: "Hồ Chí Minh", label: "Hồ Chí Minh" },
  { value: "Hà Nội", label: "Hà Nội" },
  { value: "Đà Nẵng", label: "Đà Nẵng" },
  { value: "Hải Phòng", label: "Hải Phòng" },
]

export const TRACK_TYPE_OPTIONS: FilterOption[] = [
  { value: "all", label: "Tất cả thể loại" },
  { value: "Drift", label: "Đua Drift Chuyên nghiệp" },
  { value: "Offroad", label: "Địa hình Offroad Arena" },
  { value: "Touring", label: "Đường phẳng Touring" },
  { value: "Mini-Z", label: "Vòng đua Mini-Z thảm nỉ" },
  { value: "Drag", label: "Đường Drag bê tông" },
]

export const PRICE_RANGE_OPTIONS: FilterOption[] = [
  { value: "all", label: "Mọi mức giá" },
  { value: "under100", label: "Dưới 100k / giờ" },
  { value: "100to200", label: "100k - 200k / giờ" },
  { value: "over200", label: "Trên 200k / giờ" },
]

export const FEATURE_OPTIONS: FilterOption[] = [
  { value: "all", label: "Tất cả tiện ích" },
  { value: "Serious Inspection", label: "Kiểm xe Serious Inspection" },
  { value: "Đồ ăn & Nước uống", label: "Dịch vụ F&B ăn uống" },
  { value: "Hệ thống Đèn đêm", label: "Đèn chiếu sáng đêm" },
  { value: "Pit Lane chuyên nghiệp", label: "Khu kỹ thuật Pit Stop" },
  { value: "Mát lạnh Điều hòa", label: "Mát lạnh Điều hòa trong nhà" },
]
