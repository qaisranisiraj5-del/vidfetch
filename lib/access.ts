/**
 * Pure access-control decision logic (no server imports — unit-testable).
 */

export type AccessDecision =
  | { allowed: true; reason: "OK" }
  | { allowed: false; reason: "NO_USER" | "NO_PROFILE" | "NOT_ADMIN" };

/** Decide whether a signed-in user with the given profile may enter /admin. */
export function decideAdminAccess(
  user: { id: string } | null,
  profile: { role?: string } | null
): AccessDecision {
  if (!user) return { allowed: false, reason: "NO_USER" };
  if (!profile) return { allowed: false, reason: "NO_PROFILE" };
  if (profile.role !== "admin") return { allowed: false, reason: "NOT_ADMIN" };
  return { allowed: true, reason: "OK" };
}
