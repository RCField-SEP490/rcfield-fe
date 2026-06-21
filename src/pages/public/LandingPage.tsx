import { ChatWidget } from "@/features/chat/components/ChatWidget"
import { FeatureHighlights } from "./components/FeatureHighlights"
import { HowItWorks } from "./components/HowItWorks"
import { LandingCta } from "./components/LandingCta"
import { LandingHero } from "./components/LandingHero"
import { LandingTestimonials } from "./components/LandingTestimonials"

export function LandingPage() {
  return (
    <>
      <LandingHero />
      <FeatureHighlights />
      <HowItWorks />
      <LandingTestimonials />
      <LandingCta />
      <ChatWidget />
    </>
  )
}
