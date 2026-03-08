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
  success: "#16a34a",
  successLight: "#f0fdf4",
};

interface UnlockRequest {
  userId: string;
  customMessage?: string;
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
    
    // Verify the caller is an admin
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

    // Use service role client for admin check and user lookup
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin role
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { userId, customMessage }: UnlockRequest = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Sanitize custom message (basic HTML escape)
    const sanitizedMessage = customMessage
      ? customMessage
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;")
          .replace(/\n/g, "<br>")
      : null;

    // Get the user's email from auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError || !userData?.user?.email) {
      console.error("Could not find user email:", userError);
      return new Response(
        JSON.stringify({ error: "User email not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userEmail = userData.user.email;

    // Get sender settings
    const senderSettings = await getSenderSettings(supabase);

    // Send unlock notification email
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${senderSettings.senderName} <${senderSettings.senderEmailAlerts}>`,
        to: [userEmail],
        subject: `🔓 Your Account Has Been Unlocked`,
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
              
              <div style="background: ${BRAND.successLight}; padding: 16px 20px; border-radius: 12px; margin-bottom: 24px; border-left: 4px solid ${BRAND.success};">
                <p style="margin: 0; font-size: 14px; color: ${BRAND.success}; font-weight: 600;">
                  🔓 Account Unlocked
                </p>
              </div>
              
              <h1 style="font-family: 'Georgia', serif; font-size: 28px; font-weight: 400; color: ${BRAND.foreground}; margin: 0 0 24px 0; line-height: 1.3;">
                Your Account Access Has Been Restored
              </h1>
              
              <p style="font-size: 16px; color: ${BRAND.muted}; line-height: 1.7; margin: 0 0 24px 0;">
                Good news! An administrator has manually unlocked your account. Your previous recovery code verification attempts have been cleared, and you can now try again.
              </p>
              
              ${sanitizedMessage ? `
              <div style="background: #fff; padding: 20px; border-radius: 12px; margin: 24px 0; border: 1px solid ${BRAND.olive}; border-left: 4px solid ${BRAND.olive};">
                <p style="margin: 0 0 8px 0; font-size: 12px; color: ${BRAND.oliveMuted}; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                  Message from Administrator
                </p>
                <p style="margin: 0; font-size: 15px; color: ${BRAND.foreground}; line-height: 1.6; font-style: italic;">
                  "${sanitizedMessage}"
                </p>
              </div>
              ` : ""}
              
              <div style="background: ${BRAND.oliveLight}; padding: 20px; border-radius: 12px; margin: 24px 0; border: 1px solid ${BRAND.border};">
                <p style="margin: 0 0 8px 0; font-size: 14px; color: ${BRAND.foreground}; font-weight: 600;">
                  What's next?
                </p>
                <p style="margin: 0; font-size: 14px; color: ${BRAND.muted}; line-height: 1.6;">
                  You can now attempt to verify your recovery code again. Make sure to enter the code exactly as shown, including any hyphens.
                </p>
              </div>
              
              <p style="font-size: 16px; color: ${BRAND.foreground}; line-height: 1.7; margin: 24px 0 16px 0; font-weight: 500;">
                Tips for a successful verification:
              </p>
              
              <ul style="font-size: 15px; color: ${BRAND.muted}; line-height: 1.8; margin: 0 0 24px 0; padding-left: 20px;">
                <li>Double-check that you're using the correct recovery code</li>
                <li>Enter the code exactly as shown (case-sensitive)</li>
                <li>If you've lost your recovery codes, contact support for assistance</li>
              </ul>
              
              <hr style="border: none; border-top: 1px solid ${BRAND.border}; margin: 40px 0 24px 0;">
              
              <p style="font-size: 12px; color: ${BRAND.oliveMuted}; margin: 0;">
                This notification was sent to ${userEmail} because an administrator unlocked your Buoyancis account.
              </p>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Failed to send unlock notification email:", emailData);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: emailData }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Log to notification history
    await supabase.from("notification_history").insert({
      notification_type: "account_unlocked",
      recipients: [userEmail],
      subject: "Your Account Has Been Unlocked",
      status: "sent",
      triggered_by: user.id,
    });

    console.log("Account unlock notification sent to:", userEmail.substring(0, 3) + "***");

    return new Response(
      JSON.stringify({ success: true, emailId: emailData.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in notify-account-unlocked:", errorMessage);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
