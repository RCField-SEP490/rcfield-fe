import { motion, useReducedMotion } from "framer-motion"
import { HowItWorksCard } from "./HowItWorksCard"
import { SectionIntro } from "./SectionIntro"
import { landingViewport, staggerContainer } from "./landing-motion"
import type { HowItWorksStep } from "./landing-types"

const howItWorksSteps: HowItWorksStep[] = [
  {
    number: "01",
    eyebrow: "Khám phá",
    title: "Tìm sân phù hợp",
    description: "Chọn địa điểm, ngày chơi và loại track để lọc đúng cơ sở bạn cần.",
  },
  {
    number: "02",
    eyebrow: "Đặt lịch",
    title: "Chọn giờ & đặt xe",
    description: "Giữ chỗ theo khung giờ trống, kèm xe thuê nếu cần ngay trong một luồng.",
  },
  {
    number: "03",
    eyebrow: "Xác nhận",
    title: "Thanh toán & nhận lịch",
    description: "Xác nhận lịch nhanh, xem rõ thông tin giữ chỗ và chuẩn bị check-in.",
  },
  {
    number: "04",
    eyebrow: "Check-in",
    title: "Nhận xe & vào sân",
    description: "Đến quán, kiểm tra xe cùng nhân viên rồi bắt đầu phiên chơi đúng giờ.",
  },
]

export function HowItWorksSection() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <section className="bg-[#2f3335] py-22 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SectionIntro
          eyebrow="Chỉ 4 bước"
          title="Từ ý định đến phiên chơi trong vài phút."
          description="Luồng đặt sân được rút gọn để bạn tìm đúng cơ sở, xem giờ trống và vào sân nhanh mà không bị rối."
          align="center"
          invert
        />

        <motion.div
          variants={staggerContainer}
          initial={prefersReducedMotion ? false : "hidden"}
          whileInView={prefersReducedMotion ? undefined : "visible"}
          viewport={landingViewport}
          className="mt-12 grid gap-5 lg:grid-cols-4"
        >
          {howItWorksSteps.map((step) => (
            <HowItWorksCard key={step.number} step={step} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
