/**
 * Facebook integration.
 *
 * Honest state: the Meta Graph API only exposes videos the authenticated
 * app/user is authorized to access (own Pages, granted permissions).
 * There is no authorized way to download arbitrary Facebook videos.
 * This module reports "configured" only when FACEBOOK_APP_ID and
 * FACEBOOK_APP_SECRET are both present, and refuses to fabricate results.
 */

import type {
  FetchOutcome,
  IntegrationStatus,
  PlatformIntegration,
} from "./types";
import { notConfigured } from "./types";

const SETUP_HINT =
  "An administrator can configure it by creating a Meta developer app and " +
  "adding its credentials (FACEBOOK_APP_ID and FACEBOOK_APP_SECRET). Only " +
  "videos the app is authorized to access can ever be processed.";

export const facebookIntegration: PlatformIntegration = {
  id: "facebook",
  name: "Facebook",

  async checkStatus(): Promise<IntegrationStatus> {
    const configured = Boolean(
      process.env.FACEBOOK_APP_ID?.trim() && process.env.FACEBOOK_APP_SECRET?.trim()
    );
    return {
      platform: "facebook",
      name: "Facebook",
      configured,
      healthy: false,
      message: configured
        ? "App credentials present. Health not yet verified against the live API."
        : "Not configured — no Facebook app credentials have been added. " + SETUP_HINT,
    };
  },

  async fetchMedia(): Promise<FetchOutcome> {
    if (
      !process.env.FACEBOOK_APP_ID?.trim() ||
      !process.env.FACEBOOK_APP_SECRET?.trim()
    ) {
      return notConfigured("Facebook", SETUP_HINT);
    }
    return {
      ok: false,
      code: "NOT_AUTHORIZED",
      message:
        "Facebook only allows access to videos the connected app is " +
        "authorized to see. We can't generate download options for this " +
        "link with the current integration.",
    };
  },
};
