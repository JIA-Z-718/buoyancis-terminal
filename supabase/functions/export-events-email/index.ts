import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ExportRequest {
  events: Array<{
    event_type: string;
    ip_address: string | null;
    user_agent: string | null;
    details: Record<string, unknown> | null;
    created_at: string;
  }>;
  recipientEmail: string;
  filterDescription?: string;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  honeypot: "Honeypot",
  timing: "Timing Violation",
  captcha_failure: "CAPTCHA Failure",
  suspicious_ua: "Suspicious UA",
  challenge_failure: "Challenge Failure",
  rate_limit: "Rate Limited",
  spam_domain: "Spam Domain",
  typo_domain: "Email Typo",
  ip_blocked: "IP Blocked",
  geo_blocked: "Geo Blocked",
};

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    // Verify admin authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { events, recipientEmail, filterDescription }: ExportRequest = await req.json();

    if (!events || !Array.isArray(events) || events.length === 0) {
      return new Response(JSON.stringify({ error: "No events to export" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!recipientEmail) {
      return new Response(JSON.stringify({ error: "Recipient email required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate CSV content
    const headers = ["Event Type", "IP Address", "User Agent", "Details", "Created At"];
    const rows = events.map((event) => {
      const eventLabel = EVENT_TYPE_LABELS[event.event_type] || event.event_type;
      return [
        eventLabel,
        event.ip_address || "N/A",
        event.user_agent || "N/A",
        event.details ? JSON.stringify(event.details) : "",
        event.created_at,
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    // Upload to storage
    const fileName = `bot-detection-export-${Date.now()}.csv`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("exports")
      .upload(filePath, new Blob([csvContent], { type: "text/csv" }), {
        contentType: "text/csv",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Failed to upload export: ${uploadError.message}`);
    }

    // Generate signed URL (valid for 24 hours)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("exports")
      .createSignedUrl(filePath, 60 * 60 * 24); // 24 hours

    if (signedUrlError || !signedUrlData?.signedUrl) {
      throw new Error("Failed to generate download link");
    }

    // Get sender email from settings
    const { data: senderSettings } = await supabase
      .from("escalation_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["sender_name", "sender_email_noreply"]);

    const senderName = senderSettings?.find((s) => s.setting_key === "sender_name")?.setting_value || "Buoyancis";
    const senderEmail = senderSettings?.find((s) => s.setting_key === "sender_email_noreply")?.setting_value || "noreply@buoyancis.com";

    // Send email
    const emailResponse = await resend.emails.send({
      from: `${senderName} <${senderEmail}>`,
      to: [recipientEmail],
      subject: `Bot Detection Events Export - ${events.length} events`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px;">Bot Detection Events Export</h1>
          
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.5;">
            Your export is ready! The file contains <strong>${events.length} events</strong>.
          </p>
          
          ${filterDescription ? `
          <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              <strong>Filters applied:</strong> ${filterDescription}
            </p>
          </div>
          ` : ''}
          
          <div style="margin: 30px 0;">
            <a href="${signedUrlData.signedUrl}" 
               style="display: inline-block; background: #18181b; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 500;">
              Download CSV Export
            </a>
          </div>
          
          <p style="color: #888; font-size: 14px;">
            This download link will expire in 24 hours.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px;">
            This email was sent by ${senderName}. If you didn't request this export, please ignore this email.
          </p>
        </body>
        </html>
      `,
    });

    console.log("Export email sent:", emailResponse);

    // Log to notification history
    await supabase.from("notification_history").insert({
      notification_type: "export_email",
      recipients: [recipientEmail],
      subject: `Bot Detection Events Export - ${events.length} events`,
      status: "sent",
      triggered_by: user.id,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Export sent to ${recipientEmail}`,
        eventCount: events.length 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error in export-events-email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
