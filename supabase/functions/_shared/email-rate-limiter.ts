import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface RateLimitResult {
  allowed: boolean;
  hourlyCount: number;
  dailyCount: number;
  retryAfterSeconds: number;
}

interface RateLimitConfig {
  maxPerHour?: number;
  maxPerDay?: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxPerHour: 5,
  maxPerDay: 20,
};

/**
 * Check if an email can be sent based on rate limits.
 * Uses database-backed rate limiting for persistence across cold starts.
 */
export async function checkEmailRateLimit(
  emailType: string,
  recipientEmail: string,
  senderContext?: string,
  config: RateLimitConfig = {}
): Promise<RateLimitResult> {
  const { maxPerHour, maxPerDay } = { ...DEFAULT_CONFIG, ...config };
  
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase credentials for rate limiter");
    // Fail open but log the issue
    return {
      allowed: true,
      hourlyCount: 0,
      dailyCount: 0,
      retryAfterSeconds: 0,
    };
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    const { data, error } = await supabase.rpc("check_email_rate_limit", {
      p_email_type: emailType,
      p_recipient_email: recipientEmail.toLowerCase(),
      p_sender_context: senderContext || null,
      p_max_per_hour: maxPerHour,
      p_max_per_day: maxPerDay,
    });
    
    if (error) {
      console.error("Error checking email rate limit:", error);
      // Fail open on error
      return {
        allowed: true,
        hourlyCount: 0,
        dailyCount: 0,
        retryAfterSeconds: 0,
      };
    }
    
    const result = data?.[0] || {
      allowed: true,
      hourly_count: 0,
      daily_count: 0,
      retry_after_seconds: 0,
    };
    
    return {
      allowed: result.allowed,
      hourlyCount: result.hourly_count,
      dailyCount: result.daily_count,
      retryAfterSeconds: result.retry_after_seconds,
    };
  } catch (err) {
    console.error("Exception in checkEmailRateLimit:", err);
    return {
      allowed: true,
      hourlyCount: 0,
      dailyCount: 0,
      retryAfterSeconds: 0,
    };
  }
}

/**
 * Record that an email was sent for rate limiting purposes.
 * Call this AFTER successfully sending an email.
 */
export async function recordEmailSend(
  emailType: string,
  recipientEmail: string,
  senderContext?: string
): Promise<boolean> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase credentials for rate limiter");
    return false;
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    const { error } = await supabase.rpc("record_email_send", {
      p_email_type: emailType,
      p_recipient_email: recipientEmail.toLowerCase(),
      p_sender_context: senderContext || null,
    });
    
    if (error) {
      console.error("Error recording email send:", error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error("Exception in recordEmailSend:", err);
    return false;
  }
}

/**
 * Combined helper: check rate limit, and if allowed, run the email send function
 * and record the send on success.
 */
export async function withEmailRateLimit<T>(
  emailType: string,
  recipientEmail: string,
  senderContext: string | undefined,
  config: RateLimitConfig,
  sendFn: () => Promise<T>
): Promise<{ success: boolean; data?: T; rateLimited?: boolean; retryAfter?: number }> {
  const rateCheck = await checkEmailRateLimit(emailType, recipientEmail, senderContext, config);
  
  if (!rateCheck.allowed) {
    console.log(`Rate limited: ${emailType} to ${recipientEmail}. Hourly: ${rateCheck.hourlyCount}, Daily: ${rateCheck.dailyCount}`);
    return {
      success: false,
      rateLimited: true,
      retryAfter: rateCheck.retryAfterSeconds,
    };
  }
  
  try {
    const result = await sendFn();
    await recordEmailSend(emailType, recipientEmail, senderContext);
    return { success: true, data: result };
  } catch (err) {
    console.error(`Error sending ${emailType} email:`, err);
    throw err;
  }
}

// Predefined email types for consistency
export const EMAIL_TYPES = {
  PASSWORD_RESET: "password_reset",
  WELCOME: "welcome",
  EARLY_ACCESS_CONFIRMATION: "early_access_confirmation",
  CONTACT_CONFIRMATION: "contact_confirmation",
  SUPPORT: "support",
  BULK_CAMPAIGN: "bulk_campaign",
  TEST_CAMPAIGN: "test_campaign",
  VALIDATION_SUMMARY: "validation_summary",
  ALERT_NOTIFICATION: "alert_notification",
  SIGNUP_NOTIFICATION: "signup_notification",
  FEEDBACK_NOTIFICATION: "feedback_notification",
} as const;

// Predefined rate limit configs for different email types
export const RATE_LIMIT_CONFIGS = {
  // Strict limits for password reset (security-sensitive)
  PASSWORD_RESET: { maxPerHour: 3, maxPerDay: 10 },
  // Welcome emails should be rare
  WELCOME: { maxPerHour: 2, maxPerDay: 5 },
  // User-triggered confirmations
  CONFIRMATION: { maxPerHour: 5, maxPerDay: 15 },
  // Admin notifications can be more frequent
  ADMIN_NOTIFICATION: { maxPerHour: 20, maxPerDay: 100 },
  // Bulk emails have their own management
  BULK: { maxPerHour: 50, maxPerDay: 200 },
} as const;
