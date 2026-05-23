import { ProviderSimpleResourcePage } from "@/pages/provider/components/ProviderSimpleResourcePage"

export function ProviderSubscriptionsPage() {
  return (
    <ProviderSimpleResourcePage
      title="Quản lý hội viên"
      description="Theo dõi thành viên, hạng hội viên, lượt còn lại và rủi ro churn."
      metrics={[
        ["Hội viên active", "428", "+22 tháng này"],
        ["Hạng Gold", "86", "20% tổng hội viên"],
        ["Sắp hết lượt", "34", "Cần nhắc gia hạn"],
      ]}
      columns={["Khách hàng", "Hạng", "Lượt còn", "Trust score", "Cơ sở chính"]}
      rows={[
        ["Minh Anh", "Gold", "6 lượt", "98", "RC Quận 7"],
        ["Gia Huy", "Silver", "2 lượt", "91", "RC Thảo Điền"],
        ["Team Nova", "Corporate", "18 lượt", "100", "Toàn chuỗi"],
      ]}
    />
  )
}
