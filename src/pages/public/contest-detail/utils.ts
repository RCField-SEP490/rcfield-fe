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
