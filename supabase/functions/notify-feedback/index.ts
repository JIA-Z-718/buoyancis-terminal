import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { rateLimitMiddleware } from "../_shared/rate-limiter.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface FeedbackNotificationRequest {
  feedbackType: string;
  message: string;
  email?: string;
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

const DEFAULT_ADMIN_EMAIL = "jiazhang718@gmail.com";

interface NotificationSettings {
  adminEmails: string[];
  feedbackEnabled: boolean;
}

interface SenderSettings {
  senderName: string;
  senderEmailNoreply: string;
}

const feedbackTypeLabels: Record<string, string> = {
  general: "General feedback",
  feature: "Feature request",
  issue: "Bug report / Issue",
};

const feedbackTypeEmoji: Record<string, string> = {
  general: "💬",
  feature: "💡",
  issue: "🐛",
};

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

const getNotificationSettings = async (): Promise<NotificationSettings> => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from("escalation_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["admin_notification_email", "notify_feedback_enabled"]);

    if (error) {
      console.error("Error fetching notification settings:", error);
      return { adminEmails: [DEFAULT_ADMIN_EMAIL], feedbackEnabled: true };
    }

    const settings: NotificationSettings = {
      adminEmails: [DEFAULT_ADMIN_EMAIL],
      feedbackEnabled: true,
    };

    data?.forEach((item) => {
      if (item.setting_key === "admin_notification_email" && item.setting_value) {
        settings.adminEmails = item.setting_value.split(",").map((e: string) => e.trim()).filter(Boolean);
      }
      if (item.setting_key === "notify_feedback_enabled") {
        settings.feedbackEnabled = item.setting_value === "true";
      }
    });

    return settings;
  } catch (error) {
    console.error("Error in getNotificationSettings:", error);
    return { adminEmails: [DEFAULT_ADMIN_EMAIL], feedbackEnabled: true };
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

  // Only allow POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  // Rate limiting (defense in depth). This endpoint is called by submit-feedback.
  const rateLimitResponse = rateLimitMiddleware(
    req,
    { maxRequests: 10, windowMs: 60 * 1000, identifier: "notify-feedback" },
    corsHeaders
  );
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { feedbackType, message, email }: FeedbackNotificationRequest = await req.json();

    if (!feedbackType || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get notification and sender settings from database
    const settings = await getNotificationSettings();
    const senderSettings = await getSenderSettings();

    // Check if feedback notifications are enabled
    if (!settings.feedbackEnabled || settings.adminEmails.length === 0) {
      console.log("Feedback notifications disabled, skipping admin email");
      return new Response(JSON.stringify({ 
        success: true, 
        skipped: true,
        reason: "Feedback notifications disabled",
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const typeLabel = feedbackTypeLabels[feedbackType] || feedbackType;
    const typeEmoji = feedbackTypeEmoji[feedbackType] || "📝";
    const escapedMessage = escapeHtml(message);
    const userEmail = email ? escapeHtml(email) : "Not provided";

    // Determine priority badge color based on feedback type
    const priorityColor = feedbackType === "issue" ? "#dc2626" : 
                          feedbackType === "feature" ? "#2563eb" : 
                          BRAND.olive;

    // Send notification to admins
    const adminEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${senderSettings.senderName} <${senderSettings.senderEmailNoreply}>`,
        to: settings.adminEmails,
        subject: `${typeEmoji} New Feedback: ${typeLabel}`,
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
                New User Feedback Received
              </h1>
              
              <div style="display: inline-block; padding: 6px 12px; background: ${priorityColor}; color: white; border-radius: 6px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 24px;">
                ${typeLabel}
              </div>
              
              <div style="background: ${BRAND.oliveLight}; padding: 24px; border-radius: 12px; margin: 0 0 24px 0; border: 1px solid ${BRAND.border};">
                <p style="margin: 0 0 16px 0; font-size: 14px; color: ${BRAND.oliveMuted}; text-transform: uppercase; letter-spacing: 0.5px;">
                  Message
                </p>
                <p style="margin: 0; font-size: 15px; color: ${BRAND.foreground}; line-height: 1.7; white-space: pre-wrap;">
                  ${escapedMessage}
                </p>
              </div>
              
              <div style="background: #f8f8f6; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0; font-size: 14px; color: ${BRAND.muted};">
                  <strong>Contact Email:</strong> ${userEmail}
                </p>
                <p style="margin: 0; font-size: 14px; color: ${BRAND.muted};">
                  <strong>Submitted:</strong> ${new Date().toISOString()}
                </p>
              </div>
              
              <p style="font-size: 14px; color: ${BRAND.muted}; line-height: 1.7; margin: 0;">
                View and manage all feedback in your admin dashboard.
              </p>
              
              <hr style="border: none; border-top: 1px solid ${BRAND.border}; margin: 40px 0 24px 0;">
              <p style="font-size: 12px; color: ${BRAND.oliveMuted}; margin: 0;">
                This is an automated notification from your Buoyancis feedback system.
              </p>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const emailData = await adminEmailResponse.json();

    // Log to notification history
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    await supabase.from("notification_history").insert({
      notification_type: "feedback",
      recipients: settings.adminEmails,
      subject: `${typeEmoji} New Feedback: ${typeLabel}`,
      status: adminEmailResponse.ok ? "sent" : "failed",
      error_message: adminEmailResponse.ok ? null : JSON.stringify(emailData),
    });

    if (!adminEmailResponse.ok) {
      console.error("Feedback notification error:", emailData);
      return new Response(
        JSON.stringify({ error: "Failed to send notification", details: emailData }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Feedback notification sent successfully:", emailData);

    return new Response(JSON.stringify({ success: true, data: emailData }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in notify-feedback function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
