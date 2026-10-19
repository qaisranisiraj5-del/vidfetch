/**
 * Server-side authentication + authorization helpers.
 *
 * NEVER trust client claims about roles. Every protected page and API
 * action calls requireAdmin(), which re-verifies the role server-side.
 */
import "server-only";

import { redirect } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getServerSupabase, getServiceSupabase } from "./supabase-server";
import { decideAdminAccess } from "./access";

export interface AdminCheck {
  user: User;
  isAdmin: boolean;
}

async function fetchProfileRole(
  service: SupabaseClient,
  userId: string
): Promise<{ role?: string } | null> {
  const { data, error } = await service
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  if (error) return null;
  return data as { role?: string } | null;
}

/** Returns the signed-in user (via request cookies) or null. */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await getServerSupabase();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}

/**
 * Verify the caller is an administrator, server-side.
 * Returns the user + a service client safe to use for admin work.
 * Redirects (pages) or throws (API routes pass {redirect:false}) otherwise.
 */
export async function requireAdmin(opts?: { redirect?: boolean }): Promise<{
  user: User;
  service: SupabaseClient;
}> {
  const shouldRedirect = opts?.redirect !== false;
  const fail = (to: string): never => {
    if (shouldRedirect) redirect(to);
    throw new Error("FORBIDDEN");
  };

  const user = await getCurrentUser();
  const service = getServiceSupabase();
  if (!user || !service) fail("/admin/login");

  const profile = await fetchProfileRole(service!, user!.id);
  const decision = decideAdminAccess(user, profile);
  if (!decision.allowed) fail(decision.reason === "NO_USER" ? "/admin/login" : "/");

  return { user: user!, service: service! };
}
