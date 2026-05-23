import { ProviderSimpleResourcePage } from "@/pages/provider/components/ProviderSimpleResourcePage"

export function ProviderPromotionsPage() {
  return (
    <ProviderSimpleResourcePage
      title="Ưu đãi và giới thiệu"
      description="Quản lý mã giảm giá, chiến dịch referral và điều kiện áp dụng theo cơ sở."
      metrics={[
        ["Chiến dịch active", "7", "2 sắp kết thúc"],
        ["Lượt dùng mã", "312", "+14% tuần này"],
        ["Chi phí ưu đãi", "8.2M ₫", "Trong ngân sách"],
      ]}
      columns={["Mã", "Giá trị", "Điều kiện", "Đã dùng", "Trạng thái"]}
      rows={[
        ["DRIFTNIGHT20", "20%", "Tối thứ 6", "134 lượt", "Active"],
        ["NEWBIE50", "50.000 ₫", "Khách mới", "98 lượt", "Active"],
        ["TEAMRACE15", "15%", "Đặt nhóm", "80 lượt", "Tạm dừng"],
      ]}
    />
  )
}
