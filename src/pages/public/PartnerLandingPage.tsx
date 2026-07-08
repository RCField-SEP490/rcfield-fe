import { PartnerHero } from "./components/partner/PartnerHero"
import { PartnerPainPoints } from "./components/partner/PartnerPainPoints"
import { PartnerHowItWorks } from "./components/partner/PartnerHowItWorks"
import { PartnerFeatures } from "./components/partner/PartnerFeatures"
import { PartnerTestimonials } from "./components/partner/PartnerTestimonials"
import { PartnerPricing } from "./components/partner/PartnerPricing"
import { PartnerFinalCta } from "./components/partner/PartnerFinalCta"

export function PartnerLandingPage() {
  return (
    <div className="partner-page">
      <PartnerHero />
      <PartnerPainPoints />
      <PartnerHowItWorks />
      <PartnerFeatures />
      <PartnerTestimonials />
      <PartnerPricing />
      <PartnerFinalCta />
    </div>
  )
}
