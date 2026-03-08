import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ExportRequest {
  recipientEmail: string;
  includeUnsubscribed?: boolean;
}

Deno.serve(async (req: Request): Promise<Response> => {
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

    // Capture request metadata for audit
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                      req.headers.get("cf-connecting-ip") || null;
    const userAgent = req.headers.get("user-agent");

    const { recipientEmail, includeUnsubscribed = false }: ExportRequest = await req.json();

    if (!recipientEmail) {
      return new Response(JSON.stringify({ error: "Recipient email required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch early access signups
    let query = supabase
      .from("early_access_signups")
      .select("*")
      .order("created_at", { ascending: false });

    if (!includeUnsubscribed) {
      query = query.is("unsubscribed_at", null);
    }

    const { data: signups, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch signups: ${fetchError.message}`);
    }

    if (!signups || signups.length === 0) {
      return new Response(JSON.stringify({ error: "No signups to export" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log PII access for audit
    await supabase.from("admin_access_audit_log").insert({
      user_id: user.id,
      table_name: "early_access_signups",
      operation: "EXPORT",
      record_id: null,
      ip_address: ipAddress,
      user_agent: userAgent,
      new_values: {
        export_count: signups.length,
        include_unsubscribed: includeUnsubscribed,
        recipient_email: recipientEmail,
      },
    });

    // Generate CSV content
    const headers = [
      "ID",
      "Email",
      "First Name",
      "Last Name",
      "Daily Entropy Subscribed",
      "Signed Up At",
      "Unsubscribed At",
    ];
    
    const rows = signups.map((signup) => [
      signup.id,
      signup.email,
      signup.first_name || "",
      signup.last_name || "",
      signup.daily_entropy_subscribed ? "Yes" : "No",
      signup.created_at,
      signup.unsubscribed_at || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    // Upload to storage
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `early-access-export-${timestamp}.csv`;
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

    // Send email with download link
    const emailResponse = await resend.emails.send({
      from: `${senderName} <${senderEmail}>`,
      to: [recipientEmail],
      subject: `Early Access Signups Export - ${signups.length} records`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background: #fafafa;">
          <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px; margin-top: 0;">
              📊 Early Access Export Ready
            </h1>
            
            <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
              Your export is ready! The file contains <strong>${signups.length} signup records</strong>.
            </p>
            
            <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 24px 0;">
              <p style="color: #666; font-size: 14px; margin: 0;">
                <strong>Export details:</strong><br>
                • Records: ${signups.length}<br>
                • Includes unsubscribed: ${includeUnsubscribed ? "Yes" : "No"}<br>
                • Generated: ${new Date().toLocaleString()}
              </p>
            </div>
            
            <div style="margin: 30px 0; text-align: center;">
              <a href="${signedUrlData.signedUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #18181b 0%, #27272a 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
                Download CSV Export
              </a>
            </div>
            
            <p style="color: #888; font-size: 13px; margin-top: 24px;">
              ⏰ This download link will expire in <strong>24 hours</strong>.
            </p>
          </div>
          
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 24px;">
            This email was sent by ${senderName}. If you didn't request this export, please contact your administrator.
          </p>
        </body>
        </html>
      `,
    });

    console.log("Export email sent:", emailResponse);

    // Log to notification history
    await supabase.from("notification_history").insert({
      notification_type: "early_access_export",
      recipients: [recipientEmail],
      subject: `Early Access Signups Export - ${signups.length} records`,
      status: "sent",
      triggered_by: user.id,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Export sent to ${recipientEmail}`,
        recordCount: signups.length,
        downloadUrl: signedUrlData.signedUrl,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error in export-early-access:", error);
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
