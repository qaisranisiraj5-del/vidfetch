/**
 * /api/admin/settings — read/update non-secret app settings.
 * Every action re-verifies the admin role server-side (requireAdmin).
 * Secrets are NEVER readable or writable here — they live in env vars only.
 */
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { jsonError, readJsonBody } from "@/lib/api-helpers";

/** Setting keys the admin UI is allowed to change, with value validators. */
const EDITABLE: Record<string, (v: unknown) => boolean> = {
  site_name: (v) => typeof v === "string" && v.length > 0 && v.length <= 80,
  site_tagline: (v) => typeof v === "string" && v.length <= 200,
  rate_limit_per_hour: (v) => Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 1000,
  enabled_platforms: (v) =>
    Array.isArray(v) &&
    v.every((x) => ["youtube", "instagram", "facebook", "tiktok"].includes(x)),
  allowed_formats: (v) =>
    Array.isArray(v) && v.every((x) => typeof x === "string" && x.length <= 10),
  allowed_qualities: (v) =>
    Array.isArray(v) && v.every((x) => typeof x === "string" && x.length <= 10),
  contact_email: (v) => typeof v === "string" && v.length <= 254,
};

function forbidden() {
  return jsonError(403, "Forbidden: administrator access required.");
}

export async function GET() {
  try {
    const { service } = await requireAdmin({ redirect: false });
    const { data, error } = await service
      .from("app_settings")
      .select("key, value, updated_at")
      .order("key");
    if (error) return jsonError(500, "Could not load settings.");
    return NextResponse.json({ settings: data });
  } catch {
    return forbidden();
  }
}

export async function POST(req: Request) {
  try {
    const { service, user } = await requireAdmin({ redirect: false });

    let body: unknown;
    try {
      body = await readJsonBody(req);
    } catch {
      return jsonError(400, "Request body must be valid JSON.");
    }
    const { key, value } = (body as { key?: unknown; value?: unknown }) ?? {};
    const validate = typeof key === "string" ? EDITABLE[key] : undefined;
    if (!validate || !validate(value)) {
      return jsonError(400, "Invalid setting key or value.");
    }

    const { error } = await service
      .from("app_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) return jsonError(500, "Could not save the setting.");

    await service.from("activity_log").insert({
      actor: user.email ?? user.id,
      action: "setting_updated",
      details: { key },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return forbidden();
  }
}
