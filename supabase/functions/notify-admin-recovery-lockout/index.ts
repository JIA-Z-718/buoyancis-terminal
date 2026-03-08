import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AdminLockoutAlertRequest {
  userId: string;
  userEmail: string;
  failedAttempts: number;
  lockoutMinutes: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, userEmail, failedAttempts, lockoutMinutes }: AdminLockoutAlertRequest = 
      await req.json();

    if (!userId) {
      throw new Error("Missing required userId");
    }

    // Create Supabase client to fetch admin notification recipients
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch admin alert recipients from escalation_settings
    const { data: alertSettings } = await supabase
      .from("escalation_settings")
      .select("setting_value")
      .eq("setting_key", "alert_recipients")
      .single();

    const adminEmails = alertSettings?.setting_value
      ? alertSettings.setting_value.split(",").map((e: string) => e.trim()).filter(Boolean)
      : [];

    if (adminEmails.length === 0) {
      console.log("No admin alert recipients configured, skipping notification");
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "No admin recipients configured" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch sender email from settings
    const { data: senderSettings } = await supabase
      .from("escalation_settings")
      .select("setting_value")
      .eq("setting_key", "alert_sender_email")
      .single();

    const senderEmail = senderSettings?.setting_value || "alerts@buoyancis.com";
    const timestamp = new Date().toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const emailResponse = await resend.emails.send({
      from: `Security Alerts <${senderEmail}>`,
      to: adminEmails,
      subject: `🔒 Account Lockout Alert - Recovery Code Abuse Detected`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🔒 Account Lockout Alert</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 12px 12px;">
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="margin: 0; color: #991b1b; font-weight: 600;">
                ⚠️ A user has been locked out due to excessive failed recovery code attempts.
              </p>
            </div>

            <h2 style="color: #374151; font-size: 16px; margin-bottom: 16px;">Incident Details</h2>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tr>
                <td style="padding: 12px; background: #f9fafb; border: 1px solid #e5e5e5; font-weight: 600; width: 40%;">User ID</td>
                <td style="padding: 12px; background: #ffffff; border: 1px solid #e5e5e5; font-family: monospace; font-size: 13px;">${userId}</td>
              </tr>
              <tr>
                <td style="padding: 12px; background: #f9fafb; border: 1px solid #e5e5e5; font-weight: 600;">User Email</td>
                <td style="padding: 12px; background: #ffffff; border: 1px solid #e5e5e5;">${userEmail || "Unknown"}</td>
              </tr>
              <tr>
                <td style="padding: 12px; background: #f9fafb; border: 1px solid #e5e5e5; font-weight: 600;">Failed Attempts</td>
                <td style="padding: 12px; background: #ffffff; border: 1px solid #e5e5e5; color: #dc2626; font-weight: 600;">${failedAttempts || "10+"}</td>
              </tr>
              <tr>
                <td style="padding: 12px; background: #f9fafb; border: 1px solid #e5e5e5; font-weight: 600;">Lockout Duration</td>
                <td style="padding: 12px; background: #ffffff; border: 1px solid #e5e5e5;">${lockoutMinutes || 60} minutes</td>
              </tr>
              <tr>
                <td style="padding: 12px; background: #f9fafb; border: 1px solid #e5e5e5; font-weight: 600;">Detected At</td>
                <td style="padding: 12px; background: #ffffff; border: 1px solid #e5e5e5;">${timestamp}</td>
              </tr>
            </table>

            <h2 style="color: #374151; font-size: 16px; margin-bottom: 12px;">Recommended Actions</h2>
            <ul style="color: #4b5563; padding-left: 20px; margin-bottom: 24px;">
              <li style="margin-bottom: 8px;">Review the user's account for signs of compromise</li>
              <li style="margin-bottom: 8px;">Check if this is a legitimate user having trouble or potential abuse</li>
              <li style="margin-bottom: 8px;">Consider contacting the user if their email is known</li>
              <li style="margin-bottom: 8px;">Use the admin dashboard to reset their attempt count if appropriate</li>
            </ul>
            
            <div style="text-align: center; margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e5e5;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                This is an automated security alert from Buoyancis.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Admin lockout alert sent successfully:", emailResponse);

    // Log to notification history
    await supabase.from("notification_history").insert({
      notification_type: "admin_recovery_lockout_alert",
      recipients: adminEmails,
      subject: `Account Lockout Alert - User ${userId.slice(0, 8)}...`,
      status: "sent",
    });

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in notify-admin-recovery-lockout function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
