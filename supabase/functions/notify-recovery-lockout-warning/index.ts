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
  warning: "#d97706",
  warningLight: "#fef3c7",
};

interface LockoutWarningRequest {
  userId: string;
  userEmail: string;
  attemptsUsed: number;
  maxAttempts: number;
  remainingAttempts: number;
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

    const { 
      attemptsUsed, 
      maxAttempts, 
      remainingAttempts 
    }: LockoutWarningRequest = await req.json();

    // Use user's email from authenticated session
    const userEmail = user.email;
    
    if (!userEmail) {
      return new Response(
        JSON.stringify({ error: "User email not found" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check email rate limit to prevent spam (1 per hour per user)
    const { data: rateLimitData } = await supabase.rpc("check_email_rate_limit", {
      p_email_type: "recovery_lockout_warning",
      p_recipient_email: userEmail,
      p_max_per_hour: 1,
      p_max_per_day: 3,
    });

    const rateLimit = rateLimitData?.[0];
    if (rateLimit && !rateLimit.allowed) {
      console.log("Lockout warning email rate limited for:", userEmail.substring(0, 3) + "***");
      return new Response(
        JSON.stringify({ success: true, rateLimited: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get sender settings
    const senderSettings = await getSenderSettings(supabase);

    // Send warning email
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${senderSettings.senderName} <${senderSettings.senderEmailAlerts}>`,
        to: [userEmail],
        subject: `⚠️ Security Alert: Recovery Code Attempts Warning`,
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
              
              <div style="background: ${BRAND.warningLight}; padding: 16px 20px; border-radius: 12px; margin-bottom: 24px; border-left: 4px solid ${BRAND.warning};">
                <p style="margin: 0; font-size: 14px; color: ${BRAND.warning}; font-weight: 600;">
                  ⚠️ Security Warning
                </p>
              </div>
              
              <h1 style="font-family: 'Georgia', serif; font-size: 28px; font-weight: 400; color: ${BRAND.foreground}; margin: 0 0 24px 0; line-height: 1.3;">
                Recovery Code Attempts Warning
              </h1>
              
              <p style="font-size: 16px; color: ${BRAND.muted}; line-height: 1.7; margin: 0 0 24px 0;">
                We detected multiple failed recovery code verification attempts on your account. 
                You have <strong style="color: ${BRAND.foreground};">${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining</strong> before your account is temporarily locked.
              </p>
              
              <div style="background: ${BRAND.oliveLight}; padding: 20px; border-radius: 12px; margin: 24px 0; border: 1px solid ${BRAND.border};">
                <p style="margin: 0 0 12px 0; font-size: 14px; color: ${BRAND.foreground}; font-weight: 600;">
                  Attempt Summary
                </p>
                <p style="margin: 0; font-size: 14px; color: ${BRAND.muted}; line-height: 1.6;">
                  Attempts used: ${attemptsUsed} of ${maxAttempts}<br>
                  Remaining: ${remainingAttempts}
                </p>
              </div>
              
              <p style="font-size: 16px; color: ${BRAND.foreground}; line-height: 1.7; margin: 24px 0; font-weight: 500;">
                If this wasn't you:
              </p>
              
              <ul style="font-size: 15px; color: ${BRAND.muted}; line-height: 1.8; margin: 0 0 24px 0; padding-left: 20px;">
                <li>Someone may be trying to access your account</li>
                <li>Consider changing your password immediately</li>
                <li>Generate new recovery codes after securing your account</li>
                <li>Contact support if you need assistance</li>
              </ul>
              
              <p style="font-size: 16px; color: ${BRAND.muted}; line-height: 1.7; margin: 24px 0;">
                If this was you and you're having trouble with your recovery codes, make sure you're entering the code exactly as shown, including the hyphen (e.g., XXXX-XXXX).
              </p>
              
              <hr style="border: none; border-top: 1px solid ${BRAND.border}; margin: 40px 0 24px 0;">
              
              <p style="font-size: 12px; color: ${BRAND.oliveMuted}; margin: 0;">
                This security alert was sent to ${userEmail} because recovery code verification attempts were detected on your Buoyancis account.
              </p>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Failed to send lockout warning email:", emailData);
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Record the email send for rate limiting
    await supabase.rpc("record_email_send", {
      p_email_type: "recovery_lockout_warning",
      p_recipient_email: userEmail,
    });

    console.log("Lockout warning email sent to:", userEmail.substring(0, 3) + "***");

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in notify-recovery-lockout-warning:", errorMessage);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
