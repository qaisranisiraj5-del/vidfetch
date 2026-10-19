#!/usr/bin/env node
/**
 * create-admin.mjs — create the FIRST administrator account for real.
 *
 * Reads ALL credentials from environment variables at runtime:
 *   SUPABASE_URL            your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY  service-role key (server-side only, never commit)
 *   ADMIN_EMAIL             administrator's email address
 *   ADMIN_NAME              administrator's display name (optional)
 *   ADMIN_PASSWORD          initial password (use a strong one)
 *
 * What it does:
 *   1. Creates the user via the Supabase Auth Admin API
 *      (password is hashed by Supabase Auth — never stored in plaintext).
 *   2. Upserts public.profiles with role = 'admin' (server-side, bypasses RLS
 *      via the service-role key, which is exactly what RLS is designed for).
 *   3. Prints verification steps.
 *
 * It NEVER writes credentials to files, logs, or git. If the user already
 * exists, it reuses the existing auth user and only ensures the admin role.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   ADMIN_EMAIL=... ADMIN_NAME=... ADMIN_PASSWORD=... \
 *   node scripts/create-admin.mjs
 */
import { createClient } from "@supabase/supabase-js";

const REQUIRED = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
];

function fail(msg) {
  console.error(`\nERROR: ${msg}\n`);
  process.exit(1);
}

for (const name of REQUIRED) {
  if (!process.env[name]?.trim()) {
    fail(
      `${name} is not set. Export it in your shell (do NOT put it in a file that gets committed).\n` +
        `Example: export ${name}="..."`
    );
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL.trim();
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY.trim();
const ADMIN_EMAIL = process.env.ADMIN_EMAIL.trim().toLowerCase();
const ADMIN_NAME = (process.env.ADMIN_NAME || "Administrator").trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD; // never logged

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log("Creating administrator account…");

// 1. Find or create the auth user.
let userId;
const { data: existing, error: listError } = await supabase.auth.admin.listUsers();
if (listError) fail(`Could not list auth users: ${listError.message}`);

const found = existing.users.find(
  (u) => u.email?.toLowerCase() === ADMIN_EMAIL
);

if (found) {
  userId = found.id;
  console.log(`Auth user already exists (${ADMIN_EMAIL}); reusing it.`);
} else {
  const { data, error } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true, // no confirmation email needed for the initial admin
    user_metadata: { name: ADMIN_NAME },
  });
  if (error) fail(`Auth user creation failed: ${error.message}`);
  userId = data.user.id;
  console.log(`Auth user created (${ADMIN_EMAIL}).`);
}

// 2. Ensure the admin profile row (server-side upsert; RLS bypass is intended here).
const { error: profileError } = await supabase.from("profiles").upsert(
  { id: userId, email: ADMIN_EMAIL, role: "admin" },
  { onConflict: "id" }
);
if (profileError) fail(`Could not set admin role in profiles: ${profileError.message}`);
console.log("Role 'admin' assigned in public.profiles.");

// 3. Verify.
const { data: profile, error: verifyError } = await supabase
  .from("profiles")
  .select("id, email, role")
  .eq("id", userId)
  .single();
if (verifyError || profile?.role !== "admin") {
  fail("Verification failed: admin profile row is missing or role is not 'admin'.");
}

console.log("\nSUCCESS: administrator account is ready.");
console.log("------------------------------------------------------------");
console.log("Next steps:");
console.log("  1. Open <your-site>/admin/login and sign in with the admin email.");
console.log("  2. Change the password immediately: Supabase Dashboard >");
console.log("     Authentication > Users > select the admin > Send password");
console.log("     recovery email (or use the in-app password update once added).");
console.log("  3. Confirm /admin, /admin/settings, /admin/integrations and");
console.log("     /admin/activity all load, and that logged-out visitors are");
console.log("     redirected to /admin/login.");
console.log("------------------------------------------------------------");
console.log("The password was used only for this one-time setup and was not");
console.log("written to any file, log, or commit.");
