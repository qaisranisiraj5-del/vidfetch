/**
 * POST /api/fetch — validate a submitted URL and ask the platform's
 * integration for real download options.
 *
 * Security:
 *  - JSON body size limit, URL length limit
 *  - http/https only, strict platform hostname allowlist
 *  - DNS resolution + private-address rejection (SSRF prevention)
 *  - per-IP rate limiting with 429 + Retry-After
 *  - upstream timeout guard
 *  - only url_hash (sha256) is ever stored/logged — never the raw URL
 *  - generic 500s: no stack traces, no secrets
 */
import { NextResponse } from "next/server";
import { LIMITS } from "@/lib/config";
import { validateMediaUrl } from "@/lib/url-security";
import { checkRateLimit } from "@/lib/rate-limit";
import { getIntegration } from "@/lib/integrations";
import {
  clientIp,
  jsonError,
  readJsonBody,
  withTimeout,
} from "@/lib/api-helpers";
import { getServiceSupabase } from "@/lib/supabase-server";

const VALIDATION_STATUS: Record<string, number> = {
  EMPTY_URL: 400,
  URL_TOO_LONG: 400,
  INVALID_URL: 400,
  UNSUPPORTED_SCHEME: 400,
  UNSUPPORTED_PLATFORM: 422,
  UNRESOLVABLE_HOST: 422,
  PRIVATE_ADDRESS: 422,
};

export async function POST(req: Request) {
  // 1. Parse + size-limit the body.
  let body: unknown;
  try {
    body = await readJsonBody(req);
  } catch (err) {
    const code = (err as Error).message;
    return jsonError(
      400,
      code === "BODY_TOO_LARGE"
        ? "Request body is too large."
        : "Request body must be valid JSON."
    );
  }
  const rawUrl = (body as { url?: unknown })?.url;

  // 2. Rate limit by client IP.
  const ip = clientIp(req);
  const perHour = Number(process.env.RATE_LIMIT_PER_HOUR) || LIMITS.DEFAULT_RATE_LIMIT_PER_HOUR;
  const rl = checkRateLimit(`fetch:${ip}`, perHour);
  if (!rl.allowed) {
    const res = jsonError(
      429,
      "Too many requests. Please wait a while and try again."
    );
    res.headers.set("Retry-After", String(rl.retryAfterSecs));
    res.headers.set("X-RateLimit-Limit", String(rl.limit));
    res.headers.set("X-RateLimit-Remaining", "0");
    return res;
  }

  // 3. Validate + normalize the URL (includes SSRF checks).
  const validation = await validateMediaUrl(rawUrl);
  if (!validation.ok) {
    return jsonError(VALIDATION_STATUS[validation.code] ?? 400, validation.message, {
      code: validation.code,
    });
  }
  const { platform, url, urlHash } = validation;

  // 4. Best-effort job logging (skipped gracefully when DB is unconfigured).
  const service = getServiceSupabase();
  let jobId: string | null = null;
  if (service) {
    try {
      const { data } = await service
        .from("download_jobs")
        .insert({
          user_id: null,
          platform: platform.id,
          url_hash: urlHash,
          status: "pending",
        })
        .select("id")
        .single();
      jobId = data?.id ?? null;
    } catch {
      /* logging must never break the request */
    }
  }

  // 5. Ask the platform integration (honest: real results only when configured).
  let result;
  try {
    result = await withTimeout(
      getIntegration(platform.id).fetchMedia(url),
      LIMITS.UPSTREAM_TIMEOUT_MS
    );
  } catch (err) {
    result = {
      ok: false as const,
      code: "TIMEOUT" as const,
      message: "The request timed out. Please try again in a moment.",
    };
    console.error("fetch integration error:", (err as Error).message);
  }

  // 6. Record the outcome (hash only — never the raw URL).
  if (service && jobId) {
    try {
      await service
        .from("download_jobs")
        .update({
          status: result.ok ? "success" : "failed",
          error: result.ok ? null : result.message.slice(0, 500),
        })
        .eq("id", jobId);
    } catch {
      /* ignore */
    }
  }

  const res = NextResponse.json({
    platform: platform.id,
    platformName: platform.name,
    url,
    result,
  });
  res.headers.set("X-RateLimit-Limit", String(rl.limit));
  res.headers.set("X-RateLimit-Remaining", String(rl.remaining));
  return res;
}

export async function GET() {
  return jsonError(405, "Use POST with a JSON body { url }.");
}
