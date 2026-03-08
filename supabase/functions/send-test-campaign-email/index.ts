import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { rateLimitMiddleware } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestCampaignRequest {
  email: string;
  subject: string;
  body: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limit: 10 requests per minute per IP
  const rateLimitResponse = rateLimitMiddleware(
    req,
    { maxRequests: 10, windowMs: 60000, identifier: "send-test-campaign-email" },
    corsHeaders
  );
  if (rateLimitResponse) {
    return rateLimitResponse;
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

    // Verify the user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
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

    // Parse request body
    const { email, subject, body }: TestCampaignRequest = await req.json();

    if (!email || !subject || !body) {
      return new Response(
        JSON.stringify({ error: "Email, subject, and body are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch sender settings
    const { data: senderData } = await supabase
      .from("escalation_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["sender_name", "sender_email_noreply"]);
    
    const senderSettings = {
      senderName: "Buoyancis",
      senderEmailNoreply: "noreply@buoyancis.com",
    };
    
    senderData?.forEach((item) => {
      if (item.setting_key === "sender_name") senderSettings.senderName = item.setting_value;
      if (item.setting_key === "sender_email_noreply") senderSettings.senderEmailNoreply = item.setting_value;
    });

    const testSubject = `[TEST] ${subject}`;

    // Wrap the body with test banner and base styling
    const wrappedBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 4px; padding: 12px; margin-bottom: 20px;">
          <strong style="color: #92400e;">📧 Test Email Preview</strong>
          <p style="color: #92400e; margin: 4px 0 0 0; font-size: 14px;">
            This is a test email to preview your campaign content before sending.
          </p>
        </div>
        ${body}
      </div>
    `;

    // Send the test email
    await resend.emails.send({
      from: `${senderSettings.senderName} <${senderSettings.senderEmailNoreply}>`,
      to: [email],
      subject: testSubject,
      html: wrappedBody,
    });

    // Log to notification history
    await supabase.from("notification_history").insert({
      notification_type: "campaign_test",
      recipients: [email],
      subject: testSubject,
      status: "sent",
      triggered_by: user.id,
    });

    console.log(`Test campaign email sent to ${email} by user ${user.id}`);

    return new Response(
      JSON.stringify({ success: true, sentTo: email }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error sending test campaign email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
