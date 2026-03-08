import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { rateLimitMiddleware } from "../_shared/rate-limiter.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SupportEmailRequest {
  targetUserId: string;
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
    { maxRequests: 10, windowMs: 60000, identifier: "send-support-email" },
    corsHeaders
  );
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the requesting user is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: requestingUser }, error: authError } = await anonClient.auth.getUser();
    if (authError || !requestingUser) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: roleData } = await anonClient
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      throw new Error("Admin access required");
    }

    const { targetUserId, subject, body }: SupportEmailRequest = await req.json();

    if (!targetUserId || !subject || !body) {
      throw new Error("Missing required fields: targetUserId, subject, body");
    }

    // Use service role to get user email from auth.users
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: userData, error: userError } = await serviceClient.auth.admin.getUserById(targetUserId);
    if (userError || !userData.user?.email) {
      throw new Error("User not found or has no email");
    }

    const targetEmail = userData.user.email;

    // Fetch sender settings
    const { data: senderSettings } = await serviceClient
      .from("escalation_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["sender_name", "noreply_email"]);

    const settingsMap = new Map(
      (senderSettings || []).map((s: { setting_key: string; setting_value: string }) => [s.setting_key, s.setting_value])
    );

    const senderName = settingsMap.get("sender_name") || "Buoyancis Support";
    const senderEmail = settingsMap.get("noreply_email") || "noreply@buoyancis.com";

    // Get target user's display name
    const { data: profileData } = await serviceClient
      .from("profiles")
      .select("display_name")
      .eq("user_id", targetUserId)
      .maybeSingle();

    const displayName = profileData?.display_name || "Valued Customer";

    // Build email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Georgia, 'Times New Roman', serif; margin: 0; padding: 0; background-color: #faf9f6;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://i.imgur.com/nTpVGYt.png" alt="Buoyancis" style="height: 40px;">
          </div>
          <div style="background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Dear ${displayName},
            </p>
            <div style="color: #333; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${body}</div>
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
              Best regards,<br>
              <strong style="color: #5a6f3c;">The Buoyancis Team</strong>
            </p>
          </div>
          <p style="text-align: center; color: #888; font-size: 12px; margin-top: 30px;">
            This is a support message from Buoyancis. If you have questions, reply to this email.
          </p>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: `${senderName} <${senderEmail}>`,
      to: [targetEmail],
      subject: subject,
      html: emailHtml,
      reply_to: senderEmail,
    });

    console.log("Support email sent:", emailResponse);

    // Log to notification history
    await serviceClient.from("notification_history").insert({
      notification_type: "support_email",
      recipients: [targetEmail],
      subject: subject,
      status: "sent",
      triggered_by: requestingUser.id,
    });

    return new Response(
      JSON.stringify({ success: true, email: targetEmail }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending support email:", error);
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
