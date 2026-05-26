import { useNavigate } from "react-router"
import { routePaths } from "@/app/router/route-paths"
import {
  Building2,
  CalendarCheck,
  Bot,
  BarChart3,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Flame,
  Users2
} from "lucide-react"

export function PartnerLandingPage() {
  const navigate = useNavigate()

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 antialiased pt-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-6 lg:px-8 border-b border-slate-100 bg-white">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-orange-600/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-amber-500/5 blur-[100px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-100/60 text-xs font-bold text-orange-600 uppercase tracking-wider mb-2">
            <Sparkles className="size-3 text-orange-500 animate-spin-slow" /> Chương trình đối tác liên kết
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Số hóa & Tối ưu vận hành <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-amber-500">
              Sân đua & RC Cafe của bạn
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-500 leading-relaxed">
            Hệ thống quản lý SaaS toàn diện giúp tự động hóa đặt lịch, quản trị đội xe rental, chăm sóc khách hàng 24/7 bằng chatbot AI và kiểm tra hiện trạng xe bằng hình ảnh minh bạch.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <button
              onClick={() => navigate(routePaths.providerRegister)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 py-3.5 px-8 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-sm transition duration-150 shadow-lg shadow-orange-600/25 active:translate-y-[1px]"
            >
              Đăng ký đối tác ngay
              <ArrowRight className="size-4" />
            </button>
            <button
              onClick={() => navigate(routePaths.login)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 py-3.5 px-8 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-sm transition duration-150"
            >
              Đăng nhập Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Giải pháp chuyên biệt cho mô hình RC Cafe
          </h2>
          <p className="mt-4 text-slate-500 text-sm leading-relaxed">
            Được thiết kế từ thực tế kinh doanh mô hình trải nghiệm xe mô hình điều khiển từ xa, giải quyết triệt để các rủi ro vận hành.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={<Building2 className="size-6 text-orange-600" />}
            title="Quản lý Cơ sở & Sân đua"
            desc="Cấu hình thông tin sân đua, lịch mở cửa, giá vé theo khung giờ và quản lý nhiều chi nhánh trên cùng một tài khoản."
          />
          <FeatureCard
            icon={<CalendarCheck className="size-6 text-orange-600" />}
            title="Đặt lịch & Bàn giao xe rental"
            desc="Quy trình bàn giao xe rental bằng hình ảnh trực quan (check-in/check-out) giúp phân định hư hỏng minh bạch, giảm tranh chấp."
          />
          <FeatureCard
            icon={<Bot className="size-6 text-orange-600" />}
            title="Trợ lý Chatbot AI 24/7"
            desc="Tích hợp chatbot thông minh trực tiếp tư vấn, trả lời các thắc mắc về giá vé, lịch trống và hỗ trợ đặt dịch vụ ngay lập tức."
          />
          <FeatureCard
            icon={<BarChart3 className="size-6 text-orange-600" />}
            title="Báo cáo & Thống kê"
            desc="Thống kê trực quan về doanh thu đặt sân, doanh thu F&B, tần suất sử dụng xe rental và đối soát hoa hồng tự động."
          />
        </div>
      </section>

      {/* SaaS Pricing Plans */}
      <section className="py-24 px-6 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Gói dịch vụ linh hoạt theo quy mô
            </h2>
            <p className="mt-4 text-slate-500 text-sm">
              Mọi tài khoản đăng ký mới đều bắt đầu bằng 30 ngày dùng thử miễn phí, không yêu cầu thẻ tín dụng.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Free Trial */}
            <PricingCard
              name="Dùng thử (Trial)"
              price="0đ"
              period="30 ngày đầu"
              features={["1 Chi nhánh hoạt động", "Cấu hình tối đa 5 xe rental", "100 tin nhắn Chatbot AI/tháng", "Báo cáo doanh thu cơ bản"]}
              ctaText="Trải nghiệm ngay"
              onClick={() => navigate(routePaths.providerRegister)}
            />

            {/* Starter Plan */}
            <PricingCard
              name="Khởi nghiệp (Starter)"
              price="199.000đ"
              period="tháng"
              features={["1 Chi nhánh hoạt động", "Cấu hình tối đa 10 xe rental", "500 tin nhắn Chatbot AI/tháng", "Báo cáo doanh thu & đối soát"]}
              ctaText="Đăng ký gói"
              onClick={() => navigate(routePaths.providerRegister)}
            />

            {/* Growth Plan */}
            <PricingCard
              name="Tăng trưởng (Growth)"
              price="499.000đ"
              period="tháng"
              badge="Phổ biến"
              features={["3 Chi nhánh hoạt động", "Cấu hình tối đa 25 xe rental", "2.000 tin nhắn Chatbot AI/tháng", "Hỗ trợ tích hợp Fanpage Facebook"]}
              ctaText="Đăng ký gói"
              highlight
              onClick={() => navigate(routePaths.providerRegister)}
            />

            {/* Pro Plan */}
            <PricingCard
              name="Chuyên nghiệp (Pro)"
              price="999.000đ"
              period="tháng"
              features={["Không giới hạn Chi nhánh", "Không giới hạn xe rental", "10.000 tin nhắn Chatbot AI/tháng", "Hỗ trợ riêng biệt 24/7 & API tích hợp"]}
              ctaText="Liên hệ hợp tác"
              onClick={() => navigate(routePaths.providerRegister)}
            />
          </div>
        </div>
      </section>

      {/* Trust & Safety Section */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <div className="bg-slate-900 text-white rounded-3xl p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-orange-600/10 blur-[80px]" />
          <div className="space-y-4 max-w-xl relative z-10">
            <div className="inline-flex items-center gap-1 text-xs text-orange-400 font-bold uppercase tracking-wider">
              <ShieldCheck className="size-4 text-orange-500" /> Hệ thống minh bạch & An toàn
            </div>
            <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              An tâm giao xe rental, vận hành không lo lắng
            </h3>
            <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
              Nhờ hệ thống Trust Score đánh giá uy tín khách hàng và hồ sơ bàn giao xe kèm hình ảnh 4 góc chi tiết trước/sau khi thuê, RCField giúp bảo vệ tài sản doanh nghiệp của bạn tối đa khỏi các hành vi phá hoại hoặc gian lận.
            </p>
          </div>
          <div className="flex flex-col gap-3 shrink-0 w-full md:w-auto relative z-10">
            <button
              onClick={() => navigate(routePaths.providerRegister)}
              className="py-3.5 px-8 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-sm transition duration-150 shadow-md shadow-orange-600/30 text-center"
            >
              Đăng ký thử ngay
            </button>
            <div className="flex justify-center items-center gap-4 text-slate-400 text-xs">
              <span className="flex items-center gap-1">
                <Flame className="size-3 text-orange-500" /> Không cần thẻ
              </span>
              <span className="flex items-center gap-1">
                <Users2 className="size-3 text-orange-500" /> Hơn 50+ Cafe tin dùng
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-white border border-slate-100 hover:border-slate-200/80 rounded-2xl p-6 transition duration-200 shadow-sm shadow-slate-100/50 hover:-translate-y-1">
      <div className="size-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center mb-5">
        {icon}
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
    </div>
  )
}

function PricingCard({
  name,
  price,
  period,
  features,
  ctaText,
  badge,
  highlight = false,
  onClick,
}: {
  name: string
  price: string
  period: string
  features: string[]
  ctaText: string
  badge?: string
  highlight?: boolean
  onClick: () => void
}) {
  return (
    <div className={`relative bg-white rounded-3xl p-8 border flex flex-col justify-between transition duration-200 ${
      highlight 
        ? "border-orange-600/80 shadow-xl shadow-orange-600/5 scale-105 z-10" 
        : "border-slate-100 hover:border-slate-200 shadow-sm"
    }`}>
      {badge && (
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-orange-600 text-white text-[10px] font-extrabold uppercase tracking-widest shadow-sm">
          {badge}
        </span>
      )}
      
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4">{name}</h3>
        <div className="flex items-baseline mb-6">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{price}</span>
          <span className="text-slate-400 text-xs font-semibold ml-1">/{period}</span>
        </div>

        <div className="w-full h-[1px] bg-slate-100 mb-6" />

        <ul className="space-y-3.5 mb-8">
          {features.map((feat) => (
            <li key={feat} className="flex items-start gap-2.5 text-xs text-slate-600 leading-normal">
              <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
              {feat}
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={onClick}
        className={`w-full py-3 rounded-xl text-xs font-bold transition duration-150 cursor-pointer ${
          highlight
            ? "bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-600/10 active:translate-y-[1px]"
            : "border border-slate-200 hover:bg-slate-50 text-slate-700"
        }`}
      >
        {ctaText}
      </button>
    </div>
  )
}
export default PartnerLandingPage
