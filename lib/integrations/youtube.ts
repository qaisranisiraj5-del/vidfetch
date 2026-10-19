/**
 * YouTube integration.
 *
 * Honest state: there is no official YouTube API for downloading videos.
 * The YouTube Data API v3 (key-based) can look up public video metadata,
 * but it cannot produce download links, and downloading YouTube content
 * is restricted by YouTube's Terms of Service. This module therefore:
 *  - reports "configured" only when YOUTUBE_API_KEY is present,
 *  - and even then only offers metadata lookup — it never fabricates
 *    download options.
 */

import type {
  FetchOutcome,
  IntegrationStatus,
  PlatformIntegration,
} from "./types";
import { notConfigured } from "./types";

const SETUP_HINT =
  "An administrator can configure it by adding a YouTube Data API v3 key " +
  "(YOUTUBE_API_KEY). Even when configured, only public video metadata can " +
  "be shown — YouTube does not offer an official download API, and " +
  "downloading is subject to YouTube's Terms of Service.";

export const youtubeIntegration: PlatformIntegration = {
  id: "youtube",
  name: "YouTube",

  async checkStatus(): Promise<IntegrationStatus> {
    const configured = Boolean(process.env.YOUTUBE_API_KEY?.trim());
    return {
      platform: "youtube",
      name: "YouTube",
      configured,
      // Health would be verified by a live API call; without attempting one
      // we report honestly that it is untested.
      healthy: false,
      message: configured
        ? "API key present. Health not yet verified against the live API."
        : "Not configured — no YouTube API key has been added. " + SETUP_HINT,
    };
  },

  async fetchMedia(): Promise<FetchOutcome> {
    if (!process.env.YOUTUBE_API_KEY?.trim()) {
      return notConfigured("YouTube", SETUP_HINT);
    }
    // Even with a key, there is no authorized download path to offer.
    return {
      ok: false,
      code: "UNSUPPORTED_URL",
      message:
        "YouTube doesn't provide an official way to download videos, so we " +
        "can't generate download options for this link. Public video " +
        "metadata lookup may be added by an administrator in the future.",
    };
  },
};
