"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase-browser";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError("Authentication isn't configured yet (missing Supabase settings).");
      setLoading(false);
      return;
    }
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (signInError) {
      setError("Invalid email or password.");
      return;
    }
    router.push(next.startsWith("/admin") ? next : "/admin");
    router.refresh();
  }

  const inputCls =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <p className="text-sm font-bold tracking-wide text-slate-500">VidFetch · Admin</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-slate-600">
          Administrator access only. Visitors are redirected here automatically.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4" aria-label="Admin sign in">
          <div>
            <label htmlFor="admin-email" className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className={inputCls}
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
