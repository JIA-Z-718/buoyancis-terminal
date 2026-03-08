import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateCronSecret } from "../_shared/cron-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate cron secret for scheduled invocations
  const cronValidation = await validateCronSecret(req);
  if (!cronValidation.authorized) {
    console.log("Cron secret validation failed, checking for manual trigger");
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get the rate limit spike threshold
    const { data: thresholdSetting, error: thresholdError } = await supabase
      .from("alert_settings")
      .select("setting_value")
      .eq("setting_key", "rate_limit_spike_threshold")
      .single();

    if (thresholdError) {
      console.error("Error fetching threshold:", thresholdError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch threshold setting" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const threshold = thresholdSetting?.setting_value || 20;
    console.log(`Rate limit spike threshold: ${threshold}`);

    // Count rate limit violations in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { count, error: countError } = await supabase
      .from("rate_limit_violations")
      .select("*", { count: "exact", head: true })
      .gte("created_at", oneHourAgo);

    if (countError) {
      console.error("Error counting violations:", countError);
      return new Response(
        JSON.stringify({ error: "Failed to count rate limit violations" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const violationCount = count || 0;
    console.log(`Rate limit violations in last hour: ${violationCount}`);

    // Get breakdown by function for the alert
    const { data: breakdown, error: breakdownError } = await supabase
      .from("rate_limit_violations")
      .select("function_name, ip_address")
      .gte("created_at", oneHourAgo);

    let functionBreakdown: Record<string, number> = {};
    let uniqueIPs = new Set<string>();
    
    if (!breakdownError && breakdown) {
      breakdown.forEach((v) => {
        functionBreakdown[v.function_name] = (functionBreakdown[v.function_name] || 0) + 1;
        if (v.ip_address) uniqueIPs.add(v.ip_address);
      });
    }

    // Check if we already have an unresolved alert for rate limit spikes
    const { data: existingAlert, error: existingError } = await supabase
      .from("deliverability_alerts")
      .select("id")
      .eq("alert_type", "rate_limit_spike")
      .is("resolved_at", null)
      .single();

    if (existingError && existingError.code !== "PGRST116") {
      console.error("Error checking existing alerts:", existingError);
    }

    // If count exceeds threshold and no existing unresolved alert, create one
    if (violationCount >= threshold && !existingAlert) {
      console.log(`Spike detected! ${violationCount} violations exceeds threshold of ${threshold}`);

      // Create alert in deliverability_alerts
      const { error: alertError } = await supabase
        .from("deliverability_alerts")
        .insert({
          alert_type: "rate_limit_spike",
          metric_value: violationCount,
          threshold_value: threshold,
        });

      if (alertError) {
        console.error("Error creating alert:", alertError);
        return new Response(
          JSON.stringify({ error: "Failed to create alert" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get admin notification recipients
      const { data: recipientSetting } = await supabase
        .from("escalation_settings")
        .select("setting_value")
        .eq("setting_key", "alert_recipients")
        .single();

      const recipients = recipientSetting?.setting_value
        ? recipientSetting.setting_value.split(",").map((e: string) => e.trim()).filter(Boolean)
        : [];

      if (recipients.length > 0) {
        // Send email notification
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        if (resendApiKey) {
          try {
            // Build function breakdown HTML
            const breakdownHtml = Object.entries(functionBreakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([fn, cnt]) => `<tr><td style="padding: 4px 8px; border: 1px solid #ddd;">${fn}</td><td style="padding: 4px 8px; border: 1px solid #ddd;">${cnt}</td></tr>`)
              .join("");

            const emailResponse = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${resendApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "Rate Limit Alert <alerts@buoyancis.com>",
                to: recipients,
                subject: `🚨 Rate Limit Alert: ${violationCount} violations in the last hour`,
                html: `
                  <h2>Rate Limit Spike Alert</h2>
                  <p>An unusual number of rate limit violations has been detected on your application.</p>
                  <table style="border-collapse: collapse; margin: 20px 0;">
                    <tr>
                      <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Total Violations</td>
                      <td style="padding: 8px; border: 1px solid #ddd;">${violationCount}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Threshold</td>
                      <td style="padding: 8px; border: 1px solid #ddd;">${threshold}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Unique IPs</td>
                      <td style="padding: 8px; border: 1px solid #ddd;">${uniqueIPs.size}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Time Window</td>
                      <td style="padding: 8px; border: 1px solid #ddd;">Last 60 minutes</td>
                    </tr>
                  </table>
                  ${Object.keys(functionBreakdown).length > 0 ? `
                  <h3>Breakdown by Function</h3>
                  <table style="border-collapse: collapse; margin: 20px 0;">
                    <tr>
                      <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Function</th>
                      <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Violations</th>
                    </tr>
                    ${breakdownHtml}
                  </table>
                  ` : ""}
                  <p>Please review the Rate Limit Violations dashboard for more details and take appropriate action.</p>
                  <p style="color: #666; font-size: 12px;">This is an automated alert from your security monitoring system.</p>
                `,
              }),
            });

            if (emailResponse.ok) {
              console.log("Alert email sent successfully");
              
              // Log to notification history
              await supabase.from("notification_history").insert({
                notification_type: "rate_limit_spike",
                recipients,
                subject: `Rate Limit Alert: ${violationCount} violations in the last hour`,
                status: "sent",
              });
            } else {
              const errorText = await emailResponse.text();
              console.error("Failed to send email:", errorText);
              
              await supabase.from("notification_history").insert({
                notification_type: "rate_limit_spike",
                recipients,
                subject: `Rate Limit Alert: ${violationCount} violations in the last hour`,
                status: "failed",
                error_message: errorText,
              });
            }
          } catch (emailError) {
            console.error("Email sending error:", emailError);
          }
        }
      }

      return new Response(
        JSON.stringify({ 
          status: "alert_created", 
          violationCount, 
          threshold,
          uniqueIPs: uniqueIPs.size,
          functionBreakdown,
          message: `Rate limit spike alert created: ${violationCount} violations exceeds threshold of ${threshold}`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        status: "ok", 
        violationCount, 
        threshold,
        message: existingAlert 
          ? "Existing unresolved alert found, no new alert created" 
          : `Violation count (${violationCount}) is below threshold (${threshold})`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in check-rate-limit-spikes:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
