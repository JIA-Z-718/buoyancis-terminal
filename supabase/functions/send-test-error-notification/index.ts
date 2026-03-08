import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

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

    // Get admin emails from settings
    const { data: settingsData } = await supabase
      .from("escalation_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["admin_notification_email", "sender_name", "sender_email_alerts"]);

    let adminEmails = [user.email];
    const senderSettings = {
      senderName: "Buoyancis",
      senderEmailAlerts: "alerts@buoyancis.com",
    };
    
    settingsData?.forEach((item) => {
      if (item.setting_key === "admin_notification_email" && item.setting_value) {
        adminEmails = item.setting_value.split(",").map((e: string) => e.trim()).filter(Boolean);
      }
      if (item.setting_key === "sender_name") senderSettings.senderName = item.setting_value;
      if (item.setting_key === "sender_email_alerts") senderSettings.senderEmailAlerts = item.setting_value;
    });

    // Send test error notification
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${senderSettings.senderName} Alerts <${senderSettings.senderEmailAlerts}>`,
        to: adminEmails,
        subject: "🧪 [TEST] ⚠️ Signup Error Detected",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
              <strong style="color: #92400e;">⚠️ This is a test email</strong>
              <p style="color: #92400e; margin: 4px 0 0 0; font-size: 14px;">
                This email was sent to verify your error notification settings are working correctly.
              </p>
            </div>
            <h1 style="color: #dc2626;">⚠️ Signup Error Detected</h1>
            <p style="font-size: 16px; color: #666;">
              A user encountered an error while trying to sign up for early access.
            </p>
            <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px; font-size: 16px;">
                <strong>Email:</strong> test@example.com
              </p>
              <p style="margin: 0 0 10px; font-size: 16px;">
                <strong>Error:</strong> TEST_ERROR
              </p>
              <p style="margin: 0 0 10px; font-size: 16px;">
                <strong>Message:</strong> This is a test error message to verify notifications
              </p>
              <p style="margin: 0; font-size: 14px; color: #888;">
                Occurred at: ${new Date().toISOString()}
              </p>
            </div>
            <p style="font-size: 14px; color: #888;">
              Check the signup error logs in your admin dashboard for more details.
            </p>
          </div>
        `,
      }),
    });

    const emailData = await response.json();

    if (!response.ok) {
      console.error("Error sending test error notification:", emailData);
      return new Response(
        JSON.stringify({ error: emailData.message || "Failed to send email" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, sentTo: adminEmails }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-test-error-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
