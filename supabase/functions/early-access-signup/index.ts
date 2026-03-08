import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-client-timestamp, x-client-challenge",
};

// Progressive rate limiting with escalating penalties
const rateLimitMap = new Map<string, { count: number; resetTime: number; violations: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 requests per minute per IP
const VIOLATION_PENALTY_MULTIPLIER = 2; // Each violation doubles the lockout time
const MAX_LOCKOUT_MS = 24 * 60 * 60 * 1000; // Max 24 hour lockout

// Suspicious user agent patterns (common bots and automation tools)
const SUSPICIOUS_USER_AGENTS = [
  /curl/i,
  /wget/i,
  /python-requests/i,
  /python-urllib/i,
  /java\//i,
  /libwww/i,
  /httpclient/i,
  /httpunit/i,
  /go-http-client/i,
  /scrapy/i,
  /node-fetch/i,
  /axios/i,
  /phantom/i,
  /headless/i,
  /selenium/i,
  /webdriver/i,
  /puppeteer/i,
  /playwright/i,
];

// Minimum time (ms) for a human to reasonably fill the form
const MIN_FORM_FILL_TIME_MS = 2000; // 2 seconds minimum

// Helper to log bot detection events
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function logBotDetectionEvent(
  supabase: any,
  eventType: 'honeypot' | 'timing' | 'captcha_failure' | 'suspicious_ua' | 'challenge_failure' | 'rate_limit' | 'ip_blocked' | 'geo_blocked',
  ip: string,
  userAgent: string | null,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    await supabase.from("bot_detection_events").insert({
      event_type: eventType,
      ip_address: ip,
      user_agent: userAgent,
      details: details || null,
    });
  } catch (error) {
    console.error("Failed to log bot detection event:", error);
  }
}

// Lookup IP geolocation using ip-api.com (free tier)
async function getIpGeolocation(ip: string): Promise<{ country: string; countryCode: string; region: string; city: string } | null> {
  if (ip === "unknown" || ip === "127.0.0.1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
    return null; // Skip local/private IPs
  }
  
  try {
    const response = await fetch(`https://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city`);
    const data = await response.json();
    
    if (data.status === "success") {
      return {
        country: data.country,
        countryCode: data.countryCode,
        region: data.regionName,
        city: data.city,
      };
    }
    return null;
  } catch (error) {
    console.error("Failed to lookup IP geolocation:", error);
    return null;
  }
}

// Check if a location is geo-restricted
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function isGeoRestricted(
  supabase: any,
  countryCode: string,
  region: string | null
): Promise<{ blocked: boolean; reason?: string }> {
  try {
    // First check for exact region match (if region provided)
    if (region) {
      const { data: regionRestriction } = await supabase
        .from("geo_restrictions")
        .select("id, reason")
        .eq("country_code", countryCode)
        .eq("region", region)
        .eq("is_blocked", true)
        .maybeSingle();
      
      if (regionRestriction) {
        return { blocked: true, reason: regionRestriction.reason };
      }
    }
    
    // Then check for country-wide restriction (null region means all regions)
    const { data: countryRestriction } = await supabase
      .from("geo_restrictions")
      .select("id, reason")
      .eq("country_code", countryCode)
      .is("region", null)
      .eq("is_blocked", true)
      .maybeSingle();
    
    if (countryRestriction) {
      return { blocked: true, reason: countryRestriction.reason };
    }
    
    return { blocked: false };
  } catch (error) {
    console.error("Error checking geo restrictions:", error);
    return { blocked: false }; // Fail open to not block legitimate users
  }
}

function isRateLimited(ip: string): { limited: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    // Reset or create new record
    const violations = record?.violations || 0;
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS, violations });
    return { limited: false };
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    // Calculate penalty based on violations
    const penaltyMs = Math.min(
      RATE_LIMIT_WINDOW_MS * Math.pow(VIOLATION_PENALTY_MULTIPLIER, record.violations),
      MAX_LOCKOUT_MS
    );
    
    // Increment violations for next time
    record.violations = Math.min(record.violations + 1, 10); // Cap at 10 violations
    record.resetTime = now + penaltyMs;
    
    const retryAfter = Math.ceil(penaltyMs / 1000);
    return { limited: true, retryAfter };
  }
  
  record.count++;
  return { limited: false };
}

