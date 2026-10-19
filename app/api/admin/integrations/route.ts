/**
 * /api/admin/integrations — toggle platform enablement (admin only).
 * This flips the site's enabled_platforms setting; actual API credentials
 * remain in environment variables and are never exposed here.
 */
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { jsonError, readJsonBody } from "@/lib/api-helpers";
import { PLATFORMS } from "@/lib/config";

const IDS = new Set(PLATFORMS.map((p) => p.id));

export async function POST(req: Request) {
  try {
    const { service, user } = await requireAdmin({ redirect: false });

    let body: unknown;
    try {
      body = await readJsonBody(req);
    } catch {
      return jsonError(400, "Request body must be valid JSON.");
    }
    const { platform, enabled } = (body as { platform?: unknown; enabled?: unknown }) ?? {};
    if (typeof platform !== "string" || !IDS.has(platform as never) || typeof enabled !== "boolean") {
      return jsonError(400, "Invalid platform or enabled flag.");
    }

    const { data: row } = await service
      .from("app_settings")
      .select("value")
      .eq("key", "enabled_platforms")
      .single();
    const current: string[] = Array.isArray(row?.value) ? row.value : [];
    const next = enabled
      ? [...new Set([...current, platform])]
      : current.filter((p) => p !== platform);

    const { error } = await service
      .from("app_settings")
      .upsert(
        { key: "enabled_platforms", value: next, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );
    if (error) return jsonError(500, "Could not update the integration.");

    await service.from("activity_log").insert({
      actor: user.email ?? user.id,
      action: enabled ? "integration_enabled" : "integration_disabled",
      details: { platform },
    });

    return NextResponse.json({ ok: true, enabled_platforms: next });
  } catch {
    return jsonError(403, "Forbidden: administrator access required.");
  }
}
