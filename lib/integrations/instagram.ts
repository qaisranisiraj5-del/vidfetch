/**
 * Instagram integration.
 *
 * Honest state: Instagram's official APIs (Meta Graph API) only expose
 * media the authenticated user owns or is explicitly authorized to access.
 * There is no authorized way to download arbitrary public Instagram posts.
 * This module reports "configured" only when INSTAGRAM_ACCESS_TOKEN is
 * present, and refuses to fabricate results otherwise.
 */

import type {
  FetchOutcome,
  IntegrationStatus,
  PlatformIntegration,
} from "./types";
import { notConfigured } from "./types";

const SETUP_HINT =
  "An administrator can configure it by connecting a Meta developer app " +
  "and adding an authorized user token (INSTAGRAM_ACCESS_TOKEN). Only " +
  "media the token owner is authorized to access can ever be processed.";

export const instagramIntegration: PlatformIntegration = {
  id: "instagram",
  name: "Instagram",

  async checkStatus(): Promise<IntegrationStatus> {
    const configured = Boolean(process.env.INSTAGRAM_ACCESS_TOKEN?.trim());
    return {
      platform: "instagram",
      name: "Instagram",
      configured,
      healthy: false,
      message: configured
        ? "Access token present. Health not yet verified against the live API."
        : "Not configured — no Instagram access token has been added. " + SETUP_HINT,
    };
  },

  async fetchMedia(): Promise<FetchOutcome> {
    if (!process.env.INSTAGRAM_ACCESS_TOKEN?.trim()) {
      return notConfigured("Instagram", SETUP_HINT);
    }
    return {
      ok: false,
      code: "NOT_AUTHORIZED",
      message:
        "Instagram only allows access to media the connected account owns or " +
        "is authorized to see. We can't generate download options for this " +
        "link with the current integration.",
    };
  },
};
