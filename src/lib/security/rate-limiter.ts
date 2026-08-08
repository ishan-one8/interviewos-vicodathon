import { NextRequest, NextResponse } from "next/server";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

/**
 * Process-Local Sliding Window Rate Limiter for InterviewOS
 *
 * ARCHITECTURAL LIMITATIONS:
 * - This rate limiter operates in-memory per Node process / Vercel Serverless Function instance.
 * - Serverless instances may not share memory across concurrent lambdas.
 * - This provides zero-cost, lightweight protection against rapid burst abuse on single instances
 *   without requiring paid external infrastructure (e.g. Upstash Redis / Vercel KV).
 * - Limits are set generously to ensure legitimate hackathon judge demo traffic is never broken.
 */
class ProcessLocalRateLimiter {
  private requests = new Map<string, RateLimitRecord>();
  private readonly cleanupIntervalMs = 60_000;
  private lastCleanup = Date.now();

  private getClientIp(req: NextRequest): string {
    const forwardedFor = req.headers.get("x-forwarded-for");
    if (forwardedFor) {
      return forwardedFor.split(",")[0].trim();
    }
    const realIp = req.headers.get("x-real-ip");
    if (realIp) {
      return realIp.trim();
    }
    return "127.0.0.1";
  }

  private cleanup(now: number) {
    if (now - this.lastCleanup < this.cleanupIntervalMs) return;
    this.lastCleanup = now;
    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetAt) {
        this.requests.delete(key);
      }
    }
  }

  public check(
    req: NextRequest,
    endpointKey: string,
    maxRequests: number = 60,
    windowMs: number = 60_000
  ): { allowed: boolean; remaining: number; resetAfterSec: number } {
    // Bypass rate limiting in test mode to maintain automated test suite speed
    if (process.env.NODE_ENV === "test" || process.env.BYPASS_RATE_LIMIT === "true") {
      return { allowed: true, remaining: maxRequests, resetAfterSec: 0 };
    }

    const now = Date.now();
    this.cleanup(now);

    const ip = this.getClientIp(req);
    const key = `${endpointKey}:${ip}`;

    const record = this.requests.get(key);

    if (!record || now > record.resetAt) {
      this.requests.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: maxRequests - 1, resetAfterSec: Math.ceil(windowMs / 1000) };
    }

    if (record.count >= maxRequests) {
      const resetAfterSec = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
      return { allowed: false, remaining: 0, resetAfterSec };
    }

    record.count += 1;
    const resetAfterSec = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    return { allowed: true, remaining: maxRequests - record.count, resetAfterSec };
  }

  public resetForTesting() {
    this.requests.clear();
  }
}

export const rateLimiter = new ProcessLocalRateLimiter();

export function guardRateLimit(
  req: NextRequest,
  endpointKey: string,
  maxRequests: number = 60,
  windowMs: number = 60_000
): NextResponse | null {
  const result = rateLimiter.check(req, endpointKey, maxRequests, windowMs);
  if (!result.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: "RATE_LIMITED",
        message: "Too many requests. Please slow down and try again shortly.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(result.resetAfterSec),
          "X-RateLimit-Limit": String(maxRequests),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }
  return null;
}