// Check for suspicious user agent
function isSuspiciousUserAgent(userAgent: string | null): boolean {
  if (!userAgent || userAgent.length < 10) {
    return true; // Missing or too short user agent is suspicious
  }
  
  return SUSPICIOUS_USER_AGENTS.some(pattern => pattern.test(userAgent));
}

// Get matched pattern for suspicious UA
function getMatchedUAPattern(userAgent: string | null): string | null {
  if (!userAgent) return "missing";
  if (userAgent.length < 10) return "too_short";
  
  for (const pattern of SUSPICIOUS_USER_AGENTS) {
    if (pattern.test(userAgent)) {
      return pattern.toString().replace(/\//g, '').replace(/i$/, '');
    }
  }
  return null;
}

// Validate timing - check if form was filled too quickly
function isFormFilledTooFast(clientTimestamp: string | null): boolean {
  if (!clientTimestamp) {
    return false; // If no timestamp provided, don't block (backwards compatibility)
  }
  
  try {
    const formOpenedAt = parseInt(clientTimestamp, 10);
    const now = Date.now();
    const timeTaken = now - formOpenedAt;
    
    return timeTaken < MIN_FORM_FILL_TIME_MS;
  } catch {
    return false;
  }
}

// Simple challenge verification - client must compute a simple hash
function verifyChallenge(challenge: string | null, email: string): boolean {
  if (!challenge) {
    return true; // Backwards compatibility - don't block if not present
  }
  
  try {
    // Expected challenge: first 8 chars of email reversed + length
    const expected = email.slice(0, 8).split('').reverse().join('') + email.length.toString();
    return challenge === expected;
  } catch {
    return false;
  }
}

// Verify Cloudflare Turnstile token
async function verifyTurnstileToken(token: string, ip: string): Promise<{ success: boolean; error?: string; errorCodes?: string[] }> {
  const turnstileSecretKey = Deno.env.get("TURNSTILE_SECRET_KEY");
  
  if (!turnstileSecretKey) {
    console.warn("TURNSTILE_SECRET_KEY not configured - skipping verification");
    return { success: true }; // Backwards compatibility
  }
  
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: turnstileSecretKey,
        response: token,
        remoteip: ip,
      }),
    });
    
    const result = await response.json();
    
    if (!result.success) {
      console.warn(`Turnstile verification failed: ${JSON.stringify(result["error-codes"])}`);
      return { success: false, error: "Security verification failed", errorCodes: result["error-codes"] };
    }
    
    return { success: true };
  } catch (error) {
    console.error("Turnstile verification error:", error);
    return { success: false, error: "Security verification unavailable" };
  }
}

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Common disposable email domains to flag (not block, but log)
const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail.com', 'throwaway.email', 'guerrillamail.com', 'mailinator.com',
  '10minutemail.com', 'temp-mail.org', 'fakeinbox.com', 'getnada.com'
];

// Known spam/throwaway domains - actively blocked
const SPAM_EMAIL_DOMAINS = [
  // Disposable email services
  'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwawaymail.com',
  '10minutemail.com', 'yopmail.com', 'trashmail.com', 'sharklasers.com',
  'guerrillamail.net', 'guerrillamail.org', 'spam4.me', 'grr.la',
  'dispostable.com', 'maildrop.cc', 'fakeinbox.com', 'getairmail.com',
  'mohmal.com', 'tempail.com', 'temp-mail.org', 'getnada.com', 'emailondeck.com',
  'crazymailing.com', 'mailnesia.com', 'inboxkitten.com', 'throwaway.email',
  'mintemail.com', 'jetable.org', 'spamgourmet.com', 'mytemp.email',
  'tempinbox.com', 'tempmailaddress.com', 'burnermail.io', 'mailsac.com',
  // Common test domains
  'test.com', 'example.com', 'sample.com', 'fake.com', 'nomail.com',
  // Known spam patterns
  'mailnator.com', 'emailfake.com', 'fakemailgenerator.com', 'tempmailo.com',
];

