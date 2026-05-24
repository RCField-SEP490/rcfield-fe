import { ChatWidget } from "@/features/chat/components/ChatWidget"
import { FeatureHighlights } from "./components/FeatureHighlights"
import { HowItWorks } from "./components/HowItWorks"
import { LandingCta } from "./components/LandingCta"
import { LandingHero } from "./components/LandingHero"

export function LandingPage() {
  return (
    <>
      <LandingHero />
      <FeatureHighlights />
      <HowItWorks />
      <LandingCta />
      <ChatWidget />
    </>
  )
}
