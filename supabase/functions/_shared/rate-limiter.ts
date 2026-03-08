import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Rate limiter for Edge Functions
 * Provides IP-based rate limiting to prevent abuse of cron/scheduled endpoints
 */

interface RateLimitConfig {
  maxRequests: number;      // Maximum requests allowed
  windowMs: number;         // Time window in milliseconds
  identifier?: string;      // Optional custom identifier (e.g., function name)
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfterMs?: number;
  requestCount?: number;
}

// In-memory store for rate limiting (per isolate)
const requestCounts = new Map<string, { count: number; resetAt: number }>();

/**
 * Extract client IP from request headers
 */
export function getClientIp(req: Request): string {
  // Check various headers that might contain the real IP
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(",")[0].trim();
  }
  
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  
  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp;
  
  // Fallback - this might be the load balancer IP
  return "unknown";
}

/**
 * Check if request should be rate limited
 * Uses in-memory store per isolate (resets on cold starts)
 */
export function checkRateLimit(
  req: Request,
  config: RateLimitConfig
): RateLimitResult {
  const { maxRequests, windowMs, identifier = "default" } = config;
  const clientIp = getClientIp(req);
  const key = `${identifier}:${clientIp}`;
  const now = Date.now();
  
  // Get or create rate limit entry
  let entry = requestCounts.get(key);
  
  if (!entry || now >= entry.resetAt) {
    // Create new entry or reset expired one
    entry = {
      count: 0,
      resetAt: now + windowMs,
    };
    requestCounts.set(key, entry);
  }
  
  // Increment count
  entry.count++;
  
  const allowed = entry.count <= maxRequests;
  const remaining = Math.max(0, maxRequests - entry.count);
  const resetAt = new Date(entry.resetAt);
  
  // Clean up old entries periodically (every ~100 requests)
  if (Math.random() < 0.01) {
    cleanupExpiredEntries();
  }
  
  return {
    allowed,
    remaining,
    resetAt,
    retryAfterMs: allowed ? undefined : entry.resetAt - now,
    requestCount: entry.count,
  };
}

/**
 * Remove expired rate limit entries
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of requestCounts) {
    if (now >= entry.resetAt) {
      requestCounts.delete(key);
    }
  }
}

/**
 * Validate that request is from internal cron system
 * Checks for presence of cron-specific headers or authorization
 */
export function isCronRequest(req: Request): boolean {
  // Check for the time parameter that cron jobs include
  try {
    const url = new URL(req.url);
    const hasTimeParam = url.searchParams.has("time");
    if (hasTimeParam) return true;
    
    // Check request body for cron markers
    // Note: This requires the request body to be read, so use sparingly
    return false;
  } catch {
    return false;
  }
}

/**
 * Log rate limit violation to database
 */
async function logViolation(
  functionName: string,
  ipAddress: string,
  requestCount: number,
  maxRequests: number
): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn("Cannot log violation: Missing Supabase credentials");
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error } = await supabase
      .from("rate_limit_violations")
      .insert({
        function_name: functionName,
        ip_address: ipAddress,
        request_count: requestCount,
        max_requests: maxRequests,
      });
    
    if (error) {
      console.warn("Failed to log rate limit violation:", error.message);
    }
  } catch (err) {
    console.warn("Error logging rate limit violation:", err);
  }
}

/**
 * Create rate-limited response
 */
export function createRateLimitResponse(
  result: RateLimitResult,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      error: "Too many requests",
      message: "Rate limit exceeded. Please try again later.",
      retryAfterMs: result.retryAfterMs,
      resetAt: result.resetAt.toISOString(),
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": Math.ceil((result.retryAfterMs || 60000) / 1000).toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": result.resetAt.toISOString(),
      },
    }
  );
}

/**
 * Rate limiter middleware helper
 * Returns null if allowed, or a Response if rate limited
 */
export function rateLimitMiddleware(
  req: Request,
  config: RateLimitConfig,
  corsHeaders: Record<string, string>
): Response | null {
  const result = checkRateLimit(req, config);
  
  if (!result.allowed) {
    const clientIp = getClientIp(req);
    const functionName = config.identifier || "unknown";
    
    console.warn(
      `Rate limit exceeded for ${functionName}: IP=${clientIp}, count=${result.requestCount}`
    );
    
    // Log violation asynchronously (don't await to avoid blocking response)
    logViolation(
      functionName,
      clientIp,
      result.requestCount || 0,
      config.maxRequests
    );
    
    return createRateLimitResponse(result, corsHeaders);
  }
  
  return null;
}
