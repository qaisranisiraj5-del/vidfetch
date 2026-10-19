#!/usr/bin/env node
/**
 * verify-setup.mjs — verify the Supabase backend is wired correctly.
 *
 * Checks (all read-only except a deliberately-blocked write attempt):
 *   1. Required tables exist and are queryable with the service-role key.
 *   2. The admin profile exists with role = 'admin'.
 *   3. RLS blocks anonymous reads of activity_log (permission test).
 *   4. RLS blocks an anonymous self-promotion attempt to admin
 *      (insert into profiles with role='admin' must fail).
 *   5. Seed rows exist in app_settings and integration_status.
 *
 * Env required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *               NEXT_PUBLIC_SUPABASE_ANON_KEY, ADMIN_EMAIL
 *
 * Usage: node scripts/verify-setup.mjs
 */
import { createClient } from "@supabase/supabase-js";

const REQUIRED = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "ADMIN_EMAIL",
];
for (const name of REQUIRED) {
  if (!process.env[name]?.trim()) {
    console.error(`ERROR: ${name} is not set.`);
    process.exit(1);
  }
}

const URL = process.env.SUPABASE_URL.trim();
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY.trim();
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim();
const ADMIN_EMAIL = process.env.ADMIN_EMAIL.trim().toLowerCase();

const admin = createClient(URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const anon = createClient(URL, ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let failures = 0;
function check(name, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

// 1. Tables exist -----------------------------------------------------------
for (const table of [
  "profiles",
  "download_jobs",
  "activity_log",
  "app_settings",
  "integration_status",
]) {
  const { error } = await admin.from(table).select("*", { count: "exact", head: true });
  check(`table public.${table} is queryable`, !error, error?.message ?? "");
}

// 2. Admin profile ----------------------------------------------------------
const { data: adminProfile, error: adminErr } = await admin
  .from("profiles")
  .select("email, role")
  .eq("email", ADMIN_EMAIL)
  .single();
check(
  "admin profile exists with role='admin'",
  !adminErr && adminProfile?.role === "admin",
  adminErr?.message ?? `role=${adminProfile?.role}`
);

// 3. RLS: anonymous users cannot read activity_log --------------------------
const { data: actRows, error: actErr } = await anon
  .from("activity_log")
  .select("id")
  .limit(1);
check(
  "RLS blocks anonymous reads of activity_log",
  (actRows?.length ?? 0) === 0,
  actErr ? `blocked with error (${actErr.code})` : `returned ${actRows?.length} rows`
);

// 4. RLS: anonymous users cannot self-promote to admin -----------------------
const { error: promoErr } = await anon.from("profiles").insert({
  id: "00000000-0000-0000-0000-000000000000",
  email: "attacker@example.com",
  role: "admin",
});
check(
  "RLS blocks anonymous self-promotion to admin",
  Boolean(promoErr),
  promoErr ? `blocked (${promoErr.code})` : "INSERT WAS ALLOWED — RLS MISCONFIGURED"
);

// 5. Seed rows ---------------------------------------------------------------
const { data: settings } = await admin.from("app_settings").select("key").limit(20);
check(
  "app_settings has seed rows",
  (settings?.length ?? 0) >= 5,
  `found ${settings?.length ?? 0}`
);
const { data: integrations } = await admin.from("integration_status").select("platform");
check(
  "integration_status has 4 platform rows",
  (integrations?.length ?? 0) === 4,
  `found ${integrations?.length ?? 0}`
);

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
