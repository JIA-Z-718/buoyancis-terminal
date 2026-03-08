import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ValidationSummary {
  totalEntries: number;
  successCount: number;
  failedCount: number;
  totalErrors: number;
  topErrors: Array<{
    path: string;
    message: string;
    count: number;
  }>;
  generatedAt: string;
}

interface EmailRequest {
  recipientEmail: string;
  summary: ValidationSummary;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: authHeader } },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { recipientEmail, summary }: EmailRequest = await req.json();

    if (!recipientEmail || !summary) {
      throw new Error("Missing required fields: recipientEmail and summary");
    }

    // Fetch sender settings
    const { data: senderSettings } = await supabaseClient
      .from("escalation_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["sender_name", "noreply_email"]);

    const senderName = senderSettings?.find(s => s.setting_key === "sender_name")?.setting_value || "Buoyancis";
    const senderEmail = senderSettings?.find(s => s.setting_key === "noreply_email")?.setting_value || "noreply@buoyancis.com";

    // Build email HTML
    const topErrorsHtml = summary.topErrors.length > 0
      ? `
        <h3 style="margin: 20px 0 10px; color: #333;">Most Common Errors</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background: #f5f5f5;">
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Path</th>
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Message</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Count</th>
            </tr>
          </thead>
          <tbody>
            ${summary.topErrors.map(error => `
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd; font-family: monospace; font-size: 12px;">${error.path}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${error.message}</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-weight: bold;">${error.count}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `
      : '';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #5a6f3c 0%, #4a5c32 100%); padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Validation Summary Report</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0;">Generated: ${summary.generatedAt}</p>
        </div>
        
        <div style="background: #fff; border: 1px solid #e5e5e5; border-top: none; padding: 30px; border-radius: 0 0 12px 12px;">
          <div style="display: grid; gap: 15px; margin-bottom: 25px;">
            <div style="display: flex; justify-content: space-between; padding: 15px; background: #f8f9fa; border-radius: 8px;">
              <span style="color: #666;">Total Validations</span>
              <span style="font-weight: bold; font-size: 18px;">${summary.totalEntries}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 15px; background: #d4edda; border-radius: 8px;">
              <span style="color: #155724;">Passed</span>
              <span style="font-weight: bold; font-size: 18px; color: #155724;">${summary.successCount}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 15px; background: #f8d7da; border-radius: 8px;">
              <span style="color: #721c24;">Failed</span>
              <span style="font-weight: bold; font-size: 18px; color: #721c24;">${summary.failedCount}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 15px; background: #fff3cd; border-radius: 8px;">
              <span style="color: #856404;">Total Errors</span>
              <span style="font-weight: bold; font-size: 18px; color: #856404;">${summary.totalErrors}</span>
            </div>
          </div>

          ${topErrorsHtml}

          <p style="color: #666; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            This is an automated validation summary. For the full detailed report, please export the JSON from the application.
          </p>
        </div>

        <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
          Sent by ${senderName}
        </p>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: `${senderName} <${senderEmail}>`,
      to: [recipientEmail],
      subject: `Validation Summary: ${summary.failedCount} failed, ${summary.successCount} passed`,
      html: emailHtml,
    });

    console.log("Validation summary email sent:", emailResponse);

    // Log to notification history
    await supabaseClient.from("notification_history").insert({
      notification_type: "validation_summary",
      recipients: [recipientEmail],
      subject: `Validation Summary: ${summary.failedCount} failed, ${summary.successCount} passed`,
      status: "sent",
      triggered_by: user.id,
    });

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending validation summary:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
