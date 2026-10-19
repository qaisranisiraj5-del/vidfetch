/**
 * Unit tests: admin access decisions (lib/access.ts).
 * A non-admin must NEVER be allowed into /admin, no matter what.
 */
import { describe, it, expect } from "vitest";
import { decideAdminAccess } from "../access";

const user = { id: "user-1" };

describe("decideAdminAccess", () => {
  it("allows admins", () => {
    expect(decideAdminAccess(user, { role: "admin" })).toEqual({
      allowed: true,
      reason: "OK",
    });
  });

  it("blocks anonymous visitors", () => {
    expect(decideAdminAccess(null, { role: "admin" })).toEqual({
      allowed: false,
      reason: "NO_USER",
    });
  });

  it("blocks signed-in users without a profile", () => {
    expect(decideAdminAccess(user, null)).toEqual({
      allowed: false,
      reason: "NO_PROFILE",
    });
  });

  it("blocks regular users", () => {
    expect(decideAdminAccess(user, { role: "user" })).toEqual({
      allowed: false,
      reason: "NOT_ADMIN",
    });
  });

  it("blocks unknown roles", () => {
    expect(decideAdminAccess(user, { role: "superuser" })).toEqual({
      allowed: false,
      reason: "NOT_ADMIN",
    });
    expect(decideAdminAccess(user, {})).toEqual({
      allowed: false,
      reason: "NOT_ADMIN",
    });
  });

  it("is case-sensitive: 'Admin' is not admin", () => {
    expect(decideAdminAccess(user, { role: "Admin" })).toEqual({
      allowed: false,
      reason: "NOT_ADMIN",
    });
  });
});
