import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RoleChangeRequest {
  targetUserId: string;
  targetUserName: string;
  action: "assigned" | "revoked";
  role: string;
  actorName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the requesting user is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: requestingUser }, error: authError } = await anonClient.auth.getUser();
    if (authError || !requestingUser) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: roleData } = await anonClient
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      throw new Error("Admin access required");
    }

    const { targetUserId, targetUserName, action, role, actorName }: RoleChangeRequest = await req.json();

    if (!targetUserId || !action || !role) {
      throw new Error("Missing required fields");
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch alert recipients and role change setting from escalation_settings
    const { data: alertSettings } = await serviceClient
      .from("escalation_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["alert_recipients", "sender_name", "alerts_email", "notify_role_changes_enabled"]);

    const settingsMap = new Map(
      (alertSettings || []).map((s: { setting_key: string; setting_value: string }) => [s.setting_key, s.setting_value])
    );

    const recipientsStr = settingsMap.get("alert_recipients") || "";
    const recipients = recipientsStr.split(",").map((e: string) => e.trim()).filter((e: string) => e);
    const roleChangesEnabled = settingsMap.get("notify_role_changes_enabled") !== "false";

    if (!roleChangesEnabled) {
      console.log("Admin role change notifications are disabled");
      return new Response(
        JSON.stringify({ success: true, message: "Notifications disabled" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (recipients.length === 0) {
      console.log("No alert recipients configured, skipping notification");
      return new Response(
        JSON.stringify({ success: true, message: "No recipients configured" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const senderName = settingsMap.get("sender_name") || "Buoyancis";
    const senderEmail = settingsMap.get("alerts_email") || "alerts@buoyancis.com";

    const actionText = action === "assigned" ? "granted" : "revoked";
    const actionColor = action === "assigned" ? "#22c55e" : "#ef4444";
    const actionIcon = action === "assigned" ? "✓" : "✗";

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Georgia, 'Times New Roman', serif; margin: 0; padding: 0; background-color: #faf9f6;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://i.imgur.com/nTpVGYt.png" alt="Buoyancis" style="height: 40px;">
          </div>
          <div style="background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="display: inline-block; width: 60px; height: 60px; border-radius: 50%; background-color: ${actionColor}; color: white; font-size: 28px; line-height: 60px;">
                ${actionIcon}
              </div>
            </div>
            <h1 style="color: #333; font-size: 24px; text-align: center; margin: 0 0 24px 0;">
              Admin Role ${action === "assigned" ? "Granted" : "Revoked"}
            </h1>
            <div style="background-color: #f8f8f8; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; font-size: 14px;">User</td>
                  <td style="padding: 8px 0; color: #333; font-size: 14px; font-weight: bold; text-align: right;">${targetUserName || "Unknown User"}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-size: 14px;">Role</td>
                  <td style="padding: 8px 0; color: #333; font-size: 14px; font-weight: bold; text-align: right;">${role.toUpperCase()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-size: 14px;">Action</td>
                  <td style="padding: 8px 0; color: ${actionColor}; font-size: 14px; font-weight: bold; text-align: right;">${actionText.toUpperCase()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-size: 14px;">Changed By</td>
                  <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">${actorName || "Unknown"}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-size: 14px;">Time</td>
                  <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">${new Date().toLocaleString()}</td>
                </tr>
              </table>
            </div>
            <p style="color: #666; font-size: 14px; text-align: center; margin: 0;">
              This is an automated security notification. If this change was unexpected, please review immediately.
            </p>
          </div>
          <p style="text-align: center; color: #888; font-size: 12px; margin-top: 30px;">
            Security Alert from Buoyancis Admin System
          </p>
        </div>
      </body>
      </html>
    `;

    const subject = `🔐 Admin Role ${action === "assigned" ? "Granted" : "Revoked"}: ${targetUserName || "User"}`;

    const emailResponse = await resend.emails.send({
      from: `${senderName} <${senderEmail}>`,
      to: recipients,
      subject: subject,
      html: emailHtml,
    });

    console.log("Admin role change notification sent:", emailResponse);

    // Log to notification history
    await serviceClient.from("notification_history").insert({
      notification_type: "admin_role_change",
      recipients: recipients,
      subject: subject,
      status: "sent",
      triggered_by: requestingUser.id,
    });

    return new Response(
      JSON.stringify({ success: true, recipients: recipients.length }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error sending admin role change notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
