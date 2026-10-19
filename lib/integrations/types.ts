/**
 * Shared types for the modular platform integration layer.
 *
 * Design rule: integrations are HONEST. A module reports whether it is
 * actually configured (credentials present) and healthy. It returns real
 * results only when an authorized integration can process the URL.
 * Otherwise it returns a clear "not configured / cannot process" message.
 * Nothing here invents download links or bypasses platform restrictions.
 */

import type { PlatformId } from "../config";

export interface IntegrationStatus {
  platform: PlatformId;
  name: string;
  configured: boolean;
  healthy: boolean;
  /** Human-readable state, safe to show publicly. */
  message: string;
}

export interface QualityOption {
  label: string; // e.g. "1080p"
  format: string; // e.g. "mp4"
  /** Note about the option (e.g. "video only"). Safe to display. */
  note?: string;
}

export type FetchOutcome =
  | {
      ok: true;
      title?: string;
      thumbnailUrl?: string;
      durationSecs?: number;
      qualities: QualityOption[];
      /** Message explaining limits (e.g. "metadata only — direct download needs…"). */
      note?: string;
    }
  | {
      ok: false;
      /** Machine-readable code. */
      code:
        | "NOT_CONFIGURED"
        | "UNHEALTHY"
        | "UNSUPPORTED_URL"
        | "NOT_AUTHORIZED"
        | "PROVIDER_ERROR"
        | "TIMEOUT";
      /** Human-readable explanation. */
      message: string;
    };

export interface PlatformIntegration {
  id: PlatformId;
  name: string;
  /** Read env credentials; report configured/healthy honestly. No network required. */
  checkStatus(): Promise<IntegrationStatus>;
  /**
   * Attempt to resolve real download options for a validated URL.
   * Returns ok:false with a clear message unless an authorized
   * integration actually supports the URL. Never invents results.
   */
  fetchMedia(url: string): Promise<FetchOutcome>;
}

/** Helper for the common "not configured" outcome. */
export function notConfigured(name: string, setupHint: string): Extract<FetchOutcome, { ok: false }> {
  return {
    ok: false,
    code: "NOT_CONFIGURED",
    message:
      `${name} downloads aren't available right now: the ${name} integration is not configured. ` +
      setupHint,
  };
}
