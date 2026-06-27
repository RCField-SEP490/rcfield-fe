export type ContestStatus = 'DRAFT' | 'OPEN' | 'CLOSED' | 'RUNNING' | 'COMPLETED' | 'CANCELLED';

export type ContestRegistrationStatus = 'CONFIRMED' | 'CHECKED_IN' | 'CANCELLED' | 'PENDING';

export interface ParticipatingCafe {
  id: string;
  name: string;
  slug: string;
  status: string;
  city: string;
  district: string;
}

export interface RegistrationSummary {
  total: number;
  active: number;
  checked_in: number;
}

export interface Contest {
  id: string;
  provider_id: string;
  name: string;
  description: string | null;
  track_type_id: string;
  starts_at: string;
  ends_at: string;
  registration_opens_at: string;
  registration_closes_at: string;
  capacity: number;
  entry_fee: number;
  status: ContestStatus;
  banner_image_url?: string | null;
  config?: {
    bracket_size?: number;
    [key: string]: unknown;
  };
  participating_cafes: ParticipatingCafe[];
  registration_summary: RegistrationSummary;
  remaining_capacity: number;
  is_registration_open: boolean;
  should_notify: boolean;
  vehicle_policy?: 'RENTAL_ONLY' | 'BYOC_ONLY' | 'MIXED' | null;
  vehicleRule?: {
    vehicle_policy: 'RENTAL_ONLY' | 'BYOC_ONLY' | 'MIXED';
    [key: string]: any;
  } | null;
}

export interface ContestRegistration {
  id: string;
  contest_id: string;
  user_id: string;
  participant_role_snapshot: string;
  vehicle_source: 'BYOC' | 'RENTAL';
  vehicle_id?: string | null;
  customer_vehicle_id?: string | null;
  status: ContestRegistrationStatus;
  check_in_code: string;
  metadata?: {
    note?: string;
    review_reason_code?: 'TRACK_INCOMPATIBLE' | 'RULESET_INCOMPATIBLE' | 'UNVERIFIED_VEHICLE' | 'OTHER';
    rental_recommended?: boolean;
    [key: string]: unknown;
  };
  user?: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
  };
  checked_in_cafe_id?: string | null;
  checked_in_by?: string | null;
  checked_in_at?: string | null;
  cancelled_by?: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  created_at?: string;
  updated_at?: string;
  vehicle?: {
    id: string;
    name: string;
    imageUrl?: string | null;
  } | null;
  customer_vehicle?: {
    id: string;
    name: string;
    imageUrl?: string | null;
  } | null;
}

export interface ContestClass {
  id: string;
  contest_id: string;
  code: string;
  name: string;
  capacity: number;
  rules?: {
    format?: 'single_elimination' | 'double_elimination' | 'swiss' | 'round_robin';
    [key: string]: unknown;
  };
  display_order: number;
  is_active: boolean;
}

export type RoundType = 'PRACTICE' | 'QUALIFYING' | 'FINAL';

export interface ContestRound {
  id: string;
  contest_id: string;
  contest_class_id: string;
  round_type: RoundType;
  round_no: number;
  roundNo?: number;
  roundType?: RoundType;
  scheduled_at?: string;
  scheduledAt?: string;
  name: string;
  rules?: {
    bracket?: boolean;
    [key: string]: unknown;
  };
}

export interface ContestHeat {
  id: string;
  contest_round_id: string;
  heat_no: number;
  config?: {
    lane_count?: number;
    [key: string]: unknown;
  };
  entries?: ContestHeatEntry[];
}

export interface ContestHeatEntry {
  id: string;
  contest_heat_id: string;
  registration_id: string;
  contest_class_id: string;
  grid_position: number;
  registration?: ContestRegistration;
}

export type ContestResultType = 'TIME_ATTACK' | 'RACE_FINAL';

export interface ContestResultItem {
  heat_entry_id: string;
  best_lap_ms?: number;
  total_time_ms?: number;
  laps_completed?: number;
  penalty_ms?: number;
  finish_position?: number;
}

export interface ContestLeaderboardStanding {
  registration_id: string;
  user_id: string;
  fullName?: string;
  email?: string;
  rank: number;
  best_lap_ms?: number | null;
  total_time_ms?: number | null;
  points?: number | null;
}

export type RewardType = 'TROPHY' | 'VOUCHER' | 'MERCHANDISE' | 'POINTS' | 'OTHER';

export interface ContestReward {
  id: string;
  contest_id: string;
  contest_class_id: string;
  title: string;
  description: string;
  reward_type: RewardType;
  position: number;
  quantity: number;
  is_published: boolean;
  metadata?: {
    voucher_code?: string;
    [key: string]: unknown;
  };
}

export interface ContestRewardClaim {
  id: string;
  reward_id: string;
  user_id: string;
  status: 'ISSUED' | 'CLAIMED' | 'EXPIRED';
  issued_at: string;
  claimed_at?: string;
  created_at?: string;
  code?: string;
  reward?: ContestReward;
  contest?: {
    id: string;
    name: string;
  };
}

export interface BracketMatch {
  id: string;
  contestId: string;
  contestRoundId: string;
  matchNo: number;
  competitorARegistrationId: string | null;
  competitorBRegistrationId: string | null;
  winnerRegistrationId: string | null;
  loserRegistrationId: string | null;
  nextMatchId: string | null;
  nextSlot: 'A' | 'B' | null;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  metadata?: {
    stage?: string;
    score?: string;
    [key: string]: unknown;
  };
  // Optional client-side mappings
  competitorA?: ContestRegistration;
  competitorB?: ContestRegistration;
  winner?: ContestRegistration;
}

export interface ContestAuditLog {
  id: string;
  contestId: string;
  registrationId: string | null;
  matchId: string | null;
  actorId: string | null;
  actorRole: string | null;
  eventType: string;
  beforeJson: Record<string, unknown> | null;
  afterJson: Record<string, unknown> | null;
  reason: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ContestMetrics {
  registration_stats: {
    total: number;
    pending: number;
    confirmed: number;
    checkedIn: number;
    cancelled: number;
  };
  match_stats: {
    total: number;
    draft: number;
    ready: number;
    completed: number;
    cancelled: number;
  };
}

