import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SignupErrorNotification {
  email?: string;
  firstName?: string;
  lastName?: string;
  errorCode?: string;
  errorMessage?: string;
  userAgent?: string;
  timestamp: string;
}

const DEFAULT_ADMIN_EMAIL = "jiazhang718@gmail.com";

interface NotificationSettings {
  adminEmails: string[];
  errorsEnabled: boolean;
}

interface SenderSettings {
  senderName: string;
  senderEmailAlerts: string;
}

const getSenderSettings = async (): Promise<SenderSettings> => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data } = await supabase
      .from("escalation_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["sender_name", "sender_email_alerts"]);

    const settings: SenderSettings = {
      senderName: "Buoyancis",
      senderEmailAlerts: "alerts@buoyancis.com",
    };

    data?.forEach((item) => {
      if (item.setting_key === "sender_name") settings.senderName = item.setting_value;
      if (item.setting_key === "sender_email_alerts") settings.senderEmailAlerts = item.setting_value;
    });

    return settings;
  } catch (error) {
    console.error("Error fetching sender settings:", error);
    return { senderName: "Buoyancis", senderEmailAlerts: "alerts@buoyancis.com" };
  }
};

const getNotificationSettings = async (): Promise<NotificationSettings> => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from("escalation_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["admin_notification_email", "notify_errors_enabled"]);

    if (error) {
      console.error("Error fetching notification settings:", error);
      return { adminEmails: [DEFAULT_ADMIN_EMAIL], errorsEnabled: true };
    }

    const settings: NotificationSettings = {
      adminEmails: [DEFAULT_ADMIN_EMAIL],
      errorsEnabled: true,
    };

    data?.forEach((item) => {
      if (item.setting_key === "admin_notification_email" && item.setting_value) {
        settings.adminEmails = item.setting_value.split(",").map((e: string) => e.trim()).filter(Boolean);
      }
      if (item.setting_key === "notify_errors_enabled") {
        settings.errorsEnabled = item.setting_value === "true";
      }
    });

    return settings;
  } catch (error) {
    console.error("Error in getNotificationSettings:", error);
    return { adminEmails: [DEFAULT_ADMIN_EMAIL], errorsEnabled: true };
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    // Get notification and sender settings from database
    const settings = await getNotificationSettings();
    const senderSettings = await getSenderSettings();

    // Check if error notifications are enabled
    if (!settings.errorsEnabled) {
      console.log("Error notifications disabled, skipping email");
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "Error notifications disabled" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resend = new Resend(resendApiKey);
    const errorData: SignupErrorNotification = await req.json();

    const errorTime = new Date(errorData.timestamp).toLocaleString("en-US", {
      timeZone: "UTC",
      dateStyle: "medium",
      timeStyle: "long",
    });

    const subject = `⚠️ Signup Error: ${errorData.errorCode || "Unknown Error"}`;
    
    const result = await resend.emails.send({
      from: `${senderSettings.senderName} Alerts <${senderSettings.senderEmailAlerts}>`,
      to: settings.adminEmails,
      subject,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
            <h1 style="color: #991b1b; margin: 0 0 8px 0; font-size: 20px;">
              ⚠️ Signup Error Detected
            </h1>
            <p style="color: #b91c1c; margin: 0; font-size: 14px;">
              A user encountered an error while trying to sign up for early access.
            </p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold; width: 120px;">Time</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${errorTime}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Email</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${errorData.email || "Not provided"}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Name</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${[errorData.firstName, errorData.lastName].filter(Boolean).join(" ") || "Not provided"}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Error Code</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
                <code style="background-color: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 4px;">
                  ${errorData.errorCode || "UNKNOWN"}
                </code>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Error Message</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #dc2626;">${errorData.errorMessage || "No message"}</td>
            </tr>
          </table>

          ${errorData.userAgent ? `
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 12px; margin-bottom: 20px;">
              <p style="margin: 0 0 4px 0; font-weight: bold; font-size: 12px; color: #6b7280;">User Agent</p>
              <p style="margin: 0; font-size: 11px; color: #9ca3af; word-break: break-all;">${errorData.userAgent}</p>
            </div>
          ` : ""}

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            This is an automated alert from your Buoyancis signup system.
            View full error logs in the admin dashboard.
          </p>
        </div>
      `,
    });

    // Log to notification history
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    await supabase.from("notification_history").insert({
      notification_type: "error",
      recipients: settings.adminEmails,
      subject,
      status: "sent",
    });

    console.log("Signup error notification sent to:", settings.adminEmails);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error sending signup error notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
