import { ProviderSimpleResourcePage } from "@/pages/provider/components/ProviderSimpleResourcePage"

export function ProviderMenuPage() {
  return (
    <ProviderSimpleResourcePage
      title="Quản lý menu đồ uống"
      description="Bật/tắt món, kiểm soát tồn kho và gợi ý combo cho khách đặt lịch."
      metrics={[
        ["Món đang bán", "42", "8 combo active"],
        ["Doanh thu F&B", "12.4M ₫", "+9.1% tháng này"],
        ["Hết hàng", "3", "Cần nhập lại"],
      ]}
      columns={["Món", "Giá", "Cơ sở", "Tồn kho", "Ghi chú"]}
      rows={[
        ["Cold Brew Nitro", "55.000 ₫", "RC Quận 7", "Còn hàng", "Bán chạy"],
        ["Combo Race Night", "120.000 ₫", "Toàn chuỗi", "Còn hàng", "Gợi ý đặt lịch"],
        ["Matcha Latte", "49.000 ₫", "RC Thảo Điền", "Sắp hết", "12 ly"],
      ]}
    />
  )
}
