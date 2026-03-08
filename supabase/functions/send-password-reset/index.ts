import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { rateLimitMiddleware } from "../_shared/rate-limiter.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Rate limit: 3 requests per 15 minutes per IP to prevent abuse
const RATE_LIMIT_CONFIG = {
  maxRequests: 3,
  windowMs: 15 * 60 * 1000, // 15 minutes
  identifier: "send-password-reset",
};

// Email-based rate limit: 3 requests per hour per email address
const EMAIL_RATE_LIMIT = {
  maxRequests: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
};

// In-memory store for email-based rate limiting
const emailRateLimitStore = new Map<string, { count: number; resetAt: number }>();

// Clean up expired entries periodically
const cleanupEmailRateLimitStore = () => {
  const now = Date.now();
  for (const [email, data] of emailRateLimitStore.entries()) {
    if (now > data.resetAt) {
      emailRateLimitStore.delete(email);
    }
  }
};

// Check email-based rate limit
const checkEmailRateLimit = (email: string): { allowed: boolean; retryAfterMs?: number } => {
  cleanupEmailRateLimitStore();
  
  const normalizedEmail = email.toLowerCase().trim();
  const now = Date.now();
  const existing = emailRateLimitStore.get(normalizedEmail);
  
  if (!existing || now > existing.resetAt) {
    // First request or window expired - reset counter
    emailRateLimitStore.set(normalizedEmail, {
      count: 1,
      resetAt: now + EMAIL_RATE_LIMIT.windowMs,
    });
    return { allowed: true };
  }
  
  if (existing.count >= EMAIL_RATE_LIMIT.maxRequests) {
    // Rate limit exceeded
    return { 
      allowed: false, 
      retryAfterMs: existing.resetAt - now 
    };
  }
  
  // Increment counter
  existing.count++;
  return { allowed: true };
};

// Brand colors
const BRAND = {
  olive: "#5a6f3c",
  oliveLight: "#e8ecd9",
  oliveMuted: "#8fa06f",
  foreground: "#2d2f27",
  muted: "#6b6d64",
  background: "#fcfcfa",
  border: "#e0e2d8",
};

interface PasswordResetRequest {
  email: string;
}

interface SenderSettings {
  senderName: string;
  senderEmailNoreply: string;
}

// deno-lint-ignore no-explicit-any
const getSenderSettings = async (supabase: any): Promise<SenderSettings> => {
  try {
    const { data } = await supabase
      .from("escalation_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["sender_name", "sender_email_noreply"]);

    const settings: SenderSettings = {
      senderName: "Buoyancis",
      senderEmailNoreply: "noreply@buoyancis.com",
    };

    // deno-lint-ignore no-explicit-any
    data?.forEach((item: any) => {
      if (item.setting_key === "sender_name") settings.senderName = item.setting_value;
      if (item.setting_key === "sender_email_noreply") settings.senderEmailNoreply = item.setting_value;
    });

    return settings;
  } catch (error) {
    console.error("Error fetching sender settings:", error);
    return { senderName: "Buoyancis", senderEmailNoreply: "noreply@buoyancis.com" };
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Apply IP-based rate limiting first
  const rateLimitResponse = rateLimitMiddleware(req, RATE_LIMIT_CONFIG, corsHeaders);
  if (rateLimitResponse) {
    console.warn("Password reset IP rate limit exceeded");
    return rateLimitResponse;
  }

  try {
    const { email }: PasswordResetRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Apply email-based rate limiting
    const emailRateLimit = checkEmailRateLimit(email);
    if (!emailRateLimit.allowed) {
      const retryAfterSeconds = Math.ceil((emailRateLimit.retryAfterMs || 0) / 1000);
      console.warn(`Password reset email rate limit exceeded for: ${email.substring(0, 3)}***`);
      return new Response(
        JSON.stringify({ 
          error: "Too many password reset requests for this email. Please try again later." 
        }),
        { 
          status: 429, 
          headers: { 
            "Content-Type": "application/json",
            "Retry-After": String(retryAfterSeconds),
            ...corsHeaders 
          } 
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get sender settings
    const senderSettings = await getSenderSettings(supabase);

    // Generate password reset link using Supabase Auth Admin API
    const { data, error: resetError } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: email,
      options: {
        redirectTo: `${req.headers.get("origin") || "https://buoyancis.com"}/reset-password`,
      },
    });

    if (resetError) {
      // Don't reveal if user exists or not for security
      console.log("Password reset request processed for:", email);
      // Return success even if user doesn't exist (security best practice)
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // If user exists, send the email
    if (data?.properties?.action_link) {
      const resetUrl = data.properties.action_link;

      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: `${senderSettings.senderName} <${senderSettings.senderEmailNoreply}>`,
          to: [email],
          subject: "Reset your password",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; background-color: ${BRAND.background}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
              <div style="max-width: 560px; margin: 0 auto; padding: 48px 24px;">
                <h2 style="font-family: 'Georgia', serif; font-size: 24px; color: ${BRAND.olive}; margin-bottom: 32px; font-weight: 500;">Buoyancis</h2>
                
                <h1 style="font-family: 'Georgia', serif; font-size: 28px; font-weight: 400; color: ${BRAND.foreground}; margin: 0 0 24px 0; line-height: 1.3;">
                  Reset your password
                </h1>
                
                <p style="font-size: 16px; color: ${BRAND.muted}; line-height: 1.7; margin: 0 0 24px 0;">
                  We received a request to reset the password for your account. Click the button below to set a new password.
                </p>
                
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${resetUrl}" style="display: inline-block; background-color: ${BRAND.olive}; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 500;">
                    Reset Password
                  </a>
                </div>
                
                <div style="background: ${BRAND.oliveLight}; padding: 20px; border-radius: 12px; margin: 24px 0; border: 1px solid ${BRAND.border};">
                  <p style="margin: 0; font-size: 14px; color: ${BRAND.muted}; line-height: 1.6;">
                    <strong style="color: ${BRAND.foreground};">Security tip:</strong> This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
                  </p>
                </div>
                
                <p style="font-size: 14px; color: ${BRAND.muted}; line-height: 1.7; margin: 24px 0 0 0;">
                  If the button doesn't work, copy and paste this link into your browser:
                </p>
                <p style="font-size: 12px; color: ${BRAND.oliveMuted}; word-break: break-all; margin: 8px 0 0 0;">
                  ${resetUrl}
                </p>
                
                <hr style="border: none; border-top: 1px solid ${BRAND.border}; margin: 40px 0 24px 0;">
                
                <p style="font-size: 12px; color: ${BRAND.oliveMuted}; margin: 0;">
                  This email was sent to ${email} because a password reset was requested for your Buoyancis account.
                </p>
              </div>
            </body>
            </html>
          `,
        }),
      });

      const emailData = await emailResponse.json();

      if (!emailResponse.ok) {
        console.error("Failed to send password reset email:", emailData);
        return new Response(
          JSON.stringify({ error: "Failed to send email" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      console.log("Password reset email sent successfully to:", email);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-password-reset function:", errorMessage);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
