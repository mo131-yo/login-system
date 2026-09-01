import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  throw new Error(
    "UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN орчны хувьсагч тохируулаагүй байна (.env.local) — Upstash дашбоардаас (upstash.com, үнэгүй tier) авна уу"
  );
}

const redis = new Redis({ url, token });

/**
 * Fixed-window rate limit, Upstash Redis дээр хадгалагддаг тул serverless
 * олон instance хооронд хуваалцагдана (in-memory-ийн адилгүй).
 */
export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(limit, `${windowMs} ms`),
    prefix: "ratelimit",
  });

  const { success } = await ratelimit.limit(key);
  return success;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
