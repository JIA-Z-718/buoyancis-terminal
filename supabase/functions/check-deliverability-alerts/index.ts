import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
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
  identifier: "check-deliverability-alerts",
};

// Default thresholds (will be overridden by database values)
const DEFAULT_THRESHOLDS = {
  bounce_rate_warning: 2,
  bounce_rate_critical: 5,
  complaint_rate_warning: 0.1,
  complaint_rate_critical: 0.5,
  unsubscribe_rate_warning: 1,
};

interface AlertResult {
  alertType: string;
  severity: "warning" | "critical";
  metricValue: number;
  thresholdValue: number;
  message: string;
}

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

const DEFAULT_ADMIN_EMAIL = "jiazhang718@gmail.com";

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

const handler = async (req: Request): Promise<Response> => {
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

    // Fetch all data in parallel including threshold settings and email template
    const [
      campaignsResult,
      bouncesResult,
      complaintsResult,
      unsubscribesResult,
      settingsResult,
      templateResult,
    ] = await Promise.all([
      supabase.from("email_campaigns").select("recipient_count"),
      supabase.from("email_bounces").select("id"),
      supabase.from("email_complaints").select("id"),
      supabase.from("email_unsubscribes").select("id"),
      supabase.from("alert_settings").select("setting_key, setting_value"),
      supabase.from("alert_email_template").select("setting_key, setting_value"),
    ]);

    // Extract notification settings (webhook URL, Slack channel)
    let webhookUrl = "";
    let slackChannel = "";
    
    if (templateResult.data) {
      for (const setting of templateResult.data) {
        if (setting.setting_key === "webhook_url") {
          webhookUrl = setting.setting_value || "";
        }
        if (setting.setting_key === "slack_channel") {
          slackChannel = setting.setting_value || "";
        }
      }
    }

    // Build email template from database or use defaults
    const emailTemplate = {
      subject_critical: "🚨 Critical Email Deliverability Alert",
      subject_warning: "⚠️ Email Deliverability Warning",
      from_name: "Alerts",
      heading: "Email Deliverability Alert",
      intro: "The following deliverability issues have been detected:",
      footer: "Please review your email list hygiene and sending practices to maintain good deliverability.",
      signature: "This is an automated alert from your email system.",
    };
    
    if (templateResult.data) {
      for (const setting of templateResult.data) {
        if (setting.setting_key in emailTemplate) {
          emailTemplate[setting.setting_key as keyof typeof emailTemplate] = setting.setting_value;
        }
      }
    }

    // Build thresholds from database or use defaults
    const thresholds = { ...DEFAULT_THRESHOLDS };
    if (settingsResult.data) {
      for (const setting of settingsResult.data) {
        if (setting.setting_key in thresholds) {
          thresholds[setting.setting_key as keyof typeof thresholds] = Number(setting.setting_value);
        }
      }
    }

    const campaigns = campaignsResult.data || [];
    const bounces = bouncesResult.data || [];
    const complaints = complaintsResult.data || [];
    const unsubscribes = unsubscribesResult.data || [];

    const totalSent = campaigns.reduce((sum, c) => sum + (c.recipient_count || 0), 0);

    if (totalSent === 0) {
      return new Response(
        JSON.stringify({ message: "No emails sent yet, nothing to check" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const bounceRate = (bounces.length / totalSent) * 100;
    const complaintRate = (complaints.length / totalSent) * 100;
    const unsubscribeRate = (unsubscribes.length / totalSent) * 100;

    const alerts: AlertResult[] = [];

    // Check bounce rate
    if (bounceRate >= thresholds.bounce_rate_critical) {
      alerts.push({
        alertType: "bounce_rate_critical",
        severity: "critical",
        metricValue: bounceRate,
        thresholdValue: thresholds.bounce_rate_critical,
        message: `Critical: Bounce rate is ${bounceRate.toFixed(2)}% (threshold: ${thresholds.bounce_rate_critical}%)`,
      });
    } else if (bounceRate >= thresholds.bounce_rate_warning) {
      alerts.push({
        alertType: "bounce_rate_warning",
        severity: "warning",
        metricValue: bounceRate,
        thresholdValue: thresholds.bounce_rate_warning,
        message: `Warning: Bounce rate is ${bounceRate.toFixed(2)}% (threshold: ${thresholds.bounce_rate_warning}%)`,
      });
    }

    // Check complaint rate
    if (complaintRate >= thresholds.complaint_rate_critical) {
      alerts.push({
        alertType: "complaint_rate_critical",
        severity: "critical",
        metricValue: complaintRate,
        thresholdValue: thresholds.complaint_rate_critical,
        message: `Critical: Complaint rate is ${complaintRate.toFixed(3)}% (threshold: ${thresholds.complaint_rate_critical}%)`,
      });
    } else if (complaintRate >= thresholds.complaint_rate_warning) {
      alerts.push({
        alertType: "complaint_rate_warning",
        severity: "warning",
        metricValue: complaintRate,
        thresholdValue: thresholds.complaint_rate_warning,
        message: `Warning: Complaint rate is ${complaintRate.toFixed(3)}% (threshold: ${thresholds.complaint_rate_warning}%)`,
      });
    }

    // Check unsubscribe rate
    if (unsubscribeRate >= thresholds.unsubscribe_rate_warning) {
      alerts.push({
        alertType: "unsubscribe_rate_warning",
        severity: "warning",
        metricValue: unsubscribeRate,
        thresholdValue: thresholds.unsubscribe_rate_warning,
        message: `Warning: Unsubscribe rate is ${unsubscribeRate.toFixed(2)}% (threshold: ${thresholds.unsubscribe_rate_warning}%)`,
      });
    }

    // Process alerts
    const newAlerts: AlertResult[] = [];

    for (const alert of alerts) {
      // Check if there's already an unresolved alert of this type
      const { data: existingAlerts } = await supabase
        .from("deliverability_alerts")
        .select("*")
        .eq("alert_type", alert.alertType)
        .is("resolved_at", null)
        .limit(1);

      if (!existingAlerts || existingAlerts.length === 0) {
        // Create new alert
        const { error: insertError } = await supabase
          .from("deliverability_alerts")
          .insert({
            alert_type: alert.alertType,
            metric_value: alert.metricValue,
            threshold_value: alert.thresholdValue,
          });

        if (!insertError) {
          newAlerts.push(alert);
        }
      }
    }

    // Resolve alerts that are no longer applicable
    const currentAlertTypes = alerts.map(a => a.alertType);
    const allAlertTypes = [
      "bounce_rate_warning",
      "bounce_rate_critical",
      "complaint_rate_warning",
      "complaint_rate_critical",
      "unsubscribe_rate_warning",
    ];
    const resolvedTypes = allAlertTypes.filter(t => !currentAlertTypes.includes(t));

    for (const resolvedType of resolvedTypes) {
      await supabase
        .from("deliverability_alerts")
        .update({ resolved_at: new Date().toISOString() })
        .eq("alert_type", resolvedType)
        .is("resolved_at", null);
    }

    // Send email notifications for new alerts (only if enabled)
    const notificationSettings = await getNotificationSettings(supabase);
    const senderSettings = await getSenderSettings(supabase);
    
    if (newAlerts.length > 0 && resendApiKey && notificationSettings.alertsEnabled) {
      const resend = new Resend(resendApiKey);
      const adminEmails = notificationSettings.adminEmails;
      const alertMessages = newAlerts.map(a => `<li>${a.message}</li>`).join("");
      const criticalCount = newAlerts.filter(a => a.severity === "critical").length;

      try {
        await resend.emails.send({
          from: `${emailTemplate.from_name} <${senderSettings.senderEmailAlerts}>`,
          to: adminEmails,
          subject: criticalCount > 0 
            ? emailTemplate.subject_critical
            : emailTemplate.subject_warning,
          html: `
            <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: ${criticalCount > 0 ? '#dc2626' : '#d97706'}; margin-bottom: 20px;">
                ${emailTemplate.heading}
              </h1>
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                ${emailTemplate.intro}
              </p>
              <ul style="color: #374151; font-size: 16px; line-height: 1.8;">
                ${alertMessages}
              </ul>
              <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                ${emailTemplate.footer}
              </p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
              <p style="color: #9ca3af; font-size: 12px;">
                ${emailTemplate.signature}
              </p>
            </div>
          `,
        });

        // Mark alerts as notified
        for (const alert of newAlerts) {
          await supabase
            .from("deliverability_alerts")
            .update({ notified_at: new Date().toISOString() })
            .eq("alert_type", alert.alertType)
            .is("resolved_at", null);
        }

        console.log("Alert emails sent to:", adminEmails);
      } catch (emailError) {
        console.error("Failed to send alert email:", emailError);
      }
    } else if (newAlerts.length > 0 && !notificationSettings.alertsEnabled) {
      console.log("Alert notifications disabled, skipping email");
    }

    // Send webhook notification for new alerts
    if (newAlerts.length > 0 && webhookUrl) {
      const hasCritical = newAlerts.some(a => a.severity === "critical");
      
      try {
        const webhookPayload = {
          alerts: newAlerts.map(a => ({
            type: a.alertType,
            severity: a.severity,
            value: Number(a.metricValue.toFixed(2)),
            threshold: Number(a.thresholdValue.toFixed(2)),
            message: a.message,
          })),
          timestamp: new Date().toISOString(),
          hasCritical,
        };

        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(webhookPayload),
        });

        console.log("Webhook notification sent to:", webhookUrl);
      } catch (webhookError) {
        console.error("Failed to send webhook notification:", webhookError);
      }
    }

    // Send Slack notification for new critical alerts
    if (newAlerts.length > 0 && slackChannel) {
      const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
      const slackApiKey = Deno.env.get("SLACK_API_KEY");
      
      if (lovableApiKey && slackApiKey) {
        const hasCritical = newAlerts.some(a => a.severity === "critical");
        const alertList = newAlerts.map(a => `• ${a.message}`).join("\n");
        
        try {
          const slackMessage = {
            channel: slackChannel,
            text: hasCritical 
              ? "🚨 Critical Email Deliverability Alert"
              : "⚠️ Email Deliverability Warning",
            blocks: [
              {
                type: "header",
                text: {
                  type: "plain_text",
                  text: hasCritical 
                    ? "🚨 Critical Email Deliverability Alert"
                    : "⚠️ Email Deliverability Warning",
                },
              },
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `The following issues have been detected:\n\n${alertList}`,
                },
              },
              {
                type: "context",
                elements: [
                  {
                    type: "mrkdwn",
                    text: `Triggered at ${new Date().toISOString()}`,
                  },
                ],
              },
            ],
          };

          const slackResponse = await fetch("https://gateway.lovable.dev/slack/api/chat.postMessage", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${lovableApiKey}`,
              "X-Connection-Api-Key": slackApiKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(slackMessage),
          });

          if (slackResponse.ok) {
            console.log("Slack notification sent to channel:", slackChannel);
          } else {
            const slackError = await slackResponse.text();
            console.error("Slack API error:", slackError);
          }
        } catch (slackError) {
          console.error("Failed to send Slack notification:", slackError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        currentRates: {
          bounceRate: bounceRate.toFixed(2),
          complaintRate: complaintRate.toFixed(3),
          unsubscribeRate: unsubscribeRate.toFixed(2),
        },
        activeAlerts: alerts,
        newAlerts,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error checking deliverability alerts:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
