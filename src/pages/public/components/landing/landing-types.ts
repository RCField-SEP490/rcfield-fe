import type { Cafe } from "@/shared/data/explore-data"

export type HowItWorksStep = {
  number: string
  eyebrow: string
  title: string
  description: string
}

export type HeroVenueCardViewModel = {
  id: string
  name: string
  cityLabel: string
  image: string | null
  hasRealImage: boolean
  ratingLabel: string | null
  availabilityLabel: string
  bookingHref: string
  detailHref: string
}

export type FeaturedVenueViewModel = HeroVenueCardViewModel & {
  districtLabel: string
  trackLabel: string
}

export type LandingCafeRecord = Cafe
