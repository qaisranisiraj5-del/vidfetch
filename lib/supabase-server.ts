/**
 * Server-side Supabase clients.
 *
 * - getServerSupabase(): request-scoped client using the anon key with
 *   the user's cookies — RLS applies, so it acts AS the signed-in user.
 * - getServiceSupabase(): service-role client for privileged server work
 *   (admin dashboard reads, settings writes). Bypasses RLS — use ONLY
 *   after verifying the caller's admin role via requireAdmin().
 * Both return null when Supabase env vars are missing so the app can
 * render honest "not configured" states instead of crashing.
 */
import "server-only";

import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey);
}

export function isServiceSupabaseConfigured(): boolean {
  return Boolean(url && serviceKey);
}

export async function getServerSupabase(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured()) return null;
  const cookieStore = await cookies();
  return createServerClient(url!, anonKey!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          /* middleware/route-handler edge: ignore */
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          /* ignore */
        }
      },
    },
  });
}

let serviceClient: SupabaseClient | null = null;

export function getServiceSupabase(): SupabaseClient | null {
  if (!isServiceSupabaseConfigured()) return null;
  if (!serviceClient) {
    serviceClient = createClient(url!, serviceKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return serviceClient;
}
