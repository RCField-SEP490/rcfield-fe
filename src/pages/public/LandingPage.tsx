import { ChatWidget } from "@/features/chat/components/ChatWidget"
import { FeatureHighlights } from "./components/FeatureHighlights"
import { HowItWorks } from "./components/HowItWorks"
import { LandingCta } from "./components/LandingCta"
import { LandingHero } from "./components/LandingHero"
import { LandingTestimonials } from "./components/LandingTestimonials"
import { FeaturedCafes } from "./components/FeaturedCafes"
import { ActivePromotions } from "./components/ActivePromotions"
import { UpcomingContests } from "./components/UpcomingContests"
import { GlobalLeaderboardPreview } from "./components/GlobalLeaderboardPreview"

export function LandingPage() {
  return (
    <>
      <LandingHero />
      <FeatureHighlights />
      <FeaturedCafes />
      <ActivePromotions />
      <UpcomingContests />
      <GlobalLeaderboardPreview />
      <HowItWorks />
      <LandingTestimonials />
      <LandingCta />
      <ChatWidget />
    </>
  )
}
