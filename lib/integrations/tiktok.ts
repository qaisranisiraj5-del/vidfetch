/**
 * TikTok integration.
 *
 * Honest state: TikTok's official Research/Display APIs are limited to
 * approved use cases and authorized accounts. There is no authorized way
 * to download arbitrary TikTok videos. This module reports "configured"
 * only when TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET are both present,
 * and refuses to fabricate results.
 */

import type {
  FetchOutcome,
  IntegrationStatus,
  PlatformIntegration,
} from "./types";
import { notConfigured } from "./types";

const SETUP_HINT =
  "An administrator can configure it by registering a TikTok developer app " +
  "and adding its credentials (TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET). " +
  "Only media the app is authorized to access can ever be processed.";

export const tiktokIntegration: PlatformIntegration = {
  id: "tiktok",
  name: "TikTok",

  async checkStatus(): Promise<IntegrationStatus> {
    const configured = Boolean(
      process.env.TIKTOK_CLIENT_KEY?.trim() && process.env.TIKTOK_CLIENT_SECRET?.trim()
    );
    return {
      platform: "tiktok",
      name: "TikTok",
      configured,
      healthy: false,
      message: configured
        ? "App credentials present. Health not yet verified against the live API."
        : "Not configured — no TikTok app credentials have been added. " + SETUP_HINT,
    };
  },

  async fetchMedia(): Promise<FetchOutcome> {
    if (
      !process.env.TIKTOK_CLIENT_KEY?.trim() ||
      !process.env.TIKTOK_CLIENT_SECRET?.trim()
    ) {
      return notConfigured("TikTok", SETUP_HINT);
    }
    return {
      ok: false,
      code: "NOT_AUTHORIZED",
      message:
        "TikTok only allows access to media the connected app is authorized " +
        "to see. We can't generate download options for this link with the " +
        "current integration.",
    };
  },
};
