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

    // Get the bot detection spike threshold
    const { data: thresholdSetting, error: thresholdError } = await supabase
      .from("alert_settings")
      .select("setting_value")
      .eq("setting_key", "bot_detection_spike_threshold")
      .single();

    if (thresholdError) {
      console.error("Error fetching threshold:", thresholdError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch threshold setting" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const threshold = thresholdSetting?.setting_value || 50;
    console.log(`Bot detection spike threshold: ${threshold}`);

    // Count bot detection events in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { count, error: countError } = await supabase
      .from("bot_detection_events")
      .select("*", { count: "exact", head: true })
      .gte("created_at", oneHourAgo);

    if (countError) {
      console.error("Error counting events:", countError);
      return new Response(
        JSON.stringify({ error: "Failed to count bot detection events" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const eventCount = count || 0;
    console.log(`Bot detection events in last hour: ${eventCount}`);

    // Check if we already have an unresolved alert for bot spikes
    const { data: existingAlert, error: existingError } = await supabase
      .from("deliverability_alerts")
      .select("id")
      .eq("alert_type", "bot_detection_spike")
      .is("resolved_at", null)
      .single();

    if (existingError && existingError.code !== "PGRST116") {
      console.error("Error checking existing alerts:", existingError);
    }

    // If count exceeds threshold and no existing unresolved alert, create one
    if (eventCount >= threshold && !existingAlert) {
      console.log(`Spike detected! ${eventCount} events exceeds threshold of ${threshold}`);

      // Create alert in deliverability_alerts
      const { error: alertError } = await supabase
        .from("deliverability_alerts")
        .insert({
          alert_type: "bot_detection_spike",
          metric_value: eventCount,
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
            const emailResponse = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${resendApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "Bot Detection Alert <alerts@buoyancis.com>",
                to: recipients,
                subject: `🚨 Bot Attack Alert: ${eventCount} blocks in the last hour`,
                html: `
                  <h2>Bot Detection Spike Alert</h2>
                  <p>A potential bot attack has been detected on your application.</p>
                  <table style="border-collapse: collapse; margin: 20px 0;">
                    <tr>
                      <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Events Detected</td>
                      <td style="padding: 8px; border: 1px solid #ddd;">${eventCount}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Threshold</td>
                      <td style="padding: 8px; border: 1px solid #ddd;">${threshold}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Time Window</td>
                      <td style="padding: 8px; border: 1px solid #ddd;">Last 60 minutes</td>
                    </tr>
                  </table>
                  <p>Please review the Bot Detection dashboard for more details and take appropriate action.</p>
                  <p style="color: #666; font-size: 12px;">This is an automated alert from your security monitoring system.</p>
                `,
              }),
            });

            if (emailResponse.ok) {
              console.log("Alert email sent successfully");
              
              // Log to notification history
              await supabase.from("notification_history").insert({
                notification_type: "bot_detection_spike",
                recipients,
                subject: `Bot Attack Alert: ${eventCount} blocks in the last hour`,
                status: "sent",
              });
            } else {
              const errorText = await emailResponse.text();
              console.error("Failed to send email:", errorText);
              
              await supabase.from("notification_history").insert({
                notification_type: "bot_detection_spike",
                recipients,
                subject: `Bot Attack Alert: ${eventCount} blocks in the last hour`,
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
          eventCount, 
          threshold,
          message: `Bot detection spike alert created: ${eventCount} events exceeds threshold of ${threshold}`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        status: "ok", 
        eventCount, 
        threshold,
        message: existingAlert 
          ? "Existing unresolved alert found, no new alert created" 
          : `Event count (${eventCount}) is below threshold (${threshold})`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in check-bot-detection-spikes:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
