"use client";

import { useState } from "react";

interface Row {
  platform: string;
  name: string;
  configured: boolean;
  healthy: boolean;
  message: string;
  enabled: boolean;
}

const GUIDANCE: Record<string, string> = {
  youtube:
    "Add a YouTube Data API v3 key (YOUTUBE_API_KEY) in your hosting environment variables. Note: YouTube offers no official download API — only metadata lookup is possible.",
  instagram:
    "Connect a Meta developer app and add an authorized user token (INSTAGRAM_ACCESS_TOKEN). Only media the token owner may access can be processed.",
  facebook:
    "Create a Meta developer app and add FACEBOOK_APP_ID + FACEBOOK_APP_SECRET as environment variables. Only authorized videos can be processed.",
  tiktok:
    "Register a TikTok developer app and add TIKTOK_CLIENT_KEY + TIKTOK_CLIENT_SECRET as environment variables.",
};

export default function IntegrationsTable({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);

  async function toggle(platform: string, enabled: boolean) {
    setBusy(platform);
    try {
      const res = await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, enabled: !enabled }),
      });
      if (!res.ok) throw new Error();
      setRows((rs) =>
        rs.map((r) => (r.platform === platform ? { ...r, enabled: !enabled } : r))
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      {rows.map((r) => (
        <div key={r.platform} className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">{r.name}</h2>
              <p className="mt-1 max-w-2xl text-sm text-slate-600">{r.message}</p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  r.configured ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                }`}
              >
                {r.configured ? "Configured" : "Not configured"}
              </span>
              <button
                type="button"
                disabled={busy === r.platform}
                onClick={() => toggle(r.platform, r.enabled)}
                aria-pressed={r.enabled}
                className={`rounded-lg px-4 py-2 text-xs font-semibold text-white ${
                  r.enabled ? "bg-slate-600 hover:bg-slate-500" : "bg-brand-600 hover:bg-brand-700"
                } disabled:opacity-60`}
              >
                {busy === r.platform ? "…" : r.enabled ? "Disable" : "Enable"}
              </button>
            </div>
          </div>
          <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
            <span className="font-semibold">Setup: </span>
            {GUIDANCE[r.platform]}
          </p>
        </div>
      ))}
    </div>
  );
}
