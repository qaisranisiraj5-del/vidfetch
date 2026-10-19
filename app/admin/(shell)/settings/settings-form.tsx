"use client";

import { useState } from "react";

interface Setting {
  key: string;
  value: unknown;
}

const LABELS: Record<string, string> = {
  site_name: "Site name",
  site_tagline: "Site tagline",
  rate_limit_per_hour: "Rate limit (requests/hour per IP)",
  contact_email: "Contact email",
};

function valueToString(v: unknown): string {
  if (typeof v === "string") return v;
  return JSON.stringify(v ?? "");
}

export default function SettingsForm({ initial }: { initial: Setting[] }) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(initial.map((s) => [s.key, valueToString(s.value)]))
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const editable = initial.filter((s) => LABELS[s.key]);

  async function save(key: string) {
    setSaving(key);
    setNotice(null);
    let value: unknown = values[key];
    if (key === "rate_limit_per_hour") {
      const n = parseInt(values[key], 10);
      if (!Number.isInteger(n) || n < 1 || n > 1000) {
        setNotice("Rate limit must be a whole number between 1 and 1000.");
        setSaving(null);
        return;
      }
      value = n;
    }
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) throw new Error();
      setNotice(`Saved “${LABELS[key]}”.`);
    } catch {
      setNotice("Could not save. Please try again.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div>
      {notice && (
        <p role="status" className="mb-4 rounded-xl bg-slate-100 p-3 text-sm text-slate-700">
          {notice}
        </p>
      )}
      <div className="space-y-4">
        {editable.map((s) => (
          <div key={s.key} className="rounded-2xl bg-white p-5 shadow-sm">
            <label htmlFor={`setting-${s.key}`} className="text-sm font-semibold text-slate-900">
              {LABELS[s.key]}
            </label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                id={`setting-${s.key}`}
                type={s.key === "rate_limit_per_hour" ? "number" : "text"}
                value={values[s.key] ?? ""}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [s.key]: e.target.value }))
                }
                className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              />
              <button
                type="button"
                onClick={() => save(s.key)}
                disabled={saving === s.key}
                className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {saving === s.key ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
        <p className="font-semibold">About secrets</p>
        <p className="mt-1">
          API keys and the database service key are never shown here. They can
          only be changed through secure environment variables on the hosting
          platform (e.g. Vercel project settings), never through this
          dashboard.
        </p>
      </div>
    </div>
  );
}
