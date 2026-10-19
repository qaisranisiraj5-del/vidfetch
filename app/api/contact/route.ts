/**
 * POST /api/contact — store a visitor message in the activity log
 * (visible to the admin in /admin/activity). Validated, rate-limited.
 */
import { LIMITS } from "@/lib/config";
import { checkRateLimit } from "@/lib/rate-limit";
import { clientIp, jsonError, readJsonBody } from "@/lib/api-helpers";
import { getServiceSupabase } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await readJsonBody(req);
  } catch {
    return jsonError(400, "Request body must be valid JSON.");
  }
  const { name, email, message } = (body as Record<string, unknown>) ?? {};

  if (
    typeof name !== "string" || name.trim().length === 0 || name.length > 120 ||
    typeof email !== "string" || !EMAIL_RE.test(email) || email.length > 254 ||
    typeof message !== "string" || message.trim().length === 0 || message.length > 5000
  ) {
    return jsonError(400, "Please provide a valid name, email, and message.");
  }

  const rl = checkRateLimit(
    `contact:${clientIp(req)}`,
    Number(process.env.RATE_LIMIT_PER_HOUR) || LIMITS.DEFAULT_RATE_LIMIT_PER_HOUR
  );
  if (!rl.allowed) return jsonError(429, "Too many messages. Please try again later.");

  const service = getServiceSupabase();
  if (!service) {
    return jsonError(
      503,
      "Messaging isn't available right now (database not configured). Please try again later."
    );
  }

  const { error } = await service.from("activity_log").insert({
    actor: "visitor",
    action: "contact_message",
    details: {
      name: name.trim().slice(0, 120),
      email: email.trim().slice(0, 254),
      message: message.trim().slice(0, 5000),
    },
  });
  if (error) {
    console.error("contact insert failed:", error.message);
    return jsonError(500, "Could not send your message. Please try again later.");
  }
  return NextResponse.json({ ok: true });
}
