import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface VIPInvitationRequest {
  recipientEmail: string;
  recipientName: string;
  accessCode: string;
  personalMessage?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const resend = new Resend(resendApiKey);
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin authorization
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

    const { recipientEmail, recipientName, accessCode, personalMessage }: VIPInvitationRequest = await req.json();

    if (!recipientEmail || !recipientName || !accessCode) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const privateAccessUrl = "https://genesis.buoyancis.com/private";

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #000000; font-family: Georgia, 'Times New Roman', serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 60px 40px;">
    <!-- Subtle header line -->
    <div style="width: 40px; height: 1px; background-color: #333333; margin-bottom: 40px;"></div>
    
    <!-- Greeting -->
    <p style="color: #ffffff; font-size: 18px; margin: 0 0 30px 0; line-height: 1.6;">
      Dear ${recipientName},
    </p>
    
    <!-- Main message -->
    <p style="color: #cccccc; font-size: 16px; line-height: 1.8; margin: 0 0 24px 0;">
      You've been selected to join an exclusive preview of something we've been quietly building.
    </p>
    
    <p style="color: #cccccc; font-size: 16px; line-height: 1.8; margin: 0 0 24px 0;">
      Buoyancis is a framework for understanding how trust, structure, and systems evolve over time. 
      We're not ready for the public yet, but we thought you might appreciate an early look.
    </p>

    ${personalMessage ? `
    <div style="border-left: 2px solid #333333; padding-left: 20px; margin: 32px 0;">
      <p style="color: #999999; font-size: 15px; line-height: 1.7; margin: 0; font-style: italic;">
        ${personalMessage}
      </p>
    </div>
    ` : ''}
    
    <!-- Access code box -->
    <div style="background-color: #0a0a0a; border: 1px solid #222222; padding: 32px; margin: 40px 0; text-align: center;">
      <p style="color: #666666; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 16px 0;">
        YOUR PRIVATE ACCESS CODE
      </p>
      <p style="color: #ffffff; font-size: 28px; letter-spacing: 6px; font-family: 'Courier New', monospace; margin: 0;">
        ${accessCode}
      </p>
    </div>
    
    <!-- CTA -->
    <div style="text-align: center; margin: 40px 0;">
      <a href="${privateAccessUrl}" style="display: inline-block; padding: 16px 40px; background-color: #ffffff; color: #000000; text-decoration: none; font-size: 13px; letter-spacing: 2px;">
        ENTER THE EXPERIENCE →
      </a>
    </div>
    
    <!-- Closing -->
    <p style="color: #999999; font-size: 15px; line-height: 1.8; margin: 40px 0 0 0;">
      This invitation is personal and non-transferable. We trust you'll treat it accordingly.
    </p>
    
    <p style="color: #cccccc; font-size: 16px; margin: 40px 0 0 0;">
      With anticipation,<br>
      <span style="color: #ffffff;">Jia Zhang</span><br>
      <span style="color: #666666; font-size: 14px;">Founder, Buoyancis</span>
    </p>
    
    <!-- Footer line -->
    <div style="width: 40px; height: 1px; background-color: #333333; margin-top: 60px;"></div>
    
    <p style="color: #444444; font-size: 11px; margin-top: 24px; letter-spacing: 1px;">
      This email was sent from founder@buoyancis.com
    </p>
  </div>
</body>
</html>`;

    const emailResponse = await resend.emails.send({
      from: "Jia Zhang <founder@buoyancis.com>",
      to: [recipientEmail],
      subject: "A Private Invitation",
      html: htmlContent,
      reply_to: "founder@buoyancis.com",
    });

    // Log to notification history
    await supabase.from("notification_history").insert({
      notification_type: "vip_invitation",
      subject: "A Private Invitation",
      recipients: [recipientEmail],
      status: "sent",
      triggered_by: user.id,
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        messageId: emailResponse.data?.id,
        sentTo: recipientEmail
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-vip-invitation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
