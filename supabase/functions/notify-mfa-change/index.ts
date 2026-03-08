import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface MFAChangeRequest {
  action: "enabled" | "disabled";
  userEmail: string;
  userName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the JWT and get user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Invalid authorization token");
    }

    // Verify user is an admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      throw new Error("Unauthorized: Admin access required");
    }

    const { action, userEmail, userName }: MFAChangeRequest = await req.json();

    if (!action || !userEmail) {
      throw new Error("Missing required fields: action and userEmail");
    }

    // Get sender settings from escalation_settings
    const { data: senderSettings } = await supabase
      .from("escalation_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["sender_name", "alerts_email"]);

    const senderName = senderSettings?.find(s => s.setting_key === "sender_name")?.setting_value || "Buoyancis";
    const alertsEmail = senderSettings?.find(s => s.setting_key === "alerts_email")?.setting_value || "alerts@buoyancis.com";

    // Get admin recipients for security notifications
    const { data: recipientSetting } = await supabase
      .from("escalation_settings")
      .select("setting_value")
      .eq("setting_key", "escalation_recipients")
      .single();

    let recipients: string[] = [];
    if (recipientSetting?.setting_value) {
      try {
        recipients = JSON.parse(recipientSetting.setting_value);
      } catch {
        recipients = [recipientSetting.setting_value];
      }
    }

    // Always include the user's own email
    if (!recipients.includes(userEmail)) {
      recipients.push(userEmail);
    }

    if (recipients.length === 0) {
      console.log("No recipients configured for MFA change notifications");
      return new Response(
        JSON.stringify({ success: true, message: "No recipients configured" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const actionText = action === "enabled" ? "enabled" : "disabled";
    const actionColor = action === "enabled" ? "#22c55e" : "#ef4444";
    const actionIcon = action === "enabled" ? "🔒" : "🔓";
    const displayName = userName || userEmail;
    const timestamp = new Date().toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Georgia', serif; background-color: #faf9f7; margin: 0; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <!-- Header -->
            <div style="background-color: #5a6f3c; padding: 32px; text-align: center;">
              <img src="https://i.imgur.com/nTpVGYt.png" alt="Buoyancis" style="height: 40px; margin-bottom: 16px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: normal;">
                ${actionIcon} MFA ${action === "enabled" ? "Enabled" : "Disabled"}
              </h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 32px;">
              <div style="background-color: ${actionColor}15; border-left: 4px solid ${actionColor}; padding: 16px 20px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #374151; font-size: 16px;">
                  Two-factor authentication has been <strong style="color: ${actionColor};">${actionText}</strong> for an admin account.
                </p>
              </div>
              
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; width: 120px;">Account</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #111827; font-weight: 500;">${displayName}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Email</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #111827;">${userEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Action</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="display: inline-block; padding: 4px 12px; background-color: ${actionColor}20; color: ${actionColor}; border-radius: 9999px; font-size: 14px; font-weight: 500;">
                      MFA ${actionText}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #6b7280;">Timestamp</td>
                  <td style="padding: 12px 0; color: #111827;">${timestamp}</td>
                </tr>
              </table>
              
              ${action === "disabled" ? `
              <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 16px 20px; border-radius: 8px; margin-bottom: 24px;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>⚠️ Security Notice:</strong> Disabling MFA reduces account security. If this action was not authorized, please contact your administrator immediately.
                </p>
              </div>
              ` : `
              <div style="background-color: #dcfce7; border: 1px solid #22c55e; padding: 16px 20px; border-radius: 8px; margin-bottom: 24px;">
                <p style="margin: 0; color: #166534; font-size: 14px;">
                  <strong>✓ Security Enhanced:</strong> This account now requires two-factor authentication for access, providing an additional layer of security.
                </p>
              </div>
              `}
              
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                This is an automated security notification. If you did not make this change, please secure your account immediately.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                This notification was sent by ${senderName} Security
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email via Resend API
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${senderName} Security <${alertsEmail}>`,
        to: recipients,
        subject: `🔐 MFA ${action === "enabled" ? "Enabled" : "Disabled"} - ${displayName}`,
        html: emailHtml,
      }),
    });

    const emailResult = await resendResponse.json();

    if (!resendResponse.ok) {
      throw new Error(emailResult.message || "Failed to send email");
    }

    console.log("MFA change notification sent:", emailResult);

    // Log to notification_history
    await supabase.from("notification_history").insert({
      notification_type: "mfa_change",
      recipients: recipients,
      subject: `MFA ${actionText} for ${displayName}`,
      status: "sent",
      triggered_by: user.id,
    });

    return new Response(
      JSON.stringify({ success: true, emailId: emailResult.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in notify-mfa-change:", error);
    
    // Try to log the failure
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      await supabase.from("notification_history").insert({
        notification_type: "mfa_change",
        recipients: [],
        subject: "MFA change notification failed",
        status: "failed",
        error_message: error.message,
      });
    } catch (logError) {
      console.error("Failed to log notification failure:", logError);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