// Common email providers and their typo variants
const EMAIL_TYPO_MAP: Record<string, string[]> = {
  'gmail.com': [
    'gmai.com', 'gmial.com', 'gmal.com', 'gmil.com', 'gmaill.com', 'gamil.com',
    'gnail.com', 'gmali.com', 'gmaiil.com', 'gmaik.com', 'gmaio.com', 'gmaol.com',
    'gmail.con', 'gmail.co', 'gmail.cm', 'gmail.om', 'gmail.cim', 'gmail.vom',
    'gmailcom', 'gmail.comm', 'gmail.cpm', 'g.mail.com', 'gmaul.com', 'gmeil.com',
    'gemail.com', 'gimail.com', 'gomail.com', 'hmail.com', 'fmail.com',
  ],
  'yahoo.com': [
    'yaho.com', 'yahooo.com', 'yahho.com', 'yhaoo.com', 'yaoo.com', 'yhoo.com',
    'yahoo.con', 'yahoo.co', 'yahoo.cm', 'yahoo.cim', 'yahoo.vom', 'yahoocom',
    'yahoo.comm', 'yaho.co', 'yahooo.con', 'yahoo.om', 'yehoo.com', 'yahop.com',
  ],
  'hotmail.com': [
    'hotmai.com', 'hotmal.com', 'hotmial.com', 'hotmil.com', 'hotamil.com',
    'hotmail.con', 'hotmail.co', 'hotmail.cm', 'hotmailcom', 'hotmail.comm',
    'hotmail.cim', 'homail.com', 'htmail.com', 'hotmael.com', 'hotmaill.com',
  ],
  'outlook.com': [
    'outloo.com', 'outlok.com', 'outlool.com', 'outloook.com', 'oulook.com',
    'outlook.con', 'outlook.co', 'outlook.cm', 'outlookcom', 'outlook.comm',
    'outllook.com', 'outlokk.com', 'otlook.com', 'outlok.com', 'outook.com',
  ],
  'icloud.com': [
    'iclod.com', 'icoud.com', 'icloud.con', 'icloud.co', 'icloud.cm', 'icloudcom',
    'icloud.comm', 'iclooud.com', 'iclould.com', 'icluod.com', 'iclud.com',
  ],
  'aol.com': [
    'aol.con', 'aol.co', 'aol.cm', 'aolcom', 'aol.comm', 'ao.com', 'aool.com',
  ],
  'live.com': [
    'live.con', 'live.co', 'live.cm', 'livecom', 'live.comm', 'liv.com', 'livee.com',
  ],
  'msn.com': [
    'msn.con', 'msn.co', 'msn.cm', 'msncom', 'msn.comm', 'mn.com', 'mns.com',
  ],
  'protonmail.com': [
    'protonmai.com', 'protonmal.com', 'protonmail.con', 'protonmail.co',
    'protonmailcom', 'protonmail.comm', 'protonmaill.com', 'protomail.com',
  ],
};

// Get all typo domains for quick lookup
const TYPO_DOMAINS = new Set(Object.values(EMAIL_TYPO_MAP).flat());

// Function to find suggested correction for typo domain
function getSuggestedDomain(domain: string): string | null {
  for (const [correct, typos] of Object.entries(EMAIL_TYPO_MAP)) {
    if (typos.includes(domain)) {
      return correct;
    }
  }
  return null;
}

// Log email domain validation events
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function logEmailDomainEvent(
  supabase: any,
  eventType: 'spam_domain' | 'typo_domain',
  ip: string,
  userAgent: string | null,
  details: Record<string, unknown>
): Promise<void> {
  try {
    await supabase.from("bot_detection_events").insert({
      event_type: eventType,
      ip_address: ip,
      user_agent: userAgent,
      details,
    });
  } catch (error) {
    console.error("Failed to log email domain event:", error);
  }
}

function validateEmail(email: string): { 
  valid: boolean; 
  sanitized: string; 
  error?: string; 
  isDisposable?: boolean;
  isSpamDomain?: boolean;
  typoSuggestion?: string;
} {
  if (!email || typeof email !== "string") {
    return { valid: false, sanitized: "", error: "Email is required" };
  }
  
  const sanitized = email.trim().toLowerCase();
  
  if (sanitized.length > 254) {
    return { valid: false, sanitized, error: "Email is too long" };
  }
  
  if (!EMAIL_REGEX.test(sanitized)) {
    return { valid: false, sanitized, error: "Invalid email format" };
  }
  
  const domain = sanitized.split('@')[1];
  
  // Check for spam domains (actively blocked)
  if (SPAM_EMAIL_DOMAINS.includes(domain)) {
    return { 
      valid: false, 
      sanitized, 
      error: "Please use a valid email address from a recognized provider",
      isSpamDomain: true 
    };
  }
  
  // Check for typo domains (blocked with suggestion)
  if (TYPO_DOMAINS.has(domain)) {
    const suggestion = getSuggestedDomain(domain);
    const suggestedEmail = suggestion ? sanitized.replace(domain, suggestion) : null;
    return { 
      valid: false, 
      sanitized, 
      error: suggestion 
        ? `Did you mean ${suggestedEmail}? Please check your email address.`
        : "Please check your email domain for typos",
      typoSuggestion: suggestedEmail || undefined
    };
  }
  
  // Check for disposable email (log but don't block)
  const isDisposable = DISPOSABLE_EMAIL_DOMAINS.some(d => domain === d || domain.endsWith('.' + d));
  
  return { valid: true, sanitized, isDisposable };
}

