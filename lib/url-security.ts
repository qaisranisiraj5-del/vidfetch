/**
 * URL validation, normalization, and SSRF prevention for /api/fetch.
 *
 * Rules:
 *  - http/https schemes only
 *  - hostname must be on the supported-platform allowlist
 *  - the hostname's DNS A/AAAA records are resolved and EVERY resolved IP
 *    must be a public address (rejects private, loopback, link-local,
 *    reserved, multicast, and CGNAT ranges) — this closes the classic
 *    DNS-rebinding / internal-service SSRF hole
 *  - maximum URL length enforced
 *
 * The DNS lookup function is injectable so unit tests can run offline.
 */

import { promises as dns } from "node:dns";
import { createHash } from "node:crypto";
import {
  LIMITS,
  platformForHostname,
  type PlatformConfig,
} from "./config";

export type DnsLookup = (
  hostname: string
) => Promise<Array<{ address: string; family: number }>>;

const defaultLookup: DnsLookup = (hostname) =>
  dns.lookup(hostname, { all: true, verbatim: true });

export interface ValidUrl {
  ok: true;
  platform: PlatformConfig;
  /** Normalized https URL. */
  url: string;
  /** sha256 hex of the normalized URL — safe to store/log. */
  urlHash: string;
}

export interface InvalidUrl {
  ok: false;
  /** Machine-readable code, safe to return to clients. */
  code:
    | "EMPTY_URL"
    | "URL_TOO_LONG"
    | "INVALID_URL"
    | "UNSUPPORTED_SCHEME"
    | "UNSUPPORTED_PLATFORM"
    | "UNRESOLVABLE_HOST"
    | "PRIVATE_ADDRESS";
  /** Human-readable, non-technical message. */
  message: string;
}

export type UrlValidation = ValidUrl | InvalidUrl;

/**
 * Returns true when the IP literal is NOT a publicly routable address.
 * Covers IPv4 and IPv6 private/reserved ranges.
 */
export function isNonPublicIp(ip: string): boolean {
  const v = ip.trim().toLowerCase();

  // IPv6 ---------------------------------------------------------------
  if (v.includes(":")) {
    // Expand :: shorthand to full form for prefix checks.
    const expanded = expandIpv6(v);
    if (!expanded) return true; // unparseable -> treat as unsafe
    if (expanded === "00000000000000000000000000000001") return true; // ::1 loopback
    if (/^0+$/.test(expanded)) return true; // :: unspecified
    if (expanded.startsWith("fe80")) return true; // fe80::/10 link-local
    if (expanded.startsWith("fc") || expanded.startsWith("fd")) return true; // fc00::/7 unique-local
    if (expanded.startsWith("ff")) return true; // ff00::/8 multicast
    if (expanded.startsWith("20010db8")) return true; // 2001:db8::/32 documentation
    // IPv4-mapped IPv6 (::ffff:a.b.c.d) — check the embedded v4 part.
    const mapped = v.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isNonPublicIp(mapped[1]);
    return false;
  }

  // IPv4 ---------------------------------------------------------------
  const parts = v.split(".");
  if (parts.length !== 4) return true;
  const n = parts.map((p) => {
    if (!/^\d+$/.test(p)) return NaN;
    return parseInt(p, 10);
  });
  if (n.some((x) => Number.isNaN(x) || x < 0 || x > 255)) return true;
  const [a, b] = n;

  if (a === 10) return true; // 10.0.0.0/8
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 127) return true; // 127.0.0.0/8 loopback
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local (incl. cloud metadata)
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
  if (a === 192 && b === 0 && n[2] === 0) return true; // 192.0.0.0/24
  if (a === 192 && b === 0 && n[2] === 2) return true; // 192.0.2.0/24 TEST-NET-1
  if (a === 198 && b === 51 && n[2] === 100) return true; // 198.51.100.0/24 TEST-NET-2
  if (a === 203 && b === 0 && n[2] === 113) return true; // 203.0.113.0/24 TEST-NET-3
  if (a >= 224 && a <= 239) return true; // 224.0.0.0/4 multicast
  if (a >= 240) return true; // 240.0.0.0/4 reserved
  return false;
}

