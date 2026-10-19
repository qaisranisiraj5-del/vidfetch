/**
 * Central configuration: supported platforms, hostname allowlist,
 * and request limits. No secrets live here.
 */

export type PlatformId = "youtube" | "instagram" | "facebook" | "tiktok";

export interface PlatformConfig {
  id: PlatformId;
  name: string;
  /** Exact hostnames allowed for this platform (lowercase, no port). */
  hostnames: string[];
  /** Shortcode shown in the UI. */
  badge: string;
}

export const PLATFORMS: PlatformConfig[] = [
  {
    id: "youtube",
    name: "YouTube",
    hostnames: [
      "youtube.com",
      "www.youtube.com",
      "m.youtube.com",
      "youtu.be",
      "www.youtu.be",
      "youtube-nocookie.com",
      "www.youtube-nocookie.com",
    ],
    badge: "YouTube",
  },
  {
    id: "instagram",
    name: "Instagram",
    hostnames: ["instagram.com", "www.instagram.com"],
    badge: "Instagram",
  },
  {
    id: "facebook",
    name: "Facebook",
    hostnames: [
      "facebook.com",
      "www.facebook.com",
      "m.facebook.com",
      "fb.watch",
      "www.fb.watch",
      "fb.com",
      "www.fb.com",
    ],
    badge: "Facebook",
  },
  {
    id: "tiktok",
    name: "TikTok",
    hostnames: [
      "tiktok.com",
      "www.tiktok.com",
      "m.tiktok.com",
      "vm.tiktok.com",
      "vt.tiktok.com",
      "www.vm.tiktok.com",
      "www.vt.tiktok.com",
    ],
    badge: "TikTok",
  },
];

/** All allowlisted hostnames, for quick membership checks. */
export const ALLOWED_HOSTNAMES: ReadonlySet<string> = new Set(
  PLATFORMS.flatMap((p) => p.hostnames)
);

export function platformForHostname(hostname: string): PlatformConfig | null {
  const h = hostname.toLowerCase();
  return PLATFORMS.find((p) => p.hostnames.includes(h)) ?? null;
}

/** Request limits. Override RATE_LIMIT_PER_HOUR via env (admin setting wins at runtime). */
export const LIMITS = {
  MAX_URL_LENGTH: 2048,
  DEFAULT_RATE_LIMIT_PER_HOUR: 20,
  UPSTREAM_TIMEOUT_MS: 15_000,
  MAX_RESPONSE_BYTES: 25 * 1024 * 1024, // 25 MB
  MAX_JSON_BODY_BYTES: 16 * 1024, // 16 KB for API request bodies
} as const;