function validateName(name: string | undefined, fieldName: string, required: boolean): { valid: boolean; sanitized: string; error?: string } {
  if (!name || typeof name !== "string") {
    if (required) {
      return { valid: false, sanitized: "", error: `${fieldName} is required` };
    }
    return { valid: true, sanitized: "" };
  }
  
  const sanitized = name.trim();
  
  if (sanitized.length > 100) {
    return { valid: false, sanitized, error: `${fieldName} is too long (max 100 characters)` };
  }
  
  // Check for suspicious patterns (SQL injection attempts, script tags)
  const suspiciousPatterns = /<script|javascript:|onclick|onerror|<\/|DROP\s+TABLE|UNION\s+SELECT|INSERT\s+INTO/i;
  if (suspiciousPatterns.test(sanitized)) {
    return { valid: false, sanitized, error: `Invalid ${fieldName}` };
  }
  
  return { valid: true, sanitized };
}

interface SignupRequest {
  email: string;
  firstName: string;
  lastName?: string;
  honeypot?: string;
  turnstileToken?: string; // Cloudflare Turnstile CAPTCHA token
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Create Supabase client with service role to bypass RLS
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Get client IP for rate limiting
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
               req.headers.get("cf-connecting-ip") || 
               "unknown";
    
    const userAgent = req.headers.get("user-agent");
    const clientTimestamp = req.headers.get("x-client-timestamp");
    const clientChallenge = req.headers.get("x-client-challenge");
    
