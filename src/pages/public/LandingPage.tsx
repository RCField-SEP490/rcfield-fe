import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { motion, AnimatePresence } from "framer-motion"
import { 
  MapPin, 
  CalendarCheck, 
  Camera, 
  Clock, 
  Receipt, 
  UserCheck, 
  Sliders, 
  Calendar, 
  TrendingUp, 
  Check, 
  ChevronDown, 
  ArrowRight, 
  Zap, 
  Gauge, 
  Car, 
  ShieldCheck, 
  AlertTriangle,
  Monitor,
  Sparkles
} from "lucide-react"

import { 
  playerFeatures, 
  providerFeatures, 
  pricingPlans, 
  faqsData, 
  liveSessionsData, 
  recentInspectionsData 
} from "@/shared/data/landing-data"

import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"

export function LandingPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<"player" | "provider">("player")
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(prev => prev === index ? null : index)
  }

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  }


  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-orange-500 selection:text-white overflow-x-hidden">
      
      {/* BACKGROUND GLOW */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[10%] w-[350px] h-[350px] rounded-full bg-orange-400/20 blur-[100px]" />
        <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] rounded-full bg-red-400/10 blur-[120px]" />
      </div>

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/60 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-slate-950 via-orange-600 to-red-600 bg-clip-text text-transparent">
              RCField
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-orange-600 transition-colors">Tính năng</a>
            <a href="#solutions" className="hover:text-orange-600 transition-colors">Giải pháp</a>
            <a href="#inspection" className="hover:text-orange-600 transition-colors">Kiểm xe Serious</a>
            <a href="#pricing" className="hover:text-orange-600 transition-colors">Bảng giá</a>
            <a href="#faq" className="hover:text-orange-600 transition-colors">Hỏi đáp</a>
          </nav>

          <div className="flex items-center gap-4">
            <Button variant="ghost" className="font-semibold text-slate-700 hover:text-orange-600" onClick={() => navigate("/auth/login")}>
              Đăng nhập
            </Button>
            <Button className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold shadow-md shadow-orange-500/20" onClick={() => navigate("/auth/login")}>
              Trải nghiệm ngay
            </Button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-12 md:pt-20 pb-16 md:pb-24 z-10">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* HERO TEXT */}
            <motion.div 
              className="lg:col-span-6 space-y-6 text-center lg:text-left"
              initial="hidden"
              animate="visible"
              variants={fadeIn}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold border border-orange-200">
                <Sparkles className="h-3.5 w-3.5" />
                Nền tảng vận hành & đặt lịch RC Cafe thế hệ mới
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Đốt cháy đam mê <br />
                <span className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 bg-clip-text text-transparent">
                  Đường đua RC chuyên nghiệp
                </span>
              </h1>
              <p className="text-base md:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                RCField giúp người chơi dễ dàng tìm sân chơi, đặt lịch và quản lý phiên chạy minh bạch. Đồng thời cung cấp giải pháp vận hành tối ưu cho các chủ quán RC Cafe bằng công nghệ kiểm xe Serious Inspection và quản lý doanh thu Ledger thời gian thực.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-slate-950 hover:bg-slate-900 text-white font-bold h-12 px-8 rounded-xl shadow-lg flex items-center justify-center gap-2 group"
                  onClick={() => navigate("/auth/login")}
                >
                  Khám phá Sân đua 
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full sm:w-auto border-slate-300 hover:border-slate-400 text-slate-700 font-semibold h-12 px-8 rounded-xl"
                  onClick={() => {
                    const el = document.getElementById("solutions")
                    el?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  Giải pháp Chủ Quán
                </Button>
              </div>

              {/* STATS PREVIEW */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-200/80 max-w-md mx-auto lg:mx-0 text-center lg:text-left">
                <div>
                  <h4 className="text-2xl md:text-3xl font-extrabold text-slate-950">50+</h4>
                  <p className="text-xs font-semibold text-slate-500">Đối tác RC Cafe</p>
                </div>
                <div>
                  <h4 className="text-2xl md:text-3xl font-extrabold text-slate-950">12k+</h4>
                  <p className="text-xs font-semibold text-slate-500">Phiên đua hoàn tất</p>
                </div>
                <div>
                  <h4 className="text-2xl md:text-3xl font-extrabold text-slate-950">99.8%</h4>
                  <p className="text-xs font-semibold text-slate-500">Hài lòng từ đối tác</p>
                </div>
              </div>
            </motion.div>

            {/* HERO HERO OPERATIONS DASHBOARD INTERACTIVE MOCKUP */}
            <motion.div 
              className="lg:col-span-6 relative"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="relative rounded-2xl border border-slate-200/80 bg-white shadow-2xl p-4 md:p-6 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500" />
                
                {/* Dashboard Header Bar */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <Gauge className="h-4 w-4 text-orange-500" />
                      Live Operations Dashboard
                    </span>
                  </div>
                  <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-bold">
                    Cafe: Drift Town Sài Gòn
                  </Badge>
                </div>

                {/* Dashboard grid widgets */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  
                  {/* WIDGET 1: Active sessions */}
                  <div className="space-y-3 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Clock className="h-3 w-3 text-orange-500" />
                        Phiên chạy trực tiếp
                      </span>
                      <Badge className="bg-orange-500/10 text-orange-700 border-none font-bold text-[10px]">
                        Live timer
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      {liveSessionsData.map((session, idx) => (
                        <div key={idx} className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-slate-800">{session.track}</p>
                            <p className="text-[10px] text-slate-500">{session.user} • {session.details}</p>
                          </div>
                          <div className="text-right">
                            <span className={`font-mono font-bold ${session.status === 'warning' ? 'text-red-500' : 'text-slate-700'}`}>
                              {session.timeRemaining}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* WIDGET 2: Recent Inspections & Revenue */}
                  <div className="space-y-4 flex flex-col justify-between">
                    
                    {/* Sub-widget 2a: Recent Inspection */}
                    <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Camera className="h-3 w-3 text-indigo-500" />
                        Kiểm xe gần đây (Serious)
                      </span>
                      {recentInspectionsData.slice(0, 1).map((inspect, idx) => (
                        <div key={idx} className="p-2.5 bg-white rounded-lg border border-slate-100 shadow-sm text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">{inspect.vehicleCode}</span>
                            <Badge className="bg-emerald-100 text-emerald-800 text-[9px] hover:bg-emerald-100 border-none font-bold">
                              {inspect.status}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                            <span>{inspect.type}</span>
                            <span>{inspect.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Sub-widget 2b: Today's Revenue */}
                    <div className="p-4 rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-slate-50 space-y-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5 text-indigo-600" />
                        Doanh thu hôm nay
                      </span>
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-extrabold text-indigo-950">4,850,000đ</span>
                        <span className="text-[10px] text-emerald-600 font-bold">+18.5% hôm qua</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full" style={{ width: '70%' }} />
                      </div>
                    </div>
                  </div>

                </div>

                {/* Dashboard quick info ribbon */}
                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-[10px] font-semibold text-slate-500">
                  <div className="border-r border-slate-100">
                    <span className="block text-slate-800 font-extrabold">12 / 15 Xe</span>
                    Sẵn sàng chạy
                  </div>
                  <div className="border-r border-slate-100">
                    <span className="block text-slate-800 font-extrabold">4 Nhân viên</span>
                    Đang trực ca
                  </div>
                  <div>
                    <span className="block text-slate-800 font-extrabold">95% Slot đặt</span>
                    Tỷ lệ lấp đầy hôm nay
                  </div>
                </div>
              </div>

              {/* Decorative floating widgets badge */}
              <div className="absolute -bottom-4 -left-4 bg-orange-500 text-white rounded-2xl py-3 px-4 shadow-xl flex items-center gap-3 border border-orange-400">
                <Car className="h-6 w-6 animate-pulse" />
                <div>
                  <p className="text-[10px] font-bold opacity-80 uppercase">Đội xe cho thuê</p>
                  <p className="text-sm font-extrabold">Fleet Managed</p>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* CORE VALUE TABS (DÀNH CHO NGƯỜI CHƠI VS CHỦ QUÁN) */}
      <section id="features" className="py-20 bg-white relative border-t border-b border-slate-200/50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center space-y-4 max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
              Giải Pháp Toàn Diện Cho Mọi Vai Trò
            </h2>
            <p className="text-slate-500 font-medium">
              Từ người đam mê đua xe tìm sân chơi cho tới chủ cơ sở kinh doanh, RCField đều hỗ trợ quy trình vận hành trực quan và khép kín.
            </p>

            {/* TAB SELECTOR BUTTONS */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80">
              <button 
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'player' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                onClick={() => setActiveTab('player')}
              >
                <Car className="h-4 w-4" />
                Dành cho Người Chơi
              </button>
              <button 
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'provider' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                onClick={() => setActiveTab('provider')}
              >
                <Monitor className="h-4 w-4" />
                Dành cho Chủ Quán (Provider)
              </button>
            </div>
          </div>

          {/* TAB CONTENTS */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
            >
              {activeTab === 'player' ? (
                playerFeatures.map((feat) => (
                  <Card key={feat.id} className="border-slate-200/60 hover:shadow-lg hover:border-orange-200 transition-all group overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-slate-200 group-hover:bg-orange-500 transition-colors" />
                    <CardHeader className="space-y-2">
                      <div className="h-10 w-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                        {feat.id === "find-cafe" && <MapPin className="h-5 w-5" />}
                        {feat.id === "booking-pay" && <CalendarCheck className="h-5 w-5" />}
                        {feat.id === "checkin-4" && <Camera className="h-5 w-5" />}
                        {feat.id === "active-session" && <Clock className="h-5 w-5" />}
                        {feat.id === "checkout-rate" && <Receipt className="h-5 w-5" />}
                      </div>
                      <CardTitle className="text-lg font-bold group-hover:text-orange-600 transition-colors">{feat.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600 leading-relaxed font-medium">{feat.description}</p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                providerFeatures.map((feat) => (
                  <Card key={feat.id} className="border-slate-200/60 hover:shadow-lg hover:border-orange-200 transition-all group overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-slate-200 group-hover:bg-orange-500 transition-colors" />
                    <CardHeader className="space-y-2">
                      <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                        {feat.id === "partner-approve" && <UserCheck className="h-5 w-5" />}
                        {feat.id === "track-config" && <Sliders className="h-5 w-5" />}
                        {feat.id === "booking-manage" && <Calendar className="h-5 w-5" />}
                        {feat.id === "revenue-split" && <TrendingUp className="h-5 w-5" />}
                      </div>
                      <CardTitle className="text-lg font-bold group-hover:text-indigo-600 transition-colors">{feat.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600 leading-relaxed font-medium">{feat.description}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* CORE MENTAL MODEL: BOOKING vs SESSION TIMELINE */}
      <section id="solutions" className="py-20 bg-slate-50 relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center space-y-4 max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
              Quy Trình Hoạt Động Khép Kín
            </h2>
            <p className="text-slate-500 font-medium leading-relaxed">
              RCField phân định rõ ràng giữa kế hoạch đặt sân trước (**Booking**) và thời gian vận hành chơi thực tế tại quán (**Session**) để tối ưu hóa quản lý.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto items-stretch">
            
            {/* BOOKING TRACK (PLANNING) */}
            <motion.div 
              className="p-8 rounded-2xl border border-slate-200/80 bg-white relative flex flex-col justify-between"
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-4">
                <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 border-none font-bold px-3 py-1 text-xs">
                  Giai đoạn 1: Đặt Lịch (Booking)
                </Badge>
                <h3 className="text-2xl font-extrabold text-slate-950">
                  Lên Kế Hoạch & Giữ Chỗ
                </h3>
                <p className="text-sm font-medium text-slate-600 leading-relaxed">
                  Quá trình chuẩn bị và đặt cọc tài nguyên trước khi đến quán chơi. Người dùng chọn khung giờ chơi, chọn loại xe đua muốn thuê hoặc đăng ký mang xe riêng (BYOC), thực hiện cọc tiền để khoá lịch.
                </p>

                {/* Timeline flow */}
                <div className="space-y-3 pt-4 text-xs font-semibold text-slate-700">
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold">1</span>
                    Chọn Cafe & Khung giờ (Slot Booking)
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold">2</span>
                    Đăng ký Xe (Thuê hoặc Xe riêng)
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold">3</span>
                    Quét VietQR cọc giữ chỗ (Ledger pending)
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 text-xs font-bold text-slate-400 flex items-center justify-between">
                <span>TRẠNG THÁI BOOKING:</span>
                <span className="text-slate-700">PENDING → CONFIRMED / CANCELLED</span>
              </div>
            </motion.div>

            {/* SESSION TRACK (OPERATIONAL) */}
            <motion.div 
              className="p-8 rounded-2xl border border-indigo-200 bg-white relative flex flex-col justify-between"
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-4">
                <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100 border-none font-bold px-3 py-1 text-xs">
                  Giai đoạn 2: Phiên Chạy (Session)
                </Badge>
                <h3 className="text-2xl font-extrabold text-indigo-950">
                  Vận Hành Thực Tế Tại Quán
                </h3>
                <p className="text-sm font-medium text-slate-600 leading-relaxed">
                  Diễn ra khi khách hàng có mặt ở quán. Quản lý trực tiếp giờ xuất phát thực tế, ghi nhận xe chạy, các đợt gia hạn phát sinh giữa phiên (Extension), ghi nhận hư hỏng (Damage) và kết toán thanh toán hóa đơn.
                </p>

                {/* Timeline flow */}
                <div className="space-y-3 pt-4 text-xs font-semibold text-slate-700">
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">1</span>
                    Nhân viên làm thủ tục Check-in
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">2</span>
                    Ghi nhận Serious Inspection (4 góc)
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">3</span>
                    Khởi động Live Timer & Chạy sân (Active)
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 text-xs font-bold text-slate-400 flex items-center justify-between">
                <span>TRẠNG THÁI SESSION:</span>
                <span className="text-indigo-600">CHECKED_IN → ACTIVE → EXTENDING → CHECKING_OUT → COMPLETED</span>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* SERIOUS INSPECTION DETAILED SHOWCASE */}
      <section id="inspection" className="py-20 bg-white relative">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center max-w-6xl mx-auto">
            
            {/* INSPECTION GRAPHICS (CHECK-IN VS CHECK-OUT COMPARISON MOCKUP) */}
            <div className="lg:col-span-6 space-y-6">
              <div className="p-5 rounded-2xl border border-red-200 bg-slate-50 relative overflow-hidden shadow-md">
                <div className="absolute top-0 right-0 p-3">
                  <Badge className="bg-red-500 text-white font-bold border-none text-[10px]">
                    Serious Inspection System
                  </Badge>
                </div>
                
                <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2 mb-4">
                  <Camera className="h-4.5 w-4.5 text-red-500" />
                  Đối chiếu ảnh kiểm xe 4 góc trước và sau phiên chạy
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  
                  {/* Photo Before */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Ảnh Check-in (Đầu vào)</span>
                    <div className="aspect-[4/3] rounded-lg border border-slate-200 bg-slate-200/50 flex items-center justify-center overflow-hidden relative group">
                      <img 
                        src="https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&q=80&w=400" 
                        alt="Drift car front" 
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-[8px] font-bold text-white uppercase tracking-widest">GÓC TRƯỚC - OK</div>
                    </div>
                  </div>

                  {/* Photo After with damage indicator */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-extrabold text-red-500 uppercase tracking-wider block">Ảnh Check-out (Đầu ra)</span>
                    <div className="aspect-[4/3] rounded-lg border border-red-200 bg-red-50 flex items-center justify-center overflow-hidden relative">
                      <img 
                        src="https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&q=80&w=400" 
                        alt="Drift car front damage" 
                        className="object-cover w-full h-full filter saturate-50"
                      />
                      {/* Interactive pulsing red dot highlighting "damage" */}
                      <span className="absolute top-[60%] left-[45%] flex h-5 w-5 -translate-x-1/2 -translate-y-1/2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-5 w-5 bg-red-600 border-2 border-white items-center justify-center text-[8px] font-bold text-white">!</span>
                      </span>
                      <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-red-600 text-[8px] font-bold text-white uppercase tracking-widest">NỨT CẢN TRƯỚC</div>
                    </div>
                  </div>

                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 text-xs font-semibold text-slate-600 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-red-600">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Khấu trừ: 150,000đ (Bảng giá cản trước RX-7)
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">Bởi Staff: Hùng Nguyễn</span>
                </div>
              </div>
            </div>

            {/* INSPECTION TEXT INFO */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold border border-red-100">
                <ShieldCheck className="h-3.5 w-3.5 text-red-600" />
                Evidence-First System
              </div>
              <h3 className="text-3xl font-extrabold text-slate-900 leading-tight">
                Quy Trình Serious Inspection Minh Bạch 100%
              </h3>
              <p className="text-sm md:text-base font-medium text-slate-600 leading-relaxed">
                Nói lời tạm biệt với những tranh cãi hư hỏng xe thuê không đáng có. Quy trình bắt buộc chụp ảnh 4 góc xe (TRƯỚC, SAU, TRÁI, PHẢI) tại thời điểm nhận sân và trả sân đảm bảo lợi ích tối ưu cho cả khách hàng lẫn chủ quán.
              </p>

              <div className="space-y-4 font-semibold text-sm text-slate-700">
                <div className="flex items-start gap-2.5">
                  <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>Tránh mọi tranh cãi về lỗi hỏng hóc phát sinh nhờ ảnh lưu trữ sắc nét.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>Ghi nhận lịch sử bảo dưỡng và mức độ hao mòn xe tự động qua Ledger.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>Nâng cao uy tín dịch vụ thuê xe của quán đối với cộng đồng.</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-20 bg-slate-50 border-t border-b border-slate-200/50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center space-y-4 max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
              Bảng Giá Dịch Vụ Mềm Dẻo
            </h2>
            <p className="text-slate-500 font-medium">
              Chọn lựa phương án đăng ký dịch vụ phù hợp với quy mô cơ sở RC Cafe của bạn.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            {pricingPlans.map((plan, idx) => (
              <Card 
                key={idx} 
                className={`relative flex flex-col justify-between border-slate-200/60 overflow-hidden ${plan.isPopular ? 'border-orange-500 shadow-xl ring-1 ring-orange-400' : 'bg-white shadow-sm'}`}
              >
                {plan.isPopular && (
                  <div className="absolute top-0 right-0 bg-orange-500 text-white font-extrabold uppercase text-[9px] px-3 py-1 rounded-bl-lg tracking-wider">
                    ĐƯỢC CHỌN NHIỀU
                  </div>
                )}
                
                <CardHeader className="space-y-2">
                  <CardTitle className="text-xl font-black text-slate-950">{plan.name}</CardTitle>
                  <CardDescription className="text-xs font-semibold text-slate-500 min-h-[32px]">{plan.description}</CardDescription>
                  <div className="pt-2 flex items-baseline gap-1">
                    <span className="text-3xl md:text-4xl font-extrabold text-slate-950">{plan.price}</span>
                    {plan.period && <span className="text-xs font-bold text-slate-500">/ {plan.period}</span>}
                  </div>
                </CardHeader>
                
                <CardContent className="flex-grow pt-4">
                  <div className="space-y-3">
                    {plan.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2 text-xs font-semibold text-slate-700">
                        <Check className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>

                <CardFooter className="pt-6">
                  <Button 
                    className={`w-full font-bold py-2.5 rounded-xl h-11 transition-all ${plan.isPopular ? 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}
                    onClick={() => navigate("/auth/login")}
                  >
                    {plan.cta}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-20 bg-white relative">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center space-y-4 max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
              Giải Đáp Thắc Mắc Thường Gặp
            </h2>
            <p className="text-slate-500 font-medium">
              Tìm câu trả lời cho các câu hỏi kỹ thuật và quy trình vận hành hệ thống của chúng tôi.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqsData.map((faq, idx) => (
              <div 
                key={idx} 
                className="border border-slate-200/80 rounded-xl overflow-hidden bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <button 
                  className="w-full px-6 py-4 flex items-center justify-between text-left font-bold text-slate-900 focus:outline-none"
                  onClick={() => toggleFaq(idx)}
                >
                  <span className="pr-4">{faq.question}</span>
                  <ChevronDown className={`h-4.5 w-4.5 text-slate-500 transition-transform flex-shrink-0 ${openFaqIndex === idx ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence initial={false}>
                  {openFaqIndex === idx && (
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 pt-1 text-sm text-slate-600 font-medium leading-relaxed border-t border-slate-200/40 bg-white">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOTTOM CALL TO ACTION CTA */}
      <section className="relative py-20 bg-slate-900 text-white overflow-hidden">
        {/* Background glow in dark CTA */}
        <div className="absolute top-[-50%] left-[-20%] w-[500px] h-[500px] rounded-full bg-orange-600/10 blur-[130px] pointer-events-none" />
        <div className="absolute bottom-[-50%] right-[-20%] w-[500px] h-[500px] rounded-full bg-red-600/10 blur-[130px] pointer-events-none" />

        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center space-y-6 max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            Sẵn Sàng Số Hóa <br />
            Sân Chơi RC Cafe Của Bạn?
          </h2>
          <p className="text-slate-400 font-medium max-w-xl mx-auto leading-relaxed">
            Tham gia vào cộng đồng RC Cafe lớn nhất Việt Nam. Quản lý booking thông minh, bảo vệ phương tiện thuê tối đa và tối ưu hóa doanh thu cơ sở của bạn ngay từ hôm nay.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button 
              size="lg" 
              className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-orange-500/15"
              onClick={() => navigate("/auth/login")}
            >
              Trải nghiệm Miễn phí
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="w-full sm:w-auto border-slate-700 hover:border-slate-600 hover:bg-slate-800 text-white font-semibold h-12 px-8 rounded-xl"
              onClick={() => navigate("/auth/login")}
            >
              Xem Demo Sân Đua
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-slate-50/50 py-12 text-xs font-semibold text-slate-500">
        <div className="container mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold">
                <Zap className="h-4.5 w-4.5" />
              </div>
              <span className="text-base font-extrabold tracking-tight text-slate-900">RCField</span>
            </div>
            <p className="text-[11px] font-medium leading-relaxed text-slate-500">
              Nền tảng đặt lịch và vận hành Cafe / Sân chơi RC số 1 Việt Nam, mang lại giải pháp vận hành minh bạch và chuyên nghiệp.
            </p>
            <p className="text-[10px] font-bold text-slate-400">© 2024 RCField. All rights reserved.</p>
          </div>

          <div className="space-y-3">
            <h5 className="font-extrabold text-slate-900 tracking-wider">SẢN PHẨM</h5>
            <ul className="space-y-2">
              <li><a href="#features" className="hover:text-orange-600 transition-colors">Tính năng chi tiết</a></li>
              <li><a href="#solutions" className="hover:text-orange-600 transition-colors">Giải pháp cho quán</a></li>
              <li><a href="#inspection" className="hover:text-orange-600 transition-colors">Serious Inspection</a></li>
              <li><a href="#pricing" className="hover:text-orange-600 transition-colors">Bảng giá dịch vụ</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="font-extrabold text-slate-900 tracking-wider">CÔNG TY</h5>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-orange-600 transition-colors">Về chúng tôi</a></li>
              <li><a href="#" className="hover:text-orange-600 transition-colors">Tuyển dụng</a></li>
              <li><a href="#" className="hover:text-orange-600 transition-colors">Đối tác liên kết</a></li>
              <li><a href="#" className="hover:text-orange-600 transition-colors">Hỗ trợ đối tác</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="font-extrabold text-slate-900 tracking-wider">CHÍNH SÁCH</h5>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-orange-600 transition-colors">Chính sách bảo mật</a></li>
              <li><a href="#" className="hover:text-orange-600 transition-colors">Chính sách đặt & hủy sân</a></li>
              <li><a href="#" className="hover:text-orange-600 transition-colors">Điều khoản dịch vụ</a></li>
              <li><a href="#" className="hover:text-orange-600 transition-colors">Quy trình giải quyết tranh chấp</a></li>
            </ul>
          </div>
        </div>
      </footer>

    </div>
  )
}
