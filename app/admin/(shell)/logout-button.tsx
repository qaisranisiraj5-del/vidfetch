"use client";

import { getBrowserSupabase } from "@/lib/supabase-browser";

/** Signs the admin out and returns to the login page. */
export default function AdminLogoutButton() {
  async function logout() {
    const supabase = getBrowserSupabase();
    if (supabase) await supabase.auth.signOut();
    window.location.href = "/admin/login";
  }
  return (
    <button
      type="button"
      onClick={logout}
      className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-600"
    >
      Log out
    </button>
  );
}
