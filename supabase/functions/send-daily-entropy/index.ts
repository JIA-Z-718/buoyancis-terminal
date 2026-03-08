import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    // Get today's date
    const today = new Date().toISOString().split("T")[0];

    // Fetch today's word
    const { data: wordData, error: wordError } = await supabase
      .from("daily_entropy_words")
      .select("*")
      .eq("scheduled_date", today)
      .is("sent_at", null)
      .single();

    if (wordError || !wordData) {
      console.log("No word scheduled for today or already sent:", today);
      return new Response(
        JSON.stringify({ message: "No word to send today", date: today }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get sender settings
    const { data: senderSettings } = await supabase
      .from("escalation_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["sender_name", "noreply_email"]);

    const settings = Object.fromEntries(
      (senderSettings || []).map((s: any) => [s.setting_key, s.setting_value])
    );
    const senderName = settings.sender_name || "Buoyancis";
    const senderEmail = settings.noreply_email || "noreply@buoyancis.com";

    // Fetch subscribed users
    const { data: subscribers, error: subError } = await supabase
      .from("early_access_signups")
      .select("email, first_name")
      .eq("daily_entropy_subscribed", true)
      .is("unsubscribed_at", null);

    if (subError) {
      throw new Error(`Failed to fetch subscribers: ${subError.message}`);
    }

    if (!subscribers || subscribers.length === 0) {
      console.log("No subscribers to send to");
      return new Response(
        JSON.stringify({ message: "No subscribers", sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const baseUrl = Deno.env.get("SITE_URL") || "https://buoyancis.com";

    // Send emails
    let sentCount = 0;
    const errors: string[] = [];

    for (const subscriber of subscribers) {
      const unsubscribeUrl = `${baseUrl}/unsubscribe?email=${encodeURIComponent(subscriber.email)}&type=daily_entropy`;
      const decoderUrl = `${baseUrl}/decoder?word=${encodeURIComponent(wordData.word)}`;

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #000000; font-family: 'Courier New', monospace;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <span style="color: #666666; font-size: 10px; letter-spacing: 3px; text-transform: uppercase;">
        DAILY ENTROPY REDUCTION
      </span>
    </div>
    
    <!-- Word of the Day -->
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="color: #ffffff; font-size: 48px; font-weight: 300; margin: 0 0 16px 0; letter-spacing: 4px;">
        ${wordData.word.toUpperCase()}
      </h1>
      <p style="color: #666666; font-size: 14px; margin: 0; letter-spacing: 2px;">
        ${wordData.decoded_string}
      </p>
    </div>
    
    <!-- Interpretation -->
    <div style="border-top: 1px solid #333333; border-bottom: 1px solid #333333; padding: 30px 0; margin-bottom: 40px;">
      <p style="color: #999999; font-size: 16px; line-height: 1.8; margin: 0; font-style: italic; text-align: center;">
        "${wordData.interpretation}"
      </p>
    </div>
    
    <!-- Deep Analysis -->
    <div style="margin-bottom: 40px;">
      <h2 style="color: #ffffff; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 20px 0;">
        STRUCTURAL ANALYSIS
      </h2>
      <p style="color: #cccccc; font-size: 14px; line-height: 1.8; margin: 0;">
        ${wordData.deep_analysis}
      </p>
    </div>
    
    <!-- CTA -->
    <div style="text-align: center; margin-bottom: 40px;">
      <a href="${decoderUrl}" style="display: inline-block; padding: 14px 32px; background-color: #ffffff; color: #000000; text-decoration: none; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">
        DECODE YOUR OWN WORD →
      </a>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; padding-top: 30px; border-top: 1px solid #222222;">
      <p style="color: #444444; font-size: 10px; margin: 0 0 10px 0; letter-spacing: 1px;">
        Entropy is inevitable. Structure is a choice.
      </p>
      <p style="color: #333333; font-size: 10px; margin: 0;">
        <a href="${unsubscribeUrl}" style="color: #444444; text-decoration: underline;">Unsubscribe</a>
        &nbsp;|&nbsp;
        <a href="${baseUrl}" style="color: #444444; text-decoration: underline;">Buoyancis</a>
      </p>
    </div>
  </div>
</body>
</html>`;

      try {
        await resend.emails.send({
          from: `${senderName} <${senderEmail}>`,
          to: [subscriber.email],
          subject: `Daily Entropy: ${wordData.word.toUpperCase()}`,
          html: htmlContent,
        });
        sentCount++;
      } catch (emailError: any) {
        console.error(`Failed to send to ${subscriber.email}:`, emailError);
        errors.push(subscriber.email);
      }
    }

    // Update the word as sent
    await supabase
      .from("daily_entropy_words")
      .update({ 
        sent_at: new Date().toISOString(),
        recipient_count: sentCount 
      })
      .eq("id", wordData.id);

    // Log to notification history
    await supabase.from("notification_history").insert({
      notification_type: "daily_entropy",
      subject: `Daily Entropy: ${wordData.word.toUpperCase()}`,
      recipients: subscribers.map((s: any) => s.email),
      status: errors.length === 0 ? "sent" : "partial",
      error_message: errors.length > 0 ? `Failed: ${errors.join(", ")}` : null,
    });

    return new Response(
      JSON.stringify({ 
        message: `Sent daily entropy email for "${wordData.word}"`,
        sent: sentCount,
        failed: errors.length,
        word: wordData.word
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-daily-entropy:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
