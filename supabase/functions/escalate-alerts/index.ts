import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
  identifier: "escalate-alerts",
};

interface EscalationResult {
  alertId: string;
  alertType: string;
  escalationLevel: number;
  notifiedEmails: string[];
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

serve(async (req) => {
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch escalation settings
    const { data: settings, error: settingsError } = await supabase
      .from("escalation_settings")
      .select("setting_key, setting_value");

    if (settingsError) throw settingsError;

    const settingsMap = Object.fromEntries(
      (settings || []).map((s) => [s.setting_key, s.setting_value])
    );

    const escalationEnabled = settingsMap.escalation_enabled === "true";
    if (!escalationEnabled) {
      return new Response(
        JSON.stringify({ message: "Escalation is disabled", escalated: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const firstDelayMinutes = parseInt(settingsMap.escalation_delay_minutes || "60", 10);
    const secondDelayMinutes = parseInt(settingsMap.second_escalation_delay_minutes || "120", 10);
    const firstEscalationEmails = (settingsMap.escalation_emails || "")
      .split(",")
      .map((e: string) => e.trim())
      .filter(Boolean);
    const secondEscalationEmails = (settingsMap.second_escalation_emails || "")
      .split(",")
      .map((e: string) => e.trim())
      .filter(Boolean);

    // Fetch unresolved alerts
    const { data: unresolvedAlerts, error: alertsError } = await supabase
      .from("deliverability_alerts")
      .select("*")
      .is("resolved_at", null)
      .order("created_at", { ascending: true });

    if (alertsError) throw alertsError;

    const now = new Date();
    const escalationResults: EscalationResult[] = [];

    for (const alert of unresolvedAlerts || []) {
      const createdAt = new Date(alert.created_at);
      const minutesSinceCreated = (now.getTime() - createdAt.getTime()) / (1000 * 60);
      const currentLevel = alert.escalation_level || 0;

      let shouldEscalate = false;
      let newLevel = currentLevel;
      let emailsToNotify: string[] = [];

      // Check for first escalation
      if (currentLevel === 0 && minutesSinceCreated >= firstDelayMinutes && firstEscalationEmails.length > 0) {
        shouldEscalate = true;
        newLevel = 1;
        emailsToNotify = firstEscalationEmails;
      }
      // Check for second escalation
      else if (currentLevel === 1 && minutesSinceCreated >= secondDelayMinutes && secondEscalationEmails.length > 0) {
        shouldEscalate = true;
        newLevel = 2;
        emailsToNotify = secondEscalationEmails;
      }

      if (shouldEscalate && emailsToNotify.length > 0) {
        // Update alert with escalation info
        const { error: updateError } = await supabase
          .from("deliverability_alerts")
          .update({
            escalation_level: newLevel,
            escalated_at: now.toISOString(),
          })
          .eq("id", alert.id);

        if (updateError) {
          console.error("Error updating alert:", updateError);
          continue;
        }

        // Send escalation emails
        if (resendApiKey) {
          const senderSettings = await getSenderSettings(supabase);
          const alertTypeLabels: Record<string, string> = {
            bounce_rate_warning: "Bounce Rate Warning",
            bounce_rate_critical: "Critical Bounce Rate",
            complaint_rate_warning: "Complaint Rate Warning",
            complaint_rate_critical: "Critical Complaint Rate",
            unsubscribe_rate_warning: "High Unsubscribe Rate",
          };

          const alertLabel = alertTypeLabels[alert.alert_type] || alert.alert_type;
          const isCritical = alert.alert_type.includes("critical");

          for (const email of emailsToNotify) {
            try {
              await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${resendApiKey}`,
                },
                body: JSON.stringify({
                  from: `${senderSettings.senderName} Alerts <${senderSettings.senderEmailAlerts}>`,
                  to: [email],
                  subject: `⚠️ ESCALATION Level ${newLevel}: ${alertLabel} - Unresolved for ${Math.round(minutesSinceCreated)} minutes`,
                  html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                      <div style="background: ${isCritical ? "#dc2626" : "#f59e0b"}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                        <h1 style="margin: 0; font-size: 24px;">🚨 Alert Escalation - Level ${newLevel}</h1>
                      </div>
                      <div style="padding: 20px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                        <p style="font-size: 16px; color: #374151;">
                          An alert has remained unresolved and requires immediate attention.
                        </p>
                        <div style="background: white; padding: 16px; border-radius: 8px; margin: 16px 0;">
                          <h3 style="margin: 0 0 12px 0; color: #111827;">${alertLabel}</h3>
                          <p style="margin: 8px 0; color: #6b7280;">
                            <strong>Current Value:</strong> ${Number(alert.metric_value).toFixed(2)}%
                          </p>
                          <p style="margin: 8px 0; color: #6b7280;">
                            <strong>Threshold:</strong> ${Number(alert.threshold_value).toFixed(2)}%
                          </p>
                          <p style="margin: 8px 0; color: #6b7280;">
                            <strong>Time Unresolved:</strong> ${Math.round(minutesSinceCreated)} minutes
                          </p>
                          <p style="margin: 8px 0; color: #6b7280;">
                            <strong>Escalation Level:</strong> ${newLevel}
                          </p>
                        </div>
                        <p style="font-size: 14px; color: #6b7280;">
                          Please investigate and resolve this alert as soon as possible.
                        </p>
                      </div>
                    </div>
                  `,
                }),
              });
            } catch (emailError) {
              console.error("Error sending escalation email:", emailError);
            }
          }
        }

        escalationResults.push({
          alertId: alert.id,
          alertType: alert.alert_type,
          escalationLevel: newLevel,
          notifiedEmails: emailsToNotify,
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: `Escalation check complete`,
        escalated: escalationResults,
        checkedAlerts: unresolvedAlerts?.length || 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in escalate-alerts function:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