    // Check IP blocklist first
    if (ip !== "unknown") {
      const { data: blockedIp } = await supabase
        .from("ip_blocklist")
        .select("id")
        .eq("ip_address", ip)
        .maybeSingle();
      
      if (blockedIp) {
        console.warn(`Blocked IP attempted signup: ${ip}`);
        await logBotDetectionEvent(supabase, 'ip_blocked', ip, userAgent, { reason: 'ip_blocklist' });
        // Return success to not alert the blocked user
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      
      // Check geographic restrictions
      const geoLocation = await getIpGeolocation(ip);
      if (geoLocation) {
        const geoRestriction = await isGeoRestricted(supabase, geoLocation.countryCode, geoLocation.region);
        if (geoRestriction.blocked) {
          console.warn(`Geo-blocked signup attempt from ${geoLocation.country} (${geoLocation.countryCode}), IP: ${ip}`);
          await logBotDetectionEvent(supabase, 'geo_blocked', ip, userAgent, { 
            country: geoLocation.country,
            country_code: geoLocation.countryCode,
            region: geoLocation.region,
            city: geoLocation.city,
            reason: geoRestriction.reason
          });
          // Return success to not alert the blocked user
          return new Response(
            JSON.stringify({ success: true }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
      }
    }
    
    // Check for suspicious user agent
    if (isSuspiciousUserAgent(userAgent)) {
      console.warn(`Suspicious user agent from IP: ${ip}, UA: ${userAgent}`);
      const matchedPattern = getMatchedUAPattern(userAgent);
      await logBotDetectionEvent(supabase, 'suspicious_ua', ip, userAgent, { matched_pattern: matchedPattern });
      // Return success to not alert the bot
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    // Check if form was filled too fast (bot behavior)
    if (isFormFilledTooFast(clientTimestamp)) {
      console.warn(`Form filled too fast from IP: ${ip} (timestamp: ${clientTimestamp})`);
      const timeTaken = clientTimestamp ? Date.now() - parseInt(clientTimestamp, 10) : null;
      await logBotDetectionEvent(supabase, 'timing', ip, userAgent, { time_taken_ms: timeTaken, threshold_ms: MIN_FORM_FILL_TIME_MS });
      // Return success to not alert the bot
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    // Check progressive rate limit
    const rateLimitResult = isRateLimited(ip);
    if (rateLimitResult.limited) {
      console.warn(`Rate limit exceeded for IP: ${ip} (retry after: ${rateLimitResult.retryAfter}s)`);
      await logBotDetectionEvent(supabase, 'rate_limit', ip, userAgent, { retry_after_seconds: rateLimitResult.retryAfter });
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { 
          status: 429, 
          headers: { 
            "Content-Type": "application/json", 
            "Retry-After": String(rateLimitResult.retryAfter || 60),
            ...corsHeaders 
          } 
        }
      );
    }

    const body: SignupRequest = await req.json();
    
    // Honeypot check - if the hidden field has a value, it's a bot
    if (body.honeypot && body.honeypot.trim() !== "") {
      console.warn(`Bot detected via honeypot from IP: ${ip}`);
      await logBotDetectionEvent(supabase, 'honeypot', ip, userAgent, { honeypot_value_length: body.honeypot.length });
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    // Verify Cloudflare Turnstile CAPTCHA
    if (body.turnstileToken) {
      const turnstileResult = await verifyTurnstileToken(body.turnstileToken, ip);
      if (!turnstileResult.success) {
        console.warn(`Turnstile verification failed from IP: ${ip}`);
        await logBotDetectionEvent(supabase, 'captcha_failure', ip, userAgent, { error_codes: turnstileResult.errorCodes });
        return new Response(
          JSON.stringify({ error: turnstileResult.error || "Security verification failed" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    } else {
      // No token provided - log but allow (for backwards compatibility)
      console.info(`No Turnstile token provided from IP: ${ip}`);
    }

    // Validate email
    const emailValidation = validateEmail(body.email);
    if (!emailValidation.valid) {
      // Log spam domain or typo domain events
      if (emailValidation.isSpamDomain) {
        const domain = emailValidation.sanitized.split('@')[1];
        await logEmailDomainEvent(supabase, 'spam_domain', ip, userAgent, { 
          domain, 
          email_hint: emailValidation.sanitized.slice(0, 3) + '***@' + domain 
        });
        console.warn(`Spam domain blocked from IP: ${ip}, domain: ${domain}`);
      } else if (emailValidation.typoSuggestion) {
        const domain = emailValidation.sanitized.split('@')[1];
        const suggestedDomain = emailValidation.typoSuggestion.split('@')[1];
        await logEmailDomainEvent(supabase, 'typo_domain', ip, userAgent, { 
          original_domain: domain, 
          suggested_domain: suggestedDomain,
          email_hint: emailValidation.sanitized.slice(0, 3) + '***@' + domain 
        });
        console.info(`Typo domain detected from IP: ${ip}, ${domain} -> ${suggestedDomain}`);
      }
      
      return new Response(
        JSON.stringify({ 
          error: emailValidation.error,
          suggestion: emailValidation.typoSuggestion 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    // Verify client challenge
    if (!verifyChallenge(clientChallenge, emailValidation.sanitized)) {
      console.warn(`Challenge verification failed from IP: ${ip}`);
      await logBotDetectionEvent(supabase, 'challenge_failure', ip, userAgent, { email_hint: emailValidation.sanitized.slice(0, 3) + '***' });
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate first name (required)
    const firstNameValidation = validateName(body.firstName, "First name", true);
    if (!firstNameValidation.valid) {
      return new Response(
        JSON.stringify({ error: firstNameValidation.error }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate last name (optional)
    const lastNameValidation = validateName(body.lastName, "Last name", false);
    if (!lastNameValidation.valid) {
      return new Response(
        JSON.stringify({ error: lastNameValidation.error }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    // Log disposable email usage (but don't block)
    if (emailValidation.isDisposable) {
      console.info(`Disposable email used from IP: ${ip}, email domain: ${emailValidation.sanitized.split('@')[1]}`);
    }

    // Insert the signup
    const { data, error } = await supabase
      .from("early_access_signups")
      .insert({
        email: emailValidation.sanitized,
        first_name: firstNameValidation.sanitized,
        last_name: lastNameValidation.sanitized || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        // Duplicate email - return success to not leak information
        return new Response(
          JSON.stringify({ success: true, duplicate: true }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to process signup" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Early access signup: ${emailValidation.sanitized}`);

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("Error in early-access-signup:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
