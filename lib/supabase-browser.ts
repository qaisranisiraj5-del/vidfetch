"use client";

/**
 * Browser-side Supabase client (anon key only). RLS applies.
 * Service-role key is NEVER imported here.
 */
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  if (!client) {
    client = createBrowserClient(url, anonKey);
  }
  return client;
}
