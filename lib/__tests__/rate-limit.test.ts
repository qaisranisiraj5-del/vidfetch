/**
 * Unit tests: in-memory rate limiter (lib/rate-limit.ts).
 */
import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, resetRateLimits } from "../rate-limit";

beforeEach(() => resetRateLimits());

describe("checkRateLimit", () => {
  it("allows requests under the limit", () => {
    const r = checkRateLimit("ip:1", 3);
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(2);
    expect(r.limit).toBe(3);
  });

  it("blocks requests over the limit with retry info", () => {
    const now = Date.now();
    for (let i = 0; i < 3; i++) checkRateLimit("ip:2", 3, now);
    const r = checkRateLimit("ip:2", 3, now);
    expect(r.allowed).toBe(false);
    expect(r.remaining).toBe(0);
    expect(r.retryAfterSecs).toBeGreaterThan(0);
    expect(r.retryAfterSecs).toBeLessThanOrEqual(3600);
  });

  it("resets after the window passes", () => {
    const now = Date.now();
    for (let i = 0; i < 2; i++) checkRateLimit("ip:3", 2, now);
    expect(checkRateLimit("ip:3", 2, now).allowed).toBe(false);
    expect(checkRateLimit("ip:3", 2, now + 60 * 60 * 1000 + 1).allowed).toBe(true);
  });

  it("tracks keys independently", () => {
    checkRateLimit("ip:4", 1);
    expect(checkRateLimit("ip:4", 1).allowed).toBe(false);
    expect(checkRateLimit("ip:5", 1).allowed).toBe(true);
  });
});
