import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { rateLimitMiddleware } from "../_shared/rate-limiter.ts";
import { validateCronSecret } from "../_shared/cron-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const RATE_LIMIT_CONFIG = {
  maxRequests: 5,
  windowMs: 60 * 1000,
  identifier: "check-audit-anomalies",
};

interface AnomalySettings {
  bulk_deletion_threshold: number;
  bulk_deletion_window_minutes: number;
  bulk_update_threshold: number;
  bulk_update_window_minutes: number;
  new_ip_alert_enabled: number;
  high_frequency_threshold: number;
  high_frequency_window_minutes: number;
}

interface DetectedAnomaly {
  type: string;
  severity: "warning" | "critical";
  description: string;
  details: Record<string, unknown>;
  userId?: string;
  ipAddress?: string;
}

interface SenderSettings {
  senderName: string;
  senderEmailAlerts: string;
}

const DEFAULT_ADMIN_EMAIL = "jiazhang718@gmail.com";

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

const getNotificationSettings = async (supabase: any) => {
  try {
    const { data } = await supabase
      .from("escalation_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["admin_notification_email", "notify_alerts_enabled"]);

    const settings = {
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

  const rateLimitResponse = rateLimitMiddleware(req, RATE_LIMIT_CONFIG, corsHeaders);
  if (rateLimitResponse) return rateLimitResponse;

  const cronAuth = await validateCronSecret(req);
  if (!cronAuth.authorized) return cronAuth.response!;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch settings
    const { data: settingsData } = await supabase
      .from("audit_anomaly_settings")
      .select("setting_key, setting_value");

    const settings: AnomalySettings = {
      bulk_deletion_threshold: 5,
      bulk_deletion_window_minutes: 10,
      bulk_update_threshold: 20,
      bulk_update_window_minutes: 5,
      new_ip_alert_enabled: 1,
      high_frequency_threshold: 50,
      high_frequency_window_minutes: 15,
    };

    settingsData?.forEach((item: any) => {
      if (item.setting_key in settings) {
        settings[item.setting_key as keyof AnomalySettings] = Number(item.setting_value);
      }
    });

    const anomalies: DetectedAnomaly[] = [];
    const now = new Date();

    // Check 1: Bulk deletions
    const deletionWindowStart = new Date(now.getTime() - settings.bulk_deletion_window_minutes * 60 * 1000);
    const { data: deletions } = await supabase
      .from("admin_access_audit_log")
      .select("user_id, table_name, created_at")
      .eq("operation", "DELETE")
      .gte("created_at", deletionWindowStart.toISOString());

    // Group by user
    const deletionsByUser: Record<string, { count: number; tables: Set<string> }> = {};
    deletions?.forEach((d: any) => {
      if (!deletionsByUser[d.user_id]) {
        deletionsByUser[d.user_id] = { count: 0, tables: new Set() };
      }
      deletionsByUser[d.user_id].count++;
      deletionsByUser[d.user_id].tables.add(d.table_name);
    });

    for (const [userId, data] of Object.entries(deletionsByUser)) {
      if (data.count >= settings.bulk_deletion_threshold) {
        const isCritical = data.count >= settings.bulk_deletion_threshold * 2;
        anomalies.push({
          type: "bulk_deletion",
          severity: isCritical ? "critical" : "warning",
          description: `User performed ${data.count} DELETE operations in ${settings.bulk_deletion_window_minutes} minutes`,
          details: {
            deleteCount: data.count,
            tables: Array.from(data.tables),
            windowMinutes: settings.bulk_deletion_window_minutes,
          },
          userId,
        });
      }
    }

    // Check 2: Bulk updates
    const updateWindowStart = new Date(now.getTime() - settings.bulk_update_window_minutes * 60 * 1000);
    const { data: updates } = await supabase
      .from("admin_access_audit_log")
      .select("user_id, table_name, created_at")
      .eq("operation", "UPDATE")
      .gte("created_at", updateWindowStart.toISOString());

    const updatesByUser: Record<string, { count: number; tables: Set<string> }> = {};
    updates?.forEach((u: any) => {
      if (!updatesByUser[u.user_id]) {
        updatesByUser[u.user_id] = { count: 0, tables: new Set() };
      }
      updatesByUser[u.user_id].count++;
      updatesByUser[u.user_id].tables.add(u.table_name);
    });

    for (const [userId, data] of Object.entries(updatesByUser)) {
      if (data.count >= settings.bulk_update_threshold) {
        anomalies.push({
          type: "bulk_update",
          severity: "warning",
          description: `User performed ${data.count} UPDATE operations in ${settings.bulk_update_window_minutes} minutes`,
          details: {
            updateCount: data.count,
            tables: Array.from(data.tables),
            windowMinutes: settings.bulk_update_window_minutes,
          },
          userId,
        });
      }
    }

    // Check 3: High frequency operations
    const frequencyWindowStart = new Date(now.getTime() - settings.high_frequency_window_minutes * 60 * 1000);
    const { data: allOps } = await supabase
      .from("admin_access_audit_log")
      .select("user_id, operation, created_at")
      .gte("created_at", frequencyWindowStart.toISOString());

    const opsByUser: Record<string, number> = {};
    allOps?.forEach((op: any) => {
      opsByUser[op.user_id] = (opsByUser[op.user_id] || 0) + 1;
    });

    for (const [userId, count] of Object.entries(opsByUser)) {
      if (count >= settings.high_frequency_threshold) {
        const isCritical = count >= settings.high_frequency_threshold * 1.5;
        anomalies.push({
          type: "high_frequency",
          severity: isCritical ? "critical" : "warning",
          description: `User performed ${count} operations in ${settings.high_frequency_window_minutes} minutes`,
          details: {
            operationCount: count,
            windowMinutes: settings.high_frequency_window_minutes,
          },
          userId,
        });
      }
    }

    // Check 4: New IP addresses (if enabled)
    if (settings.new_ip_alert_enabled === 1) {
      // Get IPs from the last 24 hours
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const { data: recentLogs } = await supabase
        .from("admin_access_audit_log")
        .select("ip_address, user_id, table_name, operation, created_at")
        .gte("created_at", dayAgo.toISOString())
        .not("ip_address", "is", null);

      // Get historical IPs (older than 24 hours)
      const { data: historicalLogs } = await supabase
        .from("admin_access_audit_log")
        .select("ip_address")
        .lt("created_at", dayAgo.toISOString())
        .not("ip_address", "is", null);

      const historicalIps = new Set(historicalLogs?.map((l: any) => l.ip_address) || []);
      const newIpAccess: Record<string, { userId: string; tables: Set<string>; count: number }> = {};

      recentLogs?.forEach((log: any) => {
        if (log.ip_address && !historicalIps.has(log.ip_address)) {
          if (!newIpAccess[log.ip_address]) {
            newIpAccess[log.ip_address] = { userId: log.user_id, tables: new Set(), count: 0 };
          }
          newIpAccess[log.ip_address].tables.add(log.table_name);
          newIpAccess[log.ip_address].count++;
        }
      });

      for (const [ip, data] of Object.entries(newIpAccess)) {
        anomalies.push({
          type: "new_ip_access",
          severity: "warning",
          description: `Access from new IP address: ${ip} (${data.count} operations)`,
          details: {
            operationCount: data.count,
            tables: Array.from(data.tables),
          },
          userId: data.userId,
          ipAddress: ip,
        });
      }
    }

    // Store new anomalies (check for duplicates)
    const newAnomalies: DetectedAnomaly[] = [];

    for (const anomaly of anomalies) {
      // Check if similar anomaly already exists (unresolved, same type and user)
      const { data: existing } = await supabase
        .from("audit_anomaly_alerts")
        .select("id")
        .eq("alert_type", anomaly.type)
        .eq("user_id", anomaly.userId || null)
        .is("resolved_at", null)
        .limit(1);

      if (!existing || existing.length === 0) {
        const { error: insertError } = await supabase
          .from("audit_anomaly_alerts")
          .insert({
            alert_type: anomaly.type,
            severity: anomaly.severity,
            description: anomaly.description,
            details: anomaly.details,
            user_id: anomaly.userId,
            ip_address: anomaly.ipAddress,
          });

        if (!insertError) {
          newAnomalies.push(anomaly);
        }
      }
    }

    // Send email notifications for new anomalies
    const notificationSettings = await getNotificationSettings(supabase);
    const senderSettings = await getSenderSettings(supabase);

    if (newAnomalies.length > 0 && resendApiKey && notificationSettings.alertsEnabled) {
      const resend = new Resend(resendApiKey);
      const hasCritical = newAnomalies.some(a => a.severity === "critical");
      const anomalyList = newAnomalies.map(a => 
        `<li><strong>${a.type.replace(/_/g, " ").toUpperCase()}</strong>: ${a.description}</li>`
      ).join("");

      try {
        await resend.emails.send({
          from: `${senderSettings.senderName} Security <${senderSettings.senderEmailAlerts}>`,
          to: notificationSettings.adminEmails,
          subject: hasCritical 
            ? "🚨 Critical Audit Anomaly Detected"
            : "⚠️ Audit Anomaly Alert",
          html: `
            <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: ${hasCritical ? '#dc2626' : '#d97706'}; margin-bottom: 20px;">
                Audit Log Anomaly Detected
              </h1>
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                The following unusual patterns were detected in the admin audit log:
              </p>
              <ul style="color: #374151; font-size: 16px; line-height: 1.8;">
                ${anomalyList}
              </ul>
              <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                Please review these activities in the admin dashboard to ensure they are legitimate.
              </p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
              <p style="color: #9ca3af; font-size: 12px;">
                This is an automated security alert from your system.
              </p>
            </div>
          `,
        });

        // Mark anomalies as notified
        for (const anomaly of newAnomalies) {
          await supabase
            .from("audit_anomaly_alerts")
            .update({ notified_at: new Date().toISOString() })
            .eq("alert_type", anomaly.type)
            .eq("user_id", anomaly.userId || null)
            .is("resolved_at", null);
        }

        console.log("Anomaly alert emails sent to:", notificationSettings.adminEmails);
      } catch (emailError) {
        console.error("Failed to send anomaly alert email:", emailError);
      }
    }

    // Log to notification history
    if (newAnomalies.length > 0) {
      await supabase.from("notification_history").insert({
        notification_type: "audit_anomaly_alert",
        recipients: notificationSettings.adminEmails,
        subject: `Audit Anomaly Alert: ${newAnomalies.length} anomalies detected`,
        status: "sent",
      });
    }

    return new Response(
      JSON.stringify({
        detected: anomalies.length,
        newAlerts: newAnomalies.length,
        anomalies: newAnomalies,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error checking audit anomalies:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
