import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactConfirmationRequest {
  email: string;
  feedbackType: string;
  message: string;
}

// Brand colors
const BRAND = {
  olive: "#5a6f3c",
  oliveLight: "#e8ecd9",
  oliveMuted: "#8fa06f",
  foreground: "#2d2f27",
  muted: "#6b6d64",
  background: "#fcfcfa",
  border: "#e0e2d8",
};

const feedbackTypeLabels: Record<string, string> = {
  question: "General question",
  feedback: "Feedback",
  bug: "Report an issue",
  partnership: "Partnership inquiry",
  other: "Other",
};

interface SenderSettings {
  senderName: string;
  senderEmailNoreply: string;
}

const getSenderSettings = async (): Promise<SenderSettings> => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data } = await supabase
      .from("escalation_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["sender_name", "sender_email_noreply"]);

    const settings: SenderSettings = {
      senderName: "Buoyancis",
      senderEmailNoreply: "noreply@buoyancis.com",
    };

    data?.forEach((item) => {
      if (item.setting_key === "sender_name") settings.senderName = item.setting_value;
      if (item.setting_key === "sender_email_noreply") settings.senderEmailNoreply = item.setting_value;
    });

    return settings;
  } catch (error) {
    console.error("Error fetching sender settings:", error);
    return { senderName: "Buoyancis", senderEmailNoreply: "noreply@buoyancis.com" };
  }
};

// HTML escape utility to prevent XSS
const escapeHtml = (str: string): string => {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, feedbackType, message }: ContactConfirmationRequest = await req.json();

    if (!email || !feedbackType || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get sender settings from database
    const senderSettings = await getSenderSettings();
    
    const typeLabel = feedbackTypeLabels[feedbackType] || feedbackType;
    const escapedMessage = escapeHtml(message);

    // Send confirmation email to the user
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${senderSettings.senderName} <${senderSettings.senderEmailNoreply}>`,
        to: [email],
        subject: "We received your message",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: ${BRAND.background}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <div style="max-width: 560px; margin: 0 auto; padding: 48px 24px;">
              <h2 style="font-family: 'Georgia', serif; font-size: 24px; color: ${BRAND.olive}; margin-bottom: 32px; font-weight: 500;">Buoyancis</h2>
              
              <h1 style="font-family: 'Georgia', serif; font-size: 28px; font-weight: 400; color: ${BRAND.foreground}; margin: 0 0 24px 0; line-height: 1.3;">
                Thank you for reaching out
              </h1>
              
              <p style="font-size: 16px; color: ${BRAND.muted}; line-height: 1.7; margin: 0 0 24px 0;">
                We've received your message and will get back to you as soon as possible. Here's a copy of what you sent:
              </p>
              
              <div style="background: ${BRAND.oliveLight}; padding: 24px; border-radius: 12px; margin: 24px 0; border: 1px solid ${BRAND.border};">
                <p style="margin: 0 0 12px 0; font-size: 14px; color: ${BRAND.oliveMuted}; text-transform: uppercase; letter-spacing: 0.5px;">
                  ${typeLabel}
                </p>
                <p style="margin: 0; font-size: 15px; color: ${BRAND.foreground}; line-height: 1.7; white-space: pre-wrap;">
                  ${escapedMessage}
                </p>
              </div>
              
              <p style="font-size: 16px; color: ${BRAND.muted}; line-height: 1.7; margin: 32px 0 0 0;">
                Warm regards,<br>
                <span style="color: ${BRAND.foreground};">The Buoyancis Team</span>
              </p>
              
              <hr style="border: none; border-top: 1px solid ${BRAND.border}; margin: 40px 0 24px 0;">
              <p style="font-size: 12px; color: ${BRAND.oliveMuted}; margin: 0;">
                You received this email because you submitted a message through our contact form.
              </p>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Contact confirmation email error:", emailData);
      return new Response(
        JSON.stringify({ error: "Failed to send confirmation email", details: emailData }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Contact confirmation email sent successfully:", emailData);

    return new Response(JSON.stringify({ success: true, data: emailData }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-contact-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