/** Expand an IPv6 address to 32 hex chars (no colons). Returns null if invalid. */
function expandIpv6(ip: string): string | null {
  // Split off any zone id.
  const addr = ip.split("%")[0];
  const halves = addr.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  const tail = halves[1] ? halves[1].split(":") : [];
  // Handle embedded IPv4 in the tail (e.g. ::ffff:192.0.2.1).
  const groups: string[] = [];
  for (const g of [...head, ...tail]) {
    if (g.includes(".")) {
      const v4 = g.split(".").map((x) => parseInt(x, 10));
      if (v4.length !== 4 || v4.some((x) => Number.isNaN(x) || x < 0 || x > 255))
        return null;
      groups.push(
        ((v4[0] << 8) | v4[1]).toString(16).padStart(4, "0"),
        ((v4[2] << 8) | v4[3]).toString(16).padStart(4, "0")
      );
    } else {
      if (!/^[0-9a-f]{1,4}$/.test(g)) return null;
      groups.push(g.padStart(4, "0"));
    }
  }
  if (halves.length === 1 && groups.length !== 8) return null;
  if (groups.length > 8) return null;
  const missing = 8 - groups.length;
  const full = [...head.map((g) => g.padStart(4, "0"))]
    .concat(Array(missing).fill("0000"))
    .concat(tail.map((g) => g.padStart(4, "0")));
  return full.join("").slice(0, 32);
}

/** sha256 hex digest of a string. Used for storing/logging URLs safely. */
export function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/**
 * Validate and normalize a user-submitted media URL.
 * Never throws for bad input — returns a structured InvalidUrl instead.
 */
export async function validateMediaUrl(
  raw: unknown,
  lookup: DnsLookup = defaultLookup
): Promise<UrlValidation> {
  if (typeof raw !== "string" || raw.trim().length === 0) {
    return {
      ok: false,
      code: "EMPTY_URL",
      message: "Please paste a video URL first.",
    };
  }
  const trimmed = raw.trim();
  if (trimmed.length > LIMITS.MAX_URL_LENGTH) {
    return {
      ok: false,
      code: "URL_TOO_LONG",
      message: `That URL is too long (max ${LIMITS.MAX_URL_LENGTH} characters).`,
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      ok: false,
      code: "INVALID_URL",
      message: "That doesn't look like a valid URL. Please check it and try again.",
    };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return {
      ok: false,
      code: "UNSUPPORTED_SCHEME",
      message: "Only http:// and https:// links are supported.",
    };
  }

  const hostname = parsed.hostname.toLowerCase();
  const platform = platformForHostname(hostname);
  if (!platform) {
    return {
      ok: false,
      code: "UNSUPPORTED_PLATFORM",
      message:
        "This link isn't from a supported platform. We currently support YouTube, Instagram, Facebook, and TikTok links.",
    };
  }

  // SSRF guard: resolve the hostname and require every address to be public.
  let addresses: Array<{ address: string; family: number }>;
  try {
    addresses = await lookup(hostname);
  } catch {
    return {
      ok: false,
      code: "UNRESOLVABLE_HOST",
      message: "We couldn't reach that link's host. Please check the URL and try again.",
    };
  }
  if (!addresses || addresses.length === 0) {
    return {
      ok: false,
      code: "UNRESOLVABLE_HOST",
      message: "We couldn't reach that link's host. Please check the URL and try again.",
    };
  }
  for (const a of addresses) {
    if (isNonPublicIp(a.address)) {
      return {
        ok: false,
        code: "PRIVATE_ADDRESS",
        message: "That link resolves to a private or internal address, which we can't process.",
      };
    }
  }

  // Normalize: force https, strip default ports, keep path/query/fragment.
  parsed.protocol = "https:";
  if (
    (parsed.protocol === "https:" && parsed.port === "443") ||
    (parsed.protocol === "http:" && parsed.port === "80")
  ) {
    parsed.port = "";
  }
  const url = parsed.toString();

  return { ok: true, platform, url, urlHash: sha256Hex(url) };
}
