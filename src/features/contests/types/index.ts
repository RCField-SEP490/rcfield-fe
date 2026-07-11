export type ContestStatus =
  | "DRAFT"
  | "OPEN"
  | "CLOSED"
  | "RUNNING"
  | "COMPLETED"
  | "CANCELLED"

export type ContestVehiclePolicy = "RENTAL_ONLY" | "BYOC_ONLY" | "MIXED"
export type ContestFormatCode = "TIME_TRIAL" | "KNOCKOUT" | string
export type ContestTypeCode = "PROVIDER_STANDARD" | string
export type ContestEntryFeePaymentStatus =
  | "NOT_REQUIRED"
  | "PENDING_PAYMENT"
  | "PENDING_REVIEW"
  | "WAIVED"
  | "MARKED_PAID"

export type ContestCatalogType = {
  id: string
  code: string
  name: string
  description: string | null
  isActive?: boolean
  sortOrder?: number
  metadata?: Record<string, unknown>
}

export type ContestCatalogFormat = {
  id: string
  code: string
  name: string
  description: string | null
  supportsBracket?: boolean
  supportsTimeAttack?: boolean
  supportsMultiRound?: boolean
  isActive?: boolean
  sortOrder?: number
  metadata?: Record<string, unknown>
}

export type ContestTemplate = {
  id: string
  contestTypeId?: string
  contestFormatId?: string
  code: string
  name: string
  description: string | null
  defaultConfig: Record<string, unknown>
  vehiclePolicyOptions: string[]
  featureFlags: Record<string, unknown>
  isActive?: boolean
  sortOrder?: number
}

export type ContestBranch = {
  id: string
  cafe_id: string
  role: string
  capacity_override: number | null
  check_in_enabled: boolean
  display_order: number
  cafe: {
    id: string
    name: string
    district: string
    city: string
    status: string
  } | null
}

export type ContestItem = {
  id: string
  provider_id: string | null
  name: string
  description: string | null
  status: ContestStatus
  starts_at: string
  ends_at: string
  registration_opens_at: string | null
  registration_closes_at: string | null
  capacity: number | null
  entry_fee: number
  banner_image_url: string | null
  vehicle_rule: Record<string, unknown>
  config: Record<string, unknown>
  created_by: string
  created_at: string
  updated_at: string
  host_branch: ContestBranch | null
  participating_branches: ContestBranch[]
  track_type: {
    id: string
    code: string
    name: string
    description: string | null
  } | null
  contest_type: {
    id: string
    code: string
    name: string
    description: string | null
  } | null
  contest_format: {
    id: string
    code: string
    name: string
    description: string | null
    supports_bracket: boolean
    supports_time_attack: boolean
    supports_multi_round: boolean
  } | null
  contest_template: {
    id: string
    code: string
    name: string
    description: string | null
    default_config: Record<string, unknown>
    vehicle_policy_options: string[]
    feature_flags: Record<string, unknown>
  } | null
}

export type ContestListResponse = {
  success: boolean
  data: ContestItem[]
  meta?: {
    total: number
    page: number
    limit: number
  }
}

export type ContestVehicleRuleInput = {
  vehicle_policy: ContestVehiclePolicy
  assignment_policy?: "AT_CHECK_IN" | "PRE_ASSIGNED"
}

export type ContestUpsertBody = {
  name: string
  description?: string | null
  contest_type_id: string
  contest_format_id: string
  contest_template_id: string
  track_type_id: string
  participating_cafe_ids: string[]
  starts_at: string
  ends_at: string
  registration_opens_at: string
  registration_closes_at: string
  capacity: number
  entry_fee: number
  banner_image_url?: string | null
  vehicle_rule: ContestVehicleRuleInput
  config: Record<string, unknown>
}

export type ContestRegistration = {
  id: string
  contestId: string
  userId: string
  participantRoleSnapshot: string
  vehicleSource: string
  vehicleId: string | null
  bookingId: string | null
  status: string
  checkInCode: string | null
  paymentStatus: ContestEntryFeePaymentStatus
  entryFeeAmount: number | null
  checkedInCafeId: string | null
  checkedInAt: string | null
  cancellationReason: string | null
  createdAt: string
  updatedAt: string
}
