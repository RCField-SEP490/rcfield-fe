import { describe, expect, it } from "vitest";

import type { ContestRegistration } from "../types";
import {
  filterContestRegistrations,
  getRegistrationCounts,
  getRegistrationStatusLabel,
  getVehicleSourceLabel,
} from "./tournament";

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
    metadata: {},
    user: { id: "user-3", fullName: "Chi Le", email: "chi@example.com" },
  },
];

describe("contest tournament helpers", () => {
  it("counts registrations by status and vehicle source", () => {
    expect(getRegistrationCounts(registrations, 8)).toMatchObject({
      total: 3,
      active: 2,
      confirmed: 1,
      checkedIn: 1,
      cancelled: 1,
      byoc: 2,
      rental: 1,
      remaining: 6,
    });
  });

  it("filters registrations by search, status, vehicle source and checked-in cafe", () => {
    expect(
      filterContestRegistrations(registrations, {
        search: "rental",
        status: "CHECKED_IN",
        vehicleSource: "RENTAL",
        cafeId: "cafe-1",
      }).map((registration) => registration.id),
    ).toEqual(["reg-2"]);
  });

  it("maps labels for registration status and vehicle source", () => {
    expect(getRegistrationStatusLabel("CONFIRMED")).toBe("Đã xác nhận");
    expect(getRegistrationStatusLabel("UNKNOWN")).toBe("UNKNOWN");
    expect(getVehicleSourceLabel("BYOC")).toBe("Xe cá nhân");
    expect(getVehicleSourceLabel("RENTAL")).toBe("Xe thuê");
  });
});
