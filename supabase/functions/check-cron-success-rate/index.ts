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
  identifier: "check-cron-success-rate",
};

const DEFAULT_SUCCESS_RATE_THRESHOLD = 80; // 80% success rate
const DEFAULT_ADMIN_EMAIL = "jiazhang718@gmail.com";

interface AlertResult {
  alertType: string;
  severity: "warning" | "critical";
  metricValue: number;
  thresholdValue: number;
  message: string;
  jobDetails?: { jobId: number; jobName: string; succeeded: number; failed: number; total: number; threshold: number }[];
  isJobSpecific?: boolean;
  jobId?: number;
  jobName?: string;
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
      senderName: "Alerts",
      senderEmailAlerts: "alerts@buoyancis.com",
    };

    data?.forEach((item: any) => {
      if (item.setting_key === "sender_name") settings.senderName = item.setting_value;
      if (item.setting_key === "sender_email_alerts") settings.senderEmailAlerts = item.setting_value;
    });

    return settings;
  } catch (error) {
    console.error("Error fetching sender settings:", error);
    return { senderName: "Alerts", senderEmailAlerts: "alerts@buoyancis.com" };
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

    // Fetch threshold setting, email template settings, and per-job thresholds
    const [settingsResult, templateResult, jobThresholdsResult] = await Promise.all([
      supabase.from("alert_settings").select("setting_key, setting_value"),
      supabase.from("alert_email_template").select("setting_key, setting_value"),
      supabase.from("cron_job_thresholds").select("jobid, threshold_value, notifications_enabled"),
    ]);

    // Get global threshold from settings or use default
    let globalSuccessRateThreshold = DEFAULT_SUCCESS_RATE_THRESHOLD;
    if (settingsResult.data) {
      const setting = settingsResult.data.find(s => s.setting_key === "cron_success_rate_warning");
      if (setting) {
        globalSuccessRateThreshold = Number(setting.setting_value);
      }
    }

    // Build per-job threshold map and notification settings
    const jobThresholds: Record<number, number> = {};
    const jobNotificationsEnabled: Record<number, boolean> = {};
    if (jobThresholdsResult.data) {
      for (const jt of jobThresholdsResult.data) {
        jobThresholds[jt.jobid] = Number(jt.threshold_value);
        jobNotificationsEnabled[jt.jobid] = jt.notifications_enabled !== false;
      }
    }

    // Build email template
    const emailTemplate = {
      from_name: "Alerts",
      heading: "Cron Job Success Rate Alert",
      intro: "The following cron job issues have been detected over the past 24 hours:",
      footer: "Please review your scheduled tasks and logs to investigate these failures.",
      signature: "This is an automated alert from your cron monitoring system.",
    };

    if (templateResult.data) {
      for (const setting of templateResult.data) {
        if (setting.setting_key === "from_name") {
          emailTemplate.from_name = setting.setting_value;
        }
      }
    }

    // Get cron job history from the last 24 hours
    const { data: historyData, error: historyError } = await supabase.rpc("get_cron_job_history", {
      job_id_filter: null,
      limit_count: 1000, // Get enough data for 24 hours
    });

    if (historyError) {
      console.error("Error fetching cron job history:", historyError);
      throw new Error(`Failed to fetch cron job history: ${historyError.message}`);
    }

    // Filter to last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentHistory = (historyData || []).filter((run: any) => 
      new Date(run.start_time) >= twentyFourHoursAgo
    );

    if (recentHistory.length === 0) {
      return new Response(
        JSON.stringify({ message: "No cron job runs in the last 24 hours" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get job names for each job ID
    const { data: jobsData } = await supabase.rpc("get_cron_jobs");
    const jobNames: Record<number, string> = {};
    if (jobsData) {
      for (const job of jobsData) {
        jobNames[job.jobid] = job.jobname;
      }
    }

    // Calculate success rate by job
    const jobStats: Record<number, { jobId: number; jobName: string; succeeded: number; failed: number; total: number; threshold: number }> = {};
    
    for (const run of recentHistory) {
      const jobId = run.jobid;
      if (!jobStats[jobId]) {
        // Use per-job threshold if set, otherwise use global threshold
        const threshold = jobThresholds[jobId] ?? globalSuccessRateThreshold;
        jobStats[jobId] = {
          jobId,
          jobName: jobNames[jobId] || `Job #${jobId}`,
          succeeded: 0,
          failed: 0,
          total: 0,
          threshold,
        };
      }
      
      jobStats[jobId].total++;
      if (run.status === "succeeded") {
        jobStats[jobId].succeeded++;
      } else if (run.status === "failed") {
        jobStats[jobId].failed++;
      }
    }

    // Calculate overall success rate
    const totalRuns = recentHistory.length;
    const succeededRuns = recentHistory.filter((r: any) => r.status === "succeeded").length;
    const failedRuns = recentHistory.filter((r: any) => r.status === "failed").length;
    const overallSuccessRate = totalRuns > 0 ? (succeededRuns / totalRuns) * 100 : 100;

    // Find jobs with low success rates (using their individual thresholds)
    const problematicJobs = Object.values(jobStats).filter(stats => {
      const rate = stats.total > 0 ? (stats.succeeded / stats.total) * 100 : 100;
      return rate < stats.threshold && stats.total >= 2; // Minimum 2 runs to be considered
    });

    const alerts: AlertResult[] = [];

    // Create alert if overall success rate is below global threshold
    if (overallSuccessRate < globalSuccessRateThreshold && totalRuns >= 5) {
      const severity = overallSuccessRate < 50 ? "critical" : "warning";
      alerts.push({
        alertType: "cron_success_rate_" + severity,
        severity,
        metricValue: overallSuccessRate,
        thresholdValue: globalSuccessRateThreshold,
        message: `${severity === "critical" ? "Critical" : "Warning"}: Cron job success rate is ${overallSuccessRate.toFixed(1)}% over the past 24 hours (threshold: ${globalSuccessRateThreshold}%)`,
        jobDetails: Object.values(jobStats),
        isJobSpecific: false,
      });
    }

    // Create alerts for individual jobs below their thresholds
    for (const job of problematicJobs) {
      const rate = job.total > 0 ? (job.succeeded / job.total) * 100 : 0;
      const severity = rate < 50 ? "critical" : "warning";
      alerts.push({
        alertType: `cron_job_${job.jobId}_${severity}`,
        severity,
        metricValue: rate,
        thresholdValue: job.threshold,
        message: `${severity === "critical" ? "Critical" : "Warning"}: Job "${job.jobName}" has ${rate.toFixed(1)}% success rate (threshold: ${job.threshold}%)`,
        isJobSpecific: true,
        jobId: job.jobId,
        jobName: job.jobName,
      });
    }

    // Process alerts
    const newAlerts: AlertResult[] = [];

    for (const alert of alerts) {
      // Check if there's already an unresolved alert of this type (within last 24 hours)
      const { data: existingAlerts } = await supabase
        .from("deliverability_alerts")
        .select("*")
        .eq("alert_type", alert.alertType)
        .is("resolved_at", null)
        .gte("created_at", twentyFourHoursAgo.toISOString())
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

    // Auto-resolve overall alerts if success rate is back above global threshold
    if (overallSuccessRate >= globalSuccessRateThreshold) {
      await supabase
        .from("deliverability_alerts")
        .update({ 
          resolved_at: new Date().toISOString(),
          resolution_notes: `Auto-resolved: Success rate improved to ${overallSuccessRate.toFixed(1)}%`,
        })
        .in("alert_type", ["cron_success_rate_warning", "cron_success_rate_critical"])
        .is("resolved_at", null);
    }

    // Auto-resolve per-job alerts for jobs that are now above their thresholds
    for (const [jobId, stats] of Object.entries(jobStats)) {
      const rate = stats.total > 0 ? (stats.succeeded / stats.total) * 100 : 100;
      if (rate >= stats.threshold) {
        // This job is healthy, resolve any active alerts for it
        await supabase
          .from("deliverability_alerts")
          .update({
            resolved_at: new Date().toISOString(),
            resolution_notes: `Auto-resolved: Job "${stats.jobName}" success rate improved to ${rate.toFixed(1)}%`,
          })
          .like("alert_type", `cron_job_${jobId}_%`)
          .is("resolved_at", null);
      }
    }

    // Send email notifications for new alerts (only if enabled)
    const notificationSettings = await getNotificationSettings(supabase);
    const senderSettings = await getSenderSettings(supabase);
    
    if (newAlerts.length > 0 && resendApiKey && notificationSettings.alertsEnabled) {
      const resend = new Resend(resendApiKey);
      const adminEmails = notificationSettings.adminEmails;
      
      // Separate overall alerts from per-job alerts
      const overallAlerts = newAlerts.filter(a => !a.isJobSpecific);
      const jobSpecificAlerts = newAlerts.filter(a => a.isJobSpecific);

      // Send email for overall alert (if any)
      for (const alert of overallAlerts) {
            const isCritical = alert.severity === "critical";
            
            // Build job details table
            let jobDetailsHtml = "";
            if (alert.jobDetails && alert.jobDetails.length > 0) {
              jobDetailsHtml = `
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                  <thead>
                    <tr style="background-color: #f3f4f6;">
                      <th style="padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb;">Job Name</th>
                      <th style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e7eb;">Succeeded</th>
                      <th style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e7eb;">Failed</th>
                      <th style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e7eb;">Total</th>
                      <th style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e7eb;">Threshold</th>
                      <th style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e7eb;">Success Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${alert.jobDetails.map(job => {
                      const rate = job.total > 0 ? (job.succeeded / job.total) * 100 : 0;
                      const rateColor = rate >= job.threshold ? "#059669" : rate >= 50 ? "#d97706" : "#dc2626";
                      return `
                        <tr>
                          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${job.jobName}</td>
                          <td style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e7eb; color: #059669;">${job.succeeded}</td>
                          <td style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e7eb; color: #dc2626;">${job.failed}</td>
                          <td style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e7eb;">${job.total}</td>
                          <td style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e7eb;">${job.threshold}%</td>
                          <td style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e7eb; color: ${rateColor}; font-weight: bold;">${rate.toFixed(1)}%</td>
                        </tr>
                      `;
                    }).join("")}
                  </tbody>
                </table>
              `;
            }

            try {
              await resend.emails.send({
                from: `${senderSettings.senderName} <${senderSettings.senderEmailAlerts}>`,
                to: adminEmails,
                subject: isCritical 
                  ? "🚨 Critical: Overall Cron Job Success Rate Alert"
                  : "⚠️ Warning: Overall Cron Job Success Rate Alert",
                html: `
                  <div style="font-family: Georgia, serif; max-width: 700px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: ${isCritical ? '#dc2626' : '#d97706'}; margin-bottom: 20px;">
                      ${emailTemplate.heading}
                    </h1>
                    <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                      ${emailTemplate.intro}
                    </p>
                    <div style="background-color: ${isCritical ? '#fef2f2' : '#fffbeb'}; border: 1px solid ${isCritical ? '#fecaca' : '#fde68a'}; border-radius: 8px; padding: 16px; margin: 20px 0;">
                      <p style="color: ${isCritical ? '#991b1b' : '#92400e'}; font-size: 18px; font-weight: bold; margin: 0;">
                        Overall Success Rate: ${overallSuccessRate.toFixed(1)}%
                      </p>
                      <p style="color: ${isCritical ? '#b91c1c' : '#b45309'}; font-size: 14px; margin: 8px 0 0 0;">
                        ${succeededRuns} succeeded / ${failedRuns} failed out of ${totalRuns} total runs
                      </p>
                    </div>
                    ${jobDetailsHtml}
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

              // Mark alert as notified
              await supabase
                .from("deliverability_alerts")
                .update({ notified_at: new Date().toISOString() })
                .eq("alert_type", alert.alertType)
                .is("resolved_at", null);

              console.log("Overall cron success rate alert email sent to:", adminEmails);
            } catch (emailError) {
              console.error("Failed to send overall alert email:", emailError);
            }
          }

          // Send consolidated email for per-job alerts (if any) - filter out jobs with notifications disabled
          const notifiableJobAlerts = jobSpecificAlerts.filter(alert => 
            alert.jobId === undefined || jobNotificationsEnabled[alert.jobId] !== false
          );
          
          if (notifiableJobAlerts.length > 0) {
            const hasCritical = notifiableJobAlerts.some(a => a.severity === "critical");
            
            // Build job-specific alerts table
            const jobAlertsHtml = `
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                  <tr style="background-color: #f3f4f6;">
                    <th style="padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb;">Job Name</th>
                    <th style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e7eb;">Severity</th>
                    <th style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e7eb;">Threshold</th>
                    <th style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e7eb;">Current Rate</th>
                  </tr>
                </thead>
                <tbody>
                  ${notifiableJobAlerts.map(alert => {
                    const rateColor = alert.metricValue >= 50 ? "#d97706" : "#dc2626";
                    const severityBadge = alert.severity === "critical" 
                      ? '<span style="background-color: #fef2f2; color: #dc2626; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">CRITICAL</span>'
                      : '<span style="background-color: #fffbeb; color: #d97706; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">WARNING</span>';
                    return `
                      <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${alert.jobName}</td>
                        <td style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e7eb;">${severityBadge}</td>
                        <td style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e7eb;">${alert.thresholdValue}%</td>
                        <td style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e7eb; color: ${rateColor}; font-weight: bold;">${alert.metricValue.toFixed(1)}%</td>
                      </tr>
                    `;
                  }).join("")}
                </tbody>
              </table>
            `;

            try {
              await resend.emails.send({
                from: `${senderSettings.senderName} <${senderSettings.senderEmailAlerts}>`,
                to: adminEmails,
                subject: hasCritical 
                  ? `🚨 Critical: ${notifiableJobAlerts.length} Cron Job${notifiableJobAlerts.length > 1 ? 's' : ''} Below Threshold`
                  : `⚠️ Warning: ${notifiableJobAlerts.length} Cron Job${notifiableJobAlerts.length > 1 ? 's' : ''} Below Threshold`,
                html: `
                  <div style="font-family: Georgia, serif; max-width: 700px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: ${hasCritical ? '#dc2626' : '#d97706'}; margin-bottom: 20px;">
                      Individual Job Alert${jobSpecificAlerts.length > 1 ? 's' : ''}
                    </h1>
                    <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                      The following cron job${jobSpecificAlerts.length > 1 ? 's have' : ' has'} fallen below ${jobSpecificAlerts.length > 1 ? 'their' : 'its'} configured success rate threshold in the past 24 hours:
                    </p>
                    ${jobAlertsHtml}
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

              // Mark all job-specific alerts as notified
              for (const alert of jobSpecificAlerts) {
                await supabase
                  .from("deliverability_alerts")
                  .update({ notified_at: new Date().toISOString() })
                  .eq("alert_type", alert.alertType)
                  .is("resolved_at", null);
              }

              console.log(`Per-job alert email sent for ${jobSpecificAlerts.length} job(s) to:`, adminEmails);
            } catch (emailError) {
              console.error("Failed to send per-job alert email:", emailError);
            }
      }
    } else if (newAlerts.length > 0 && !notificationSettings.alertsEnabled) {
      console.log("Alert notifications disabled, skipping email");
    }

    return new Response(
      JSON.stringify({
        overallSuccessRate: overallSuccessRate.toFixed(1),
        threshold: globalSuccessRateThreshold,
        jobThresholds,
        totalRuns,
        succeededRuns,
        failedRuns,
        problematicJobs,
        activeAlerts: alerts,
        newAlerts,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error checking cron success rate:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
