/**
 * Unit tests: integrations are HONEST — with no credentials configured,
 * every platform reports "not configured" and returns a clear error.
 * No fake results, ever.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getAllStatuses, INTEGRATIONS } from "../index";

const ENV_KEYS = [
  "YOUTUBE_API_KEY",
  "INSTAGRAM_ACCESS_TOKEN",
  "FACEBOOK_APP_ID",
  "FACEBOOK_APP_SECRET",
  "TIKTOK_CLIENT_KEY",
  "TIKTOK_CLIENT_SECRET",
];

const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of ENV_KEYS) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe("unconfigured integrations", () => {
  it("all four report configured=false", async () => {
    const statuses = await getAllStatuses();
    expect(statuses).toHaveLength(4);
    for (const s of statuses) {
      expect(s.configured).toBe(false);
      expect(s.message.toLowerCase()).toContain("not configured");
      // Public-safe shape only — no secret fields.
      expect(Object.keys(s).sort()).toEqual(
        ["configured", "healthy", "message", "name", "platform"].sort()
      );
    }
  });

  it("fetchMedia returns NOT_CONFIGURED, never fake results", async () => {
    for (const id of Object.keys(INTEGRATIONS) as Array<keyof typeof INTEGRATIONS>) {
      const res = await INTEGRATIONS[id].fetchMedia("https://example.com/video");
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.code).toBe("NOT_CONFIGURED");
        expect(res.message.length).toBeGreaterThan(20);
      }
    }
  });

  it("never leaks credential values into public messages", async () => {
    process.env.YOUTUBE_API_KEY = "sk-secret-value-12345-abcdef";
    process.env.INSTAGRAM_ACCESS_TOKEN = "tok-secret-value-67890-ghijkl";
    const statuses = await getAllStatuses();
    const blob = JSON.stringify(statuses);
    expect(blob).not.toContain("sk-secret-value-12345-abcdef");
    expect(blob).not.toContain("tok-secret-value-67890-ghijkl");
    // ...and fetchMedia errors must not leak them either
    const res = await INTEGRATIONS.youtube.fetchMedia("https://www.youtube.com/watch?v=x");
    expect(JSON.stringify(res)).not.toContain("sk-secret-value-12345-abcdef");
  });
});

describe("configured-but-restricted integrations", () => {
  it("YouTube with a key still refuses to invent downloads", async () => {
    process.env.YOUTUBE_API_KEY = "test-key";
    const res = await INTEGRATIONS.youtube.fetchMedia("https://www.youtube.com/watch?v=x");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe("UNSUPPORTED_URL");
  });

  it("Instagram with a token refuses unauthorized media", async () => {
    process.env.INSTAGRAM_ACCESS_TOKEN = "test-token";
    const res = await INTEGRATIONS.instagram.fetchMedia("https://www.instagram.com/p/x/");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe("NOT_AUTHORIZED");
  });
});
