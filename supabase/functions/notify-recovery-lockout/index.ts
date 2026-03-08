import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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
  destructive: "#dc2626",
  destructiveLight: "#fef2f2",
};

interface LockoutRequest {
  retryAfterMinutes: number;
}

interface SenderSettings {
  senderName: string;
  senderEmailAlerts: string;
}

// deno-lint-ignore no-explicit-any
const getSenderSettings = async (supabase: any): Promise<SenderSettings> => {
  try {
    const { data } = await supabase
      .from("escalation_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["sender_name", "sender_email_alerts"]);

    const settings: SenderSettings = {
      senderName: "Buoyancis Security",
      senderEmailAlerts: "alerts@buoyancis.com",
    };

    // deno-lint-ignore no-explicit-any
    data?.forEach((item: any) => {
      if (item.setting_key === "sender_name") settings.senderName = item.setting_value;
      if (item.setting_key === "sender_email_alerts") settings.senderEmailAlerts = item.setting_value;
    });

    return settings;
  } catch (error) {
    console.error("Error fetching sender settings:", error);
    return { senderName: "Buoyancis Security", senderEmailAlerts: "alerts@buoyancis.com" };
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    // Verify the user's JWT
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { retryAfterMinutes }: LockoutRequest = await req.json();

    const userEmail = user.email;
    
    if (!userEmail) {
      return new Response(
        JSON.stringify({ error: "User email not found" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check email rate limit to prevent spam (1 per 15 min per user)
    const { data: rateLimitData } = await supabase.rpc("check_email_rate_limit", {
      p_email_type: "recovery_lockout",
      p_recipient_email: userEmail,
      p_max_per_hour: 4,
      p_max_per_day: 10,
    });

    const rateLimit = rateLimitData?.[0];
    if (rateLimit && !rateLimit.allowed) {
      console.log("Lockout email rate limited for:", userEmail.substring(0, 3) + "***");
      return new Response(
        JSON.stringify({ success: true, rateLimited: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get sender settings
    const senderSettings = await getSenderSettings(supabase);

    // Send lockout notification email
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${senderSettings.senderName} <${senderSettings.senderEmailAlerts}>`,
        to: [userEmail],
        subject: `🔒 Security Alert: Account Temporarily Locked`,
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
              
              <div style="background: ${BRAND.destructiveLight}; padding: 16px 20px; border-radius: 12px; margin-bottom: 24px; border-left: 4px solid ${BRAND.destructive};">
                <p style="margin: 0; font-size: 14px; color: ${BRAND.destructive}; font-weight: 600;">
                  🔒 Account Temporarily Locked
                </p>
              </div>
              
              <h1 style="font-family: 'Georgia', serif; font-size: 28px; font-weight: 400; color: ${BRAND.foreground}; margin: 0 0 24px 0; line-height: 1.3;">
                Too Many Failed Recovery Code Attempts
              </h1>
              
              <p style="font-size: 16px; color: ${BRAND.muted}; line-height: 1.7; margin: 0 0 24px 0;">
                Your account has been temporarily locked due to multiple failed recovery code verification attempts. 
                This is a security measure to protect your account.
              </p>
              
              <div style="background: ${BRAND.oliveLight}; padding: 20px; border-radius: 12px; margin: 24px 0; border: 1px solid ${BRAND.border};">
                <p style="margin: 0 0 8px 0; font-size: 14px; color: ${BRAND.foreground}; font-weight: 600;">
                  When can I try again?
                </p>
                <p style="margin: 0; font-size: 14px; color: ${BRAND.muted}; line-height: 1.6;">
                  You can try again in approximately <strong style="color: ${BRAND.foreground};">${retryAfterMinutes} minute${retryAfterMinutes !== 1 ? 's' : ''}</strong>.
                </p>
              </div>
              
              <p style="font-size: 16px; color: ${BRAND.foreground}; line-height: 1.7; margin: 24px 0; font-weight: 500;">
                Was this you?
              </p>
              
              <p style="font-size: 15px; color: ${BRAND.muted}; line-height: 1.7; margin: 0 0 16px 0;">
                <strong style="color: ${BRAND.foreground};">If yes:</strong> Wait for the lockout period to expire, then try again with your correct recovery code. Make sure you're entering the code exactly as shown, including the hyphen.
              </p>
              
              <p style="font-size: 15px; color: ${BRAND.muted}; line-height: 1.7; margin: 0 0 24px 0;">
                <strong style="color: ${BRAND.foreground};">If no:</strong> Someone may be attempting to access your account. We strongly recommend:
              </p>
              
              <ul style="font-size: 15px; color: ${BRAND.muted}; line-height: 1.8; margin: 0 0 24px 0; padding-left: 20px;">
                <li>Change your password immediately</li>
                <li>Generate new recovery codes</li>
                <li>Review your account's recent activity</li>
                <li>Enable additional security measures</li>
              </ul>
              
              <hr style="border: none; border-top: 1px solid ${BRAND.border}; margin: 40px 0 24px 0;">
              
              <p style="font-size: 12px; color: ${BRAND.oliveMuted}; margin: 0;">
                This security alert was sent to ${userEmail} because your Buoyancis account was temporarily locked due to failed recovery code attempts.
              </p>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Failed to send lockout notification email:", emailData);
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Record the email send for rate limiting
    await supabase.rpc("record_email_send", {
      p_email_type: "recovery_lockout",
      p_recipient_email: userEmail,
    });

    console.log("Lockout notification email sent to:", userEmail.substring(0, 3) + "***");

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in notify-recovery-lockout:", errorMessage);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
