export function formatCurrency(value: number, currency = "VND") {
  if (currency !== "VND") {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(value)}đ`
}
