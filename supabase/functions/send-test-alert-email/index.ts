import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    // Get the authorization header to identify the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify the user and get their email
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user?.email) {
      return new Response(
        JSON.stringify({ error: "Invalid token or user not found" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch email template settings
    const { data: templateData } = await supabase
      .from("alert_email_template")
      .select("setting_key, setting_value");

    const emailTemplate = {
      subject_critical: "🚨 Critical Email Deliverability Alert",
      subject_warning: "⚠️ Email Deliverability Warning",
      from_name: "Alerts",
      heading: "Email Deliverability Alert",
      intro: "The following deliverability issues have been detected:",
      footer: "Please review your email list hygiene and sending practices to maintain good deliverability.",
      signature: "This is an automated alert from your email system.",
    };

    if (templateData) {
      for (const setting of templateData) {
        if (setting.setting_key in emailTemplate) {
          emailTemplate[setting.setting_key as keyof typeof emailTemplate] = setting.setting_value;
        }
      }
    }

    // Fetch sender settings
    const { data: senderData } = await supabase
      .from("escalation_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["sender_email_alerts"]);
    
    let senderEmailAlerts = "alerts@buoyancis.com";
    senderData?.forEach((item) => {
      if (item.setting_key === "sender_email_alerts") senderEmailAlerts = item.setting_value;
    });

    // Sample alerts for the test email
    const sampleAlerts = [
      "Critical: Bounce rate is 5.50% (threshold: 5%)",
      "Warning: Complaint rate is 0.15% (threshold: 0.1%)",
    ];
    const alertMessages = sampleAlerts.map(a => `<li>${a}</li>`).join("");

    const testSubject = `[TEST] ${emailTemplate.subject_critical}`;
    
    // Send the test email
    await resend.emails.send({
      from: `${emailTemplate.from_name} <${senderEmailAlerts}>`,
      to: [user.email],
      subject: testSubject,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 4px; padding: 12px; margin-bottom: 20px;">
            <strong style="color: #92400e;">⚠️ This is a test email</strong>
            <p style="color: #92400e; margin: 4px 0 0 0; font-size: 14px;">
              This email was sent to preview your alert template. No actual issues have been detected.
            </p>
          </div>
          <h1 style="color: #dc2626; margin-bottom: 20px;">
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

    // Log to notification history
    await supabase.from("notification_history").insert({
      notification_type: "alert",
      recipients: [user.email],
      subject: testSubject,
      status: "sent",
      triggered_by: user.id,
    });

    return new Response(
      JSON.stringify({ success: true, sentTo: user.email }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error sending test alert email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
