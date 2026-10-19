/**
 * GET /api/integrations — public integration status.
 * Returns configured/healthy/message ONLY. Never secrets.
 */
import { NextResponse } from "next/server";
import { getAllStatuses } from "@/lib/integrations";

export async function GET() {
  const statuses = await getAllStatuses();
  return NextResponse.json({
    integrations: statuses.map((s) => ({
      platform: s.platform,
      name: s.name,
      configured: s.configured,
      healthy: s.healthy,
      message: s.message,
    })),
  });
}
