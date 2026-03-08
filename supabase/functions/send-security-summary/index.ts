import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

interface SecuritySummary {
  botEvents: number;
  rateLimitViolations: number;
  blockedIps: number;
  topBotEventTypes: Array<{ event_type: string; count: number }>;
  topRateLimitedFunctions: Array<{ function_name: string; count: number }>;
  topOffendingIps: Array<{ ip_address: string; count: number }>;
  periodStart: string;
  periodEnd: string;
}

interface EmailRequest {
  recipientEmails: string[];
  summary?: SecuritySummary;
  isManualTrigger?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    // Check for cron secret (for scheduled execution)
    const cronSecret = req.headers.get("x-cron-secret");
    const expectedCronSecret = Deno.env.get("CRON_SECRET");
    const isCronJob = cronSecret && cronSecret === expectedCronSecret;

    let supabaseClient;
    
    if (isCronJob) {
      // Use service role for cron jobs
      supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    } else {
      // Verify user authentication for manual triggers
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        throw new Error("No authorization header");
      }

      supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
      if (userError || !user) {
        throw new Error("Unauthorized");
      }

      // Verify admin role
      const { data: roleData } = await supabaseClient
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        throw new Error("Admin access required");
      }
    }

    const { recipientEmails, summary: providedSummary, isManualTrigger }: EmailRequest = await req.json();

    if (!recipientEmails || recipientEmails.length === 0) {
      throw new Error("Missing required field: recipientEmails");
    }

    // Either use provided summary or fetch from database
    let summary: SecuritySummary;
    
    if (providedSummary) {
      summary = providedSummary;
    } else {
      // Calculate the period (last 7 days)
      const now = new Date();
      const periodEnd = now.toISOString();
      const periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Fetch security data for the period
      const [botEventsResult, rateLimitResult, blockedIpsResult] = await Promise.all([
        supabaseClient
          .from("bot_detection_events")
          .select("event_type, ip_address")
          .gte("created_at", periodStart)
          .lte("created_at", periodEnd),
        supabaseClient
          .from("rate_limit_violations")
          .select("function_name, ip_address")
          .gte("created_at", periodStart)
          .lte("created_at", periodEnd),
        supabaseClient
          .from("ip_blocklist")
          .select("*", { count: "exact", head: true }),
      ]);

      const botEvents = botEventsResult.data || [];
      const rateLimitEvents = rateLimitResult.data || [];
      const blockedIpCount = blockedIpsResult.count || 0;

      // Calculate top bot event types
      const botEventCounts: Record<string, number> = {};
      botEvents.forEach((e) => {
        botEventCounts[e.event_type] = (botEventCounts[e.event_type] || 0) + 1;
      });
      const topBotEventTypes = Object.entries(botEventCounts)
        .map(([event_type, count]) => ({ event_type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate top rate-limited functions
      const functionCounts: Record<string, number> = {};
      rateLimitEvents.forEach((e) => {
        functionCounts[e.function_name] = (functionCounts[e.function_name] || 0) + 1;
      });
      const topRateLimitedFunctions = Object.entries(functionCounts)
        .map(([function_name, count]) => ({ function_name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate top offending IPs
      const ipCounts: Record<string, number> = {};
      [...botEvents, ...rateLimitEvents].forEach((e) => {
        if (e.ip_address) {
          ipCounts[e.ip_address] = (ipCounts[e.ip_address] || 0) + 1;
        }
      });
      const topOffendingIps = Object.entries(ipCounts)
        .map(([ip_address, count]) => ({ ip_address, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      summary = {
        botEvents: botEvents.length,
        rateLimitViolations: rateLimitEvents.length,
        blockedIps: blockedIpCount,
        topBotEventTypes,
        topRateLimitedFunctions,
        topOffendingIps,
        periodStart,
        periodEnd,
      };
    }

    // Fetch sender settings
    const { data: senderSettings } = await supabaseClient
      .from("escalation_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["sender_name", "alerts_email"]);

    const senderName = senderSettings?.find((s) => s.setting_key === "sender_name")?.setting_value || "Buoyancis";
    const senderEmail = senderSettings?.find((s) => s.setting_key === "alerts_email")?.setting_value || "alerts@buoyancis.com";

    // Format dates
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", { 
        weekday: "short", 
        month: "short", 
        day: "numeric",
        year: "numeric"
      });
    };

    const totalThreats = summary.botEvents + summary.rateLimitViolations;

    // Build email HTML
    const topBotEventsHtml = summary.topBotEventTypes.length > 0
      ? summary.topBotEventTypes.map((e) => `
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e5e5;">${e.event_type}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e5e5; text-align: right; font-weight: 600;">${e.count}</td>
          </tr>
        `).join("")
      : `<tr><td colspan="2" style="padding: 12px; text-align: center; color: #666;">No bot events detected</td></tr>`;

    const topFunctionsHtml = summary.topRateLimitedFunctions.length > 0
      ? summary.topRateLimitedFunctions.map((f) => `
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e5e5; font-family: monospace; font-size: 12px;">${f.function_name}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e5e5; text-align: right; font-weight: 600;">${f.count}</td>
          </tr>
        `).join("")
      : `<tr><td colspan="2" style="padding: 12px; text-align: center; color: #666;">No rate limit violations</td></tr>`;

    const topIpsHtml = summary.topOffendingIps.length > 0
      ? summary.topOffendingIps.map((ip) => `
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e5e5; font-family: monospace; font-size: 12px;">${ip.ip_address}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e5e5; text-align: right; font-weight: 600;">${ip.count}</td>
          </tr>
        `).join("")
      : `<tr><td colspan="2" style="padding: 12px; text-align: center; color: #666;">No suspicious IPs detected</td></tr>`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 640px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
        <div style="background: linear-gradient(135deg, #5a6f3c 0%, #4a5c32 100%); padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🛡️ Weekly Security Summary</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">
            ${formatDate(summary.periodStart)} — ${formatDate(summary.periodEnd)}
          </p>
        </div>
        
        <div style="background: #fff; border: 1px solid #e5e5e5; border-top: none; padding: 30px; border-radius: 0 0 12px 12px;">
          <!-- Overview Stats -->
          <div style="display: grid; gap: 12px; margin-bottom: 30px;">
            <div style="display: flex; gap: 12px;">
              <div style="flex: 1; padding: 16px; background: #fef3cd; border-radius: 8px; text-align: center;">
                <div style="font-size: 28px; font-weight: 700; color: #856404;">${totalThreats}</div>
                <div style="font-size: 12px; color: #856404; text-transform: uppercase;">Total Threats</div>
              </div>
              <div style="flex: 1; padding: 16px; background: #e8f4fd; border-radius: 8px; text-align: center;">
                <div style="font-size: 28px; font-weight: 700; color: #0c5460;">${summary.botEvents}</div>
                <div style="font-size: 12px; color: #0c5460; text-transform: uppercase;">Bot Events</div>
              </div>
            </div>
            <div style="display: flex; gap: 12px;">
              <div style="flex: 1; padding: 16px; background: #f8d7da; border-radius: 8px; text-align: center;">
                <div style="font-size: 28px; font-weight: 700; color: #721c24;">${summary.rateLimitViolations}</div>
                <div style="font-size: 12px; color: #721c24; text-transform: uppercase;">Rate Limits</div>
              </div>
              <div style="flex: 1; padding: 16px; background: #d4edda; border-radius: 8px; text-align: center;">
                <div style="font-size: 28px; font-weight: 700; color: #155724;">${summary.blockedIps}</div>
                <div style="font-size: 12px; color: #155724; text-transform: uppercase;">Blocked IPs</div>
              </div>
            </div>
          </div>

          <!-- Top Bot Event Types -->
          <h3 style="margin: 0 0 12px; color: #333; font-size: 16px;">🤖 Top Bot Event Types</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; background: #fafafa; border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background: #f0f0f0;">
                <th style="padding: 10px 12px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #666;">Event Type</th>
                <th style="padding: 10px 12px; text-align: right; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #666;">Count</th>
              </tr>
            </thead>
            <tbody>
              ${topBotEventsHtml}
            </tbody>
          </table>

          <!-- Top Rate-Limited Functions -->
          <h3 style="margin: 0 0 12px; color: #333; font-size: 16px;">⚡ Top Rate-Limited Functions</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; background: #fafafa; border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background: #f0f0f0;">
                <th style="padding: 10px 12px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #666;">Function</th>
                <th style="padding: 10px 12px; text-align: right; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #666;">Count</th>
              </tr>
            </thead>
            <tbody>
              ${topFunctionsHtml}
            </tbody>
          </table>

          <!-- Top Offending IPs -->
          <h3 style="margin: 0 0 12px; color: #333; font-size: 16px;">🚫 Top Offending IPs</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; background: #fafafa; border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background: #f0f0f0;">
                <th style="padding: 10px 12px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #666;">IP Address</th>
                <th style="padding: 10px 12px; text-align: right; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #666;">Events</th>
              </tr>
            </thead>
            <tbody>
              ${topIpsHtml}
            </tbody>
          </table>

          <!-- Footer -->
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5; text-align: center; color: #666; font-size: 12px;">
            <p style="margin: 0;">This is an automated security summary from ${senderName}.</p>
            <p style="margin: 5px 0 0;">Review the admin dashboard for detailed analysis and actions.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email to all recipients
    const emailResponse = await resend.emails.send({
      from: `${senderName} Security <${senderEmail}>`,
      to: recipientEmails,
      subject: `🛡️ Weekly Security Summary: ${totalThreats} threats detected`,
      html: emailHtml,
    });

    console.log("Security summary email sent:", emailResponse);

    // Log to notification history
    await supabaseClient.from("notification_history").insert({
      notification_type: "security_summary",
      recipients: recipientEmails,
      subject: `Weekly Security Summary: ${totalThreats} threats detected`,
      status: "sent",
      triggered_by: isManualTrigger ? "manual" : "scheduled",
    });

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-security-summary function:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
