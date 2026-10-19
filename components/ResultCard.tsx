"use client";

import type { FetchOutcome } from "@/lib/integrations/types";
import PlatformBadge from "./PlatformBadge";

interface ApiResponse {
  platform: string;
  platformName: string;
  url: string;
  result: FetchOutcome;
}

export default function ResultCard({ response }: { response: ApiResponse }) {
  const { platformName, result } = response;

  if (!result.ok) {
    const isNotConfigured = result.code === "NOT_CONFIGURED";
    return (
      <div
        role="alert"
        className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <PlatformBadge platform={platformName} />
          <h2 className="text-base font-semibold text-amber-900">
            {isNotConfigured ? "Integration not configured" : "Can't download this link"}
          </h2>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-amber-800">
          {result.message}
        </p>
        <p className="mt-3 text-xs text-amber-700">
          We never show fake download buttons. When an integration is ready,
          available quality and format options will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <PlatformBadge platform={platformName} />
        <h2 className="text-base font-semibold text-slate-900">
          {result.title ?? "Video found"}
        </h2>
      </div>

      {result.thumbnailUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={result.thumbnailUrl}
          alt=""
          className="mt-4 aspect-video w-full rounded-xl object-cover"
          loading="lazy"
        />
      )}

      {result.durationSecs != null && (
        <p className="mt-3 text-sm text-slate-600">
          Duration: {Math.floor(result.durationSecs / 60)}:
          {String(Math.floor(result.durationSecs % 60)).padStart(2, "0")}
        </p>
      )}

      {result.note && (
        <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
          {result.note}
        </p>
      )}

      <h3 className="mt-5 text-sm font-semibold text-slate-900">
        Available options
      </h3>
      {result.qualities.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600">
          No downloadable options are available for this link right now.
        </p>
      ) : (
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {result.qualities.map((q, i) => (
            <li
              key={`${q.label}-${q.format}-${i}`}
              className="flex items-center justify-between rounded-xl border border-slate-200 p-4"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {q.label} · {q.format.toUpperCase()}
                </p>
                {q.note && <p className="text-xs text-slate-500">{q.note}</p>}
              </div>
              <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500">
                Via integration
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
