export function getVehiclePolicyLabel(policy: string | null | undefined) {
  if (!policy) return "--"
  switch (policy) {
    case "RENTAL_ONLY":
      return "Chỉ sử dụng xe thuê của chi nhánh"
    case "BYOC_ONLY":
      return "Chỉ sử dụng xe cá nhân"
    case "MIXED":
      return "Hỗn hợp (Xe thuê hoặc Xe cá nhân)"
    default:
      return policy
  }
}

/**
 * Câu diễn giải "người thường" cho luật xe — dùng ở phần giới thiệu, nơi khách
 * cần hiểu mình phải chuẩn bị gì chứ không cần biết mã enum.
 */
export function getVehiclePolicyBlurb(policy: string | null | undefined) {
  switch (policy) {
    case "RENTAL_ONLY":
      return "Ban tổ chức chuẩn bị sẵn xe theo chuẩn giải. Bạn chỉ cần tới và cầm lái."
    case "BYOC_ONLY":
      return "Mang chiếc xe của riêng bạn. Khai báo trước để ban tổ chức duyệt kỹ thuật."
    case "MIXED":
      return "Thuê xe tại quầy hoặc mang xe cá nhân — chọn phương án bạn thấy thoải mái nhất."
    default:
      return "Luật sử dụng xe sẽ được ban tổ chức công bố trong điều lệ giải."
  }
}

export function formatCurrency(value: number) {
  if (value === 0) return "Miễn phí"
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value)
}

export function getErrorMessage(error: unknown) {
  const maybe = error as { response?: { data?: { message?: string } } }
  return maybe.response?.data?.message ?? "Vui lòng thử lại sau."
}
