export type ContestFormState = {
  name: string
  description: string
  contest_type_id: string
  contest_format_id: string
  contest_template_id: string
  track_type_id: string
  participating_cafe_ids: string[]
  starts_at: string
  ends_at: string
  registration_opens_at: string
  registration_closes_at: string
  capacity: string
  entry_fee: string
  banner_image_url: string
  vehicle_policy: "RENTAL_ONLY" | "BYOC_ONLY" | "MIXED"
  assignment_policy: "AT_CHECK_IN" | "PRE_ASSIGNED"
  finalists: string
  /* Chính sách giá thuê xe trong giải — map sang `contest.config.rental_policy`.
     Backend đã đọc và áp từ lâu (`getContestRentalPolicy`), nhưng trước đây không
     có chỗ nào ghi nên mọi giải đều rơi vào mặc định "thu đủ tiền sân + cọc đầy đủ". */
  rental_waive_slot_fee: boolean
  rental_deposit_mode: RentalDepositMode
  rental_deposit_percent: string
  rental_window_before: string
  rental_window_after: string
}

export type RentalDepositMode = "FULL" | "REDUCED" | "WAIVED"

export type ResourceLockScope = "FULL_BRANCH" | "SELECTED_TRACKS"

export type ResourceLockState = Record<
  string,
  {
    scope: ResourceLockScope
    track_config_ids: string[]
  }
>

export const defaultForm: ContestFormState = {
  name: "",
  description: "",
  contest_type_id: "",
  contest_format_id: "",
  contest_template_id: "",
  track_type_id: "",
  participating_cafe_ids: [],
  starts_at: "",
  ends_at: "",
  registration_opens_at: "",
  registration_closes_at: "",
  capacity: "16",
  entry_fee: "0",
  banner_image_url: "",
  // Mặc định cho giải MỚI: khách tự mang xe. Trước đây mặc định là "chỉ dùng xe
  // thuê" nên phần lớn giải vô tình đi vào luồng phức tạp nhất.
  vehicle_policy: "BYOC_ONLY",
  assignment_policy: "AT_CHECK_IN",
  finalists: "4",
  // Mặc định hợp lý cho giải mới: VĐV đã trả lệ phí nên miễn tiền sân, và xe do
  // quán vận hành trong giải nên không bắt cọc. Giải CŨ đang sửa thì đọc lại
  // giá trị đã lưu, không áp mặc định này (xem useContestForm).
  rental_waive_slot_fee: true,
  rental_deposit_mode: "WAIVED",
  rental_deposit_percent: "50",
  rental_window_before: "60",
  rental_window_after: "60",
}
