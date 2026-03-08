import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { rateLimitMiddleware } from "../_shared/rate-limiter.ts";
import { validateCronSecret } from "../_shared/cron-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

// Rate limit: 5 requests per minute per IP (tightened for cron endpoints)
const RATE_LIMIT_CONFIG = {
  maxRequests: 5,
  windowMs: 60 * 1000,
  identifier: "notify-cron-failures",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const DEFAULT_ADMIN_EMAIL = "jiazhang718@gmail.com";

interface NotificationSettings {
  adminEmails: string[];
  alertsEnabled: boolean;
}

interface SenderSettings {
  senderName: string;
  senderEmailAlerts: string;
}

const getSenderSettings = async (supabase: any): Promise<SenderSettings> => {
  try {
    const { data } = await supabase
      .from("escalation_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["sender_name", "sender_email_alerts"]);

    const settings: SenderSettings = {
      senderName: "Buoyancis",
      senderEmailAlerts: "alerts@buoyancis.com",
    };

    data?.forEach((item: any) => {
      if (item.setting_key === "sender_name") settings.senderName = item.setting_value;
      if (item.setting_key === "sender_email_alerts") settings.senderEmailAlerts = item.setting_value;
    });

    return settings;
  } catch (error) {
    console.error("Error fetching sender settings:", error);
    return { senderName: "Buoyancis", senderEmailAlerts: "alerts@buoyancis.com" };
  }
};

const getNotificationSettings = async (supabase: any): Promise<NotificationSettings> => {
  try {
    const { data, error } = await supabase
      .from("escalation_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["admin_notification_email", "notify_alerts_enabled"]);

    if (error) {
      console.error("Error fetching notification settings:", error);
      return { adminEmails: [DEFAULT_ADMIN_EMAIL], alertsEnabled: true };
    }

    const settings: NotificationSettings = {
      adminEmails: [DEFAULT_ADMIN_EMAIL],
      alertsEnabled: true,
    };

    data?.forEach((item: any) => {
      if (item.setting_key === "admin_notification_email" && item.setting_value) {
        settings.adminEmails = item.setting_value.split(",").map((e: string) => e.trim()).filter(Boolean);
      }
      if (item.setting_key === "notify_alerts_enabled") {
        settings.alertsEnabled = item.setting_value === "true";
      }
    });

    return settings;
  } catch (error) {
    console.error("Error in getNotificationSettings:", error);
    return { adminEmails: [DEFAULT_ADMIN_EMAIL], alertsEnabled: true };
  }
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Apply rate limiting
  const rateLimitResponse = rateLimitMiddleware(req, RATE_LIMIT_CONFIG, corsHeaders);
  if (rateLimitResponse) return rateLimitResponse;

  // Validate cron secret
  const cronAuth = await validateCronSecret(req);
  if (!cronAuth.authorized) return cronAuth.response!;

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    console.log("Checking for recent cron job failures...");

    // Get failed jobs from the last 10 minutes that haven't been notified
    const { data: recentFailures, error: failuresError } = await supabaseAdmin.rpc(
      "get_recent_cron_failures"
    );

    if (failuresError) {
      console.error("Error fetching failures:", failuresError);
      throw new Error(`Failed to fetch cron failures: ${failuresError.message}`);
    }

    if (!recentFailures || recentFailures.length === 0) {
      console.log("No recent failures found");
      return new Response(JSON.stringify({ message: "No failures to report" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${recentFailures.length} recent failures`);

    // Get notification settings
    const notificationSettings = await getNotificationSettings(supabaseAdmin);
    const senderSettings = await getSenderSettings(supabaseAdmin);

    if (!notificationSettings.alertsEnabled) {
      console.log("Alert notifications disabled, skipping email");
      return new Response(JSON.stringify({ message: "Alert notifications disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminEmails = notificationSettings.adminEmails;

    console.log(`Notifying ${adminEmails.length} admins about ${recentFailures.length} failures`);

    // Build failure summary
    const failureRows = recentFailures.map((f: any) => `
      <tr style="border-bottom: 1px solid #e5e5e5;">
        <td style="padding: 12px; font-weight: 500;">${f.jobname || `Job #${f.jobid}`}</td>
        <td style="padding: 12px; color: #dc2626;">Failed</td>
        <td style="padding: 12px; font-size: 12px; color: #666;">
          ${new Date(f.start_time).toLocaleString()}
        </td>
        <td style="padding: 12px; font-size: 12px; color: #666; max-width: 300px; overflow: hidden; text-overflow: ellipsis;">
          ${f.return_message ? f.return_message.substring(0, 100) : 'No message'}
        </td>
      </tr>
    `).join("");

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f9fa; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ Cron Job Failure Alert</h1>
          </div>
          
          <div style="padding: 24px;">
            <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
              ${recentFailures.length} scheduled task${recentFailures.length > 1 ? 's have' : ' has'} failed in the last 10 minutes:
            </p>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <thead>
                <tr style="background: #f3f4f6;">
                  <th style="padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280;">Job</th>
                  <th style="padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280;">Status</th>
                  <th style="padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280;">Time</th>
                  <th style="padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280;">Error</th>
                </tr>
              </thead>
              <tbody>
                ${failureRows}
              </tbody>
            </table>
            
            <div style="text-align: center;">
              <a href="https://buoyancis.com/admin"
                 style="display: inline-block; background: #5a6f3c; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
                View Admin Dashboard
              </a>
            </div>
          </div>
          
          <div style="background: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              This is an automated alert from your scheduled tasks monitoring system.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send notification email via Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${senderSettings.senderName} Alerts <${senderSettings.senderEmailAlerts}>`,
        to: adminEmails,
        subject: `⚠️ ${recentFailures.length} Cron Job${recentFailures.length > 1 ? 's' : ''} Failed`,
        html: emailHtml,
      }),
    });

    const emailResult = await emailResponse.json();
    console.log("Notification email sent:", emailResult);

    // Mark these failures as notified by storing their runids
    const notifiedRunIds = recentFailures.map((f: any) => f.runid);
    await supabaseAdmin.rpc("mark_cron_failures_notified", { 
      run_ids: notifiedRunIds 
    });

    return new Response(JSON.stringify({ 
      success: true, 
      notified: recentFailures.length,
      recipients: adminEmails.length 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in notify-cron-failures:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
