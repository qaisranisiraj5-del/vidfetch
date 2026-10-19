"use client";

import { useState, type FormEvent } from "react";
import type { FetchOutcome } from "@/lib/integrations/types";
import ResultCard from "./ResultCard";

interface ApiResponse {
  platform: string;
  platformName: string;
  url: string;
  result: FetchOutcome;
}

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "done"; data: ApiResponse };

const PLATFORM_NAMES = ["YouTube", "Instagram", "Facebook", "TikTok"];

export default function UrlForm() {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) {
      setState({ status: "error", message: "Please paste a video URL first." });
      return;
    }
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState({
          status: "error",
          message: data?.message ?? "Something went wrong. Please try again.",
        });
        return;
      }
      setState({ status: "done", data: data as ApiResponse });
    } catch {
      setState({
        status: "error",
        message: "Network error. Check your connection and try again.",
      });
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={onSubmit} aria-label="Video URL downloader" noValidate={false}>
        <label htmlFor="video-url" className="sr-only">
          Paste a video URL from YouTube, Instagram, Facebook, or TikTok
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="video-url"
            name="url"
            type="url"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            placeholder="Paste a video link here… e.g. https://www.youtube.com/watch?v=…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            maxLength={2048}
            required
            aria-describedby="url-hint"
            className="h-14 flex-1 rounded-2xl border border-slate-300 bg-white px-5 text-base shadow-sm placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
          />
          <button
            type="submit"
            disabled={state.status === "loading"}
            className="h-14 shrink-0 rounded-2xl bg-brand-600 px-8 text-base font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {state.status === "loading" ? "Fetching…" : "Fetch"}
          </button>
        </div>
        <p id="url-hint" className="mt-2 text-sm text-slate-500">
          We only process links you have the right to download, and only when
          the platform integration supports it.
        </p>
      </form>

      <div className="mt-4 flex flex-wrap gap-2" aria-label="Supported platforms">
        {PLATFORM_NAMES.map((p) => (
          <span
            key={p}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
          >
            {p}
          </span>
        ))}
      </div>

      <div className="mt-6" aria-live="polite" aria-atomic="true">
        {state.status === "loading" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600"
              />
              <p className="text-sm font-medium text-slate-700">
                Checking the link and the platform integration…
              </p>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-brand-500" />
            </div>
          </div>
        )}

        {state.status === "error" && (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"
          >
            <p className="font-semibold">Couldn&apos;t process that link</p>
            <p className="mt-1">{state.message}</p>
          </div>
        )}

        {state.status === "done" && <ResultCard response={state.data} />}
      </div>
    </div>
  );
}
