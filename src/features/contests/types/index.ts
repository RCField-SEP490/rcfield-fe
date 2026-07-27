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
export type ContestRegistrationStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "CHECKED_IN"
export type ContestMatchStatus = "DRAFT" | "READY" | "RUNNING" | "COMPLETED" | "CANCELLED"
export type ContestMatchType = "HEAD_TO_HEAD" | "MULTI_DRIVER" | "TIME_ATTACK" | "FINAL"
export type ContestParticipantStatus = "READY" | "STARTED" | "FINISHED" | "DNS" | "DNF" | "DQ"
export type ContestRuntimeTab = "overview" | "event-day" | "matches" | "leaderboard" | "audit"
export type CustomerJourneyStatus =
  | "PENDING_APPROVAL"
  | "APPROVED_WAITING_CHECKIN"
  | "CHECKED_IN_WAITING_BRACKET"
  | "IN_BRACKET"
  | "ADVANCED"
  | "ELIMINATED"
  | "FINISHED"
  | "CANCELLED"

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

export type ContestResourceLock = {
  cafe_id: string
  scope: "FULL_BRANCH" | "SELECTED_TRACKS"
  track_config_ids: string[]
  starts_at?: string | null
  ends_at?: string | null
}

export type ContestStaffAssignment = {
  id: string
  contest_id: string
  staff_id: string
  assigned_at: string | null
  assigned_by: string | null
  staff: {
    id: string
    full_name: string | null
    email: string | null
    avatar_url: string | null
  } | null
}

export type ContestPublicStats = {
  registration_count: number
  confirmed_count: number
  checked_in_count: number
  capacity_remaining: number | null
}

export type ContestHighlightRoundWinner = {
  registration_id: string
  participant_name: string | null
  participant_email: string | null
  driver_handle: string | null
  source_match_id: string
  source_match_name: string | null
}

export type ContestHighlightRound = {
  round_no: number
  label: string
  match_count: number
  completed_match_count: number
  winners: ContestHighlightRoundWinner[]
}

