/**
 * Shared server-side helpers for API routes.
 */
import "server-only";

import { NextResponse } from "next/server";
import { LIMITS } from "@/lib/config";

/** Read a JSON body with a hard size limit. Throws on oversize/invalid. */
export async function readJsonBody(req: Request): Promise<unknown> {
  const text = await req.text();
  if (text.length > LIMITS.MAX_JSON_BODY_BYTES) {
    throw new Error("BODY_TOO_LARGE");
  }
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("INVALID_JSON");
  }
}

/** Best-effort client IP extraction (trusts the platform's proxy headers). */
export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip");
  if (real?.trim()) return real.trim();
  return "unknown";
}

export function jsonError(
  status: number,
  message: string,
  extra?: Record<string, unknown>
) {
  return NextResponse.json({ message, ...extra }, { status });
}

/** Run a promise with a timeout; rejects with TIMEOUT on expiry. */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("TIMEOUT")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
