import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ParticipantManagementPanel } from "./ParticipantManagementPanel";
import type { Contest, ContestRegistration } from "../types";

const contest: Contest = {
  id: "contest-1",
  provider_id: "provider-1",
  name: "RCField Spec Cup",
  description: "Demo contest",
  track_type_id: "track-1",
  starts_at: "2026-07-01T09:00:00.000Z",
  ends_at: "2026-07-01T11:00:00.000Z",
  registration_opens_at: "2026-06-20T09:00:00.000Z",
  registration_closes_at: "2026-06-30T09:00:00.000Z",
  capacity: 8,
  entry_fee: 0,
  status: "OPEN",
  banner_image_url: null,
  config: {},
  participating_cafes: [
    {
      id: "cafe-1",
      name: "RCField District 1",
      slug: "district-1",
      status: "ACTIVE",
      city: "Ho Chi Minh",
      district: "District 1",
    },
  ],
  registration_summary: { total: 3, active: 2, checked_in: 1 },
  remaining_capacity: 6,
  is_registration_open: true,
  should_notify: false,
};

const registrations: ContestRegistration[] = [
  {
    id: "reg-1",
    contest_id: "contest-1",
    user_id: "user-1",
    participant_role_snapshot: "CUSTOMER",
    vehicle_source: "BYOC",
    status: "CONFIRMED",
    check_in_code: "CHECK-ALPHA",
    metadata: { note: "Drift 1:10" },
    user: { id: "user-1", fullName: "An Nguyen", email: "an@example.com" },
  },
  {
    id: "reg-2",
    contest_id: "contest-1",
    user_id: "user-2",
    participant_role_snapshot: "PROVIDER",
    vehicle_source: "RENTAL",
    status: "CHECKED_IN",
    check_in_code: "CHECK-BETA",
    checked_in_cafe_id: "cafe-1",
    checked_in_at: "2026-07-01T08:30:00.000Z",
    metadata: { note: "Rental spec" },
    user: { id: "user-2", fullName: "Bao Tran", email: "bao@example.com" },
  },
  {
    id: "reg-3",
    contest_id: "contest-1",
    user_id: "user-3",
    participant_role_snapshot: "CUSTOMER",
    vehicle_source: "BYOC",
    status: "CANCELLED",
    check_in_code: "CHECK-GAMMA",
    cancellation_reason: "Busy",
    metadata: {},
    user: { id: "user-3", fullName: "Chi Le", email: "chi@example.com" },
  },
];

describe("ParticipantManagementPanel", () => {
  it("renders participant counts and table details", () => {
    render(
      <ParticipantManagementPanel
        contest={contest}
        registrations={registrations}
        defaultCafeId="cafe-1"
        onCheckIn={vi.fn()}
        onCancel={vi.fn()}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    expect(screen.getByText("Quản lý người tham gia")).toBeInTheDocument();
    expect(screen.getByText("An Nguyen")).toBeInTheDocument();
    expect(screen.getByText("Bao Tran")).toBeInTheDocument();
    expect(screen.getByText("CHECK-ALPHA")).toBeInTheDocument();
    expect(screen.getAllByText("3").length).toBeGreaterThan(0);
    expect(screen.getByText("6 chỗ còn lại")).toBeInTheDocument();
  });

  it("filters participants by search text and status", async () => {
    const user = userEvent.setup();
    render(
      <ParticipantManagementPanel
        contest={contest}
        registrations={registrations}
        defaultCafeId="cafe-1"
        onCheckIn={vi.fn()}
        onCancel={vi.fn()}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText("Tìm người tham gia"), "rental");
    expect(screen.queryByText("An Nguyen")).not.toBeInTheDocument();
    expect(screen.getByText("Bao Tran")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Lọc trạng thái"), "CONFIRMED");
    expect(screen.getByText("Không tìm thấy người tham gia khớp bộ lọc hiện tại.")).toBeInTheDocument();
  });

  it("calls check-in and cancel actions with selected registration", async () => {
    const user = userEvent.setup();
    const onCheckIn = vi.fn();
    const onCancel = vi.fn();
    render(
      <ParticipantManagementPanel
        contest={contest}
        registrations={registrations}
        defaultCafeId="cafe-1"
        onCheckIn={onCheckIn}
        onCancel={onCancel}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Check-in" }));
    expect(onCheckIn).toHaveBeenCalledWith("reg-1", "cafe-1");

    const firstRow = screen.getByText("An Nguyen").closest("tr");
    expect(firstRow).not.toBeNull();
    await user.click(within(firstRow as HTMLTableRowElement).getByRole("button", { name: "Hủy" }));
    await user.type(screen.getByLabelText("Lý do hủy đăng ký"), "No show");
    await user.click(screen.getByRole("button", { name: "Xác nhận hủy" }));
    expect(onCancel).toHaveBeenCalledWith("reg-1", "No show");
  });

  it("calls approve and reject actions with selected registration", async () => {
    const user = userEvent.setup();
    const onApprove = vi.fn();
    const onReject = vi.fn();
    render(
      <ParticipantManagementPanel
        contest={contest}
        registrations={[
          {
            id: "reg-4",
            contest_id: "contest-1",
            user_id: "user-4",
            participant_role_snapshot: "CUSTOMER",
            vehicle_source: "BYOC",
            status: "PENDING",
            check_in_code: "CHECK-PENDING",
            metadata: { note: "Pending approval" },
            user: { id: "user-4", fullName: "Danh Nguyen", email: "danh@example.com" },
          },
        ]}
        defaultCafeId="cafe-1"
        onCheckIn={vi.fn()}
        onCancel={vi.fn()}
        onApprove={onApprove}
        onReject={onReject}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Duyệt" }));
    expect(onApprove).toHaveBeenCalledWith("reg-4");

    await user.click(screen.getByRole("button", { name: "Từ chối" }));
    await user.type(screen.getByLabelText("Lý do từ chối đăng ký"), "Incompatible car");
    await user.click(screen.getByRole("button", { name: "Xác nhận từ chối" }));
    expect(onReject).toHaveBeenCalledWith("reg-4", "Incompatible car");
  });

  it("renders empty state when there are no registrations", () => {
    render(
      <ParticipantManagementPanel
        contest={{ ...contest, registration_summary: { total: 0, active: 0, checked_in: 0 } }}
        registrations={[]}
        defaultCafeId="cafe-1"
        onCheckIn={vi.fn()}
        onCancel={vi.fn()}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    expect(screen.getByText("Chưa có người tham gia")).toBeInTheDocument();
  });
});