export type ContestRuntimeSummary = {
  total_matches: number
  total_rounds: number
  current_round_no: number | null
  has_live_matches: boolean
  live_match_id: string | null
  completed_matches: number
  highlight_rounds: ContestHighlightRound[]
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
  resource_locks?: ContestResourceLock[]
  prize_structure?: Record<string, unknown> | null
  public_stats?: ContestPublicStats | null
  staff_assignments?: ContestStaffAssignment[]
  operator_access?: boolean
  my_registration?: ContestRegistration | null
  published_leaderboard?: ContestLeaderboardPayload | null
  runtime_summary?: ContestRuntimeSummary | null
  highlight_rounds?: ContestHighlightRound[]
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

export type PaginatedResponse<T> = {
  success: boolean
  data: T[]
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

export type ContestRegistrationParticipant = {
  id: string
  fullName: string | null
  email: string | null
  avatarUrl: string | null
  driverHandle?: string | null
  driverTitleLabel?: string | null
}

export type ContestRegistrationLatestMatch = {
  matchId: string
  contestId: string
  roundNo: number
  matchNo: number
  name: string | null
  status: ContestMatchStatus
  matchType: ContestMatchType
  scheduledAt: string | null
  startedAt: string | null
  endedAt: string | null
  nextMatchId: string | null
  participantStatus: ContestParticipantStatus | null
  finishPosition: number | null
  isWinner: boolean
}

export type ContestRegistration = {
  id: string
  contestId: string
  userId: string
  participantRoleSnapshot: string
  vehicleSource: string
  vehicleId: string | null
  bookingId: string | null
  status: ContestRegistrationStatus
  checkInCode: string | null
  paymentStatus: ContestEntryFeePaymentStatus
  entryFeeAmount: number | null
  checkedInCafeId: string | null
  checkedInAt: string | null
  cancellationReason: string | null
  createdAt: string
  updatedAt: string
  metadata?: Record<string, unknown>
  participant: ContestRegistrationParticipant | null
  contest?: ContestItem | null
  latestMatch: ContestRegistrationLatestMatch | null
  customerJourneyStatus: CustomerJourneyStatus | null
  booking?: ContestRegistrationBooking | null
}

export type ContestRegistrationBooking = {
  id: string
  status: string
  paymentExpiresAt: string | null
  totalAmount: number
}

export type ContestEntryPaymentResponse = {
  txn_ref: string
  amount: number
  payment_url: string
  mock_confirmation?: {
    payment_url: string
    mock_result: string
  } | null
}

export type ContestBanItem = {
  id: string
  user_id: string
  provider_id: string
  contest_id: string | null
  scope_type: "CONTEST" | "PROVIDER"
  reason: string
  evidence_url: string | null
  notes: string | null
  expires_at: string | null
  lifted_at: string | null
  created_at: string
  updated_at: string
  user?: {
    id: string
    full_name: string | null
    email: string | null
    avatar_url: string | null
  } | null
}

export type ContestMatchParticipantRegistrationSnapshot = {
  id: string
  user_id: string
  participant_name: string | null
  participant_email: string | null
  participant_avatar_url: string | null
  driver_handle?: string | null
  driver_title_label?: string | null
  status: ContestRegistrationStatus
  check_in_code: string | null
  checked_in_at: string | null
  is_my_registration: boolean
}

export type ContestMatchParticipant = {
  id: string
  registration_id: string
  slot_no: number
  lane: string | null
  grid_position: number | null
  seed_no: number | null
  status: ContestParticipantStatus
  score: number | null
  finish_position: number | null
  best_lap_seconds: number | null
  total_time_seconds: number | null
  is_winner: boolean
  result_note: string | null
  metadata: Record<string, unknown>
  registration: ContestMatchParticipantRegistrationSnapshot | null
}

export type ContestMatch = {
  id: string
  contest_id: string
  cafe_id: string
  track_config_id: string | null
  round_no: number
  match_no: number
  name: string | null
  match_type: ContestMatchType
  status: ContestMatchStatus
  scheduled_at: string | null
  started_at: string | null
  ended_at: string | null
  next_match_id: string | null
  advancement_rule: Record<string, unknown>
  result_summary: Record<string, unknown>
  metadata: Record<string, unknown>
  decided_by: string | null
  decided_at: string | null
  participants: ContestMatchParticipant[]
}

export type ContestMetrics = {
  contest_id: string
  capacity?: number | null
  entry_fee_amount?: number
  registration_counts: {
    total: number
    pending: number
    confirmed: number
    checked_in: number
    cancelled: number
  }
  match_counts: {
    total: number
    draft: number
    ready: number
    running: number
    completed: number
    cancelled: number
  }
  leaderboard: {
    published: boolean
    published_at: string | null
    entry_count: number
    mode: "BEST_LAP" | "TOTAL_TIME" | "KNOCKOUT_WINS"
  }
  global_sync: {
    synced: boolean
    synced_at: string | null
    synced_count: number
    superseded_count: number
  }
  revenue?: {
    expected_revenue: number
    paid_revenue: number
    waived_revenue: number
    pending_revenue: number
    payment_conversion_rate: number
  }
}

export type ContestLeaderboardEntry = {
  rank: number
  registration_id: string
  user_id: string | null
  display_name: string | null
  driver_handle: string | null
  driver_title_label: string | null
  wins: number
  best_lap_seconds: number | null
  total_time_seconds: number | null
  latest_finish_position: number | null
  matches_completed: number
  progressed_round: number
}

export type ContestLeaderboardPayload = {
  mode: "BEST_LAP" | "TOTAL_TIME" | "KNOCKOUT_WINS"
  entries: ContestLeaderboardEntry[]
  match_count: number
  published_at: string
  published_by: string
}

export type ContestAuditLogItem = {
  id: string
  contestId: string
  registrationId: string | null
  matchId: string | null
  actorId: string | null
  actorRole: string | null
  /** Tên người thao tác (join từ users) — null với SYSTEM. */
  actorName?: string | null
  /** Câu mô tả hành động tiếng Việt do BE build lúc đọc. */
  actionSummary?: string | null
  eventType: string
  beforeJson: Record<string, unknown> | null
  afterJson: Record<string, unknown> | null
  reason: string | null
  metadata: Record<string, unknown>
  createdAt: string
}

export type ContestGenerateMatchesBody = {
  cafe_id: string
  track_config_id?: string | null
  registration_ids: string[]
  drivers_per_match?: number
  seeding_mode?: "MANUAL" | "CHECK_IN_ORDER"
}

export type ContestListParams = {
  page?: number
  limit?: number
  scope?: "managed"
  status?: ContestStatus
  contest_type_id?: string
  contest_format_id?: string
  cafe_id?: string
  query?: string
}

export type MyContestRegistrationsQuery = {
  query?: string
  contest_status?: ContestStatus
  customer_journey_status?: CustomerJourneyStatus
}

export type ContestRegistrationsQuery = {
  query?: string
  status?: ContestRegistrationStatus
  payment_status?: ContestEntryFeePaymentStatus
}

export type ContestMatchesQuery = {
  round_no?: number
  status?: ContestMatchStatus
  cafe_id?: string
  participant_query?: string
}



export type ContestAuditLogsQuery = {
  page?: number
  limit?: number
}

export type ContestUpdateMatchParticipantsBody = {
  participants: Array<{
    registration_id: string
    slot_no: number
    lane?: string | null
    grid_position?: number | null
    seed_no?: number | null
  }>
}

export type ContestMatchResultInput = {
  registration_id: string
  finish_position?: number | null
  score?: number | null
  best_lap_seconds?: number | null
  total_time_seconds?: number | null
  is_winner?: boolean
  result_note?: string | null
  status?: ContestParticipantStatus
}

export type ContestSubmitResultsBody = {
  results: ContestMatchResultInput[]
  reason: string
}

export type ContestCorrectResultsBody = ContestSubmitResultsBody & {
  force_cascade?: boolean
}

export type ContestRaceRecordSyncResult = {
  contest_id: string
  synced_count: number
  superseded_count: number
  synced_at: string | null
  achievement_evaluation: {
    affected_users: number
    users: Array<{
      user_id: string
      current_title_code: string | null
      unlocked_achievement_count: number
    }>
  }
}

export type ContestRegistrationCreateBody = {
  booking_id?: string
  vehicle_id?: string
  vehicle_source?: "RENTAL" | "BYOC"
  rental_slot?: {
    cafe_id: string
    slot_start: string
    slot_end: string
    track_config_id?: string | null
    vehicle_catalog_id?: string | null
  }
  byoc_vehicle_name?: string
  byoc_vehicle_brand?: string
  byoc_vehicle_class?: string
  byoc_vehicle_notes?: string
}
export type ContestRentalCafeOption = {
  id: string
  name: string
  city: string | null
  district: string | null
}

export type ContestRentalTrackConfig = {
  id: string
  cafe_id: string
  track_type_id: string
  track_type_name: string | null
  max_concurrent: number
}

export type ContestRentalVehicleCatalog = {
  id: string
  cafe_id: string
  name: string
  tier: string
  hourly_rate: number
  cover_image_url: string | null
  compatible_track_types: string[]
}

export type ContestRentalOptions = {
  cafes: ContestRentalCafeOption[]
  track_configs: ContestRentalTrackConfig[]
  vehicle_catalogs: ContestRentalVehicleCatalog[]}

export type ContestAvailableRentalVehicleUnit = {
  id: string
  identifier: string | null
  color: string | null
}

export type ContestAvailableRentalCatalogGroup = {
  catalog_id: string
  catalog_name: string
  tier: string
  hourly_rate: number
  cover_image_url: string | null
  available_units: ContestAvailableRentalVehicleUnit[]}

export type ContestAvailableRentalVehiclesResponse = ContestAvailableRentalCatalogGroup[]

export type ContestRentalBookingCreateBody = {
  contest_id: string
  cafe_id: string
  slot_start: string
  slot_end: string
  track_config_id?: string | null
  vehicle_catalog_id?: string | null
}

export type ContestRentalBookingResult = {
  bookingId: string
  vehicleId: string | null
  contestId: string
  status: string
  paymentExpiresAt: string | null
  totalAmount: number
  breakdown: Record<string, unknown>
}

export type ContestBookingCustomer = {
  id: string
  fullName: string | null
  email: string | null
  avatarUrl: string | null
  phone: string | null
}

export type ContestBookingRegistrationSummary = {
  id: string
  status: ContestRegistrationStatus
  vehicleSource: string | null
  checkInCode: string | null
}

export type ContestBookingItem = {
  id: string
  status: string
  source: string
  slotStart: string
  slotEnd: string
  customer: ContestBookingCustomer | null
  registration: ContestBookingRegistrationSummary | null
}
