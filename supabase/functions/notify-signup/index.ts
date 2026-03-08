import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SignupNotificationRequest {
  email: string;
  firstName?: string;
  lastName?: string;
  logoUrl?: string;
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
  signupsEnabled: boolean;
}

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

const getNotificationSettings = async (): Promise<NotificationSettings> => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from("escalation_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["admin_notification_email", "notify_signups_enabled"]);

    if (error) {
      console.error("Error fetching notification settings:", error);
      return { adminEmails: [DEFAULT_ADMIN_EMAIL], signupsEnabled: true };
    }

    const settings: NotificationSettings = {
      adminEmails: [DEFAULT_ADMIN_EMAIL],
      signupsEnabled: true,
    };

    data?.forEach((item) => {
      if (item.setting_key === "admin_notification_email" && item.setting_value) {
        // Parse comma-separated emails
        settings.adminEmails = item.setting_value.split(",").map((e: string) => e.trim()).filter(Boolean);
      }
      if (item.setting_key === "notify_signups_enabled") {
        settings.signupsEnabled = item.setting_value === "true";
      }
    });

    return settings;
  } catch (error) {
    console.error("Error in getNotificationSettings:", error);
    return { adminEmails: [DEFAULT_ADMIN_EMAIL], signupsEnabled: true };
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName, lastName, logoUrl }: SignupNotificationRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Missing email" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get notification and sender settings from database
    const settings = await getNotificationSettings();
    const senderSettings = await getSenderSettings();

    // Build logo HTML if provided
    const logoHtml = logoUrl 
      ? `<img src="${logoUrl}" alt="${senderSettings.senderName}" style="height: 40px; margin-bottom: 32px;" />`
      : `<h2 style="font-family: 'Georgia', serif; font-size: 24px; color: ${BRAND.olive}; margin-bottom: 32px; font-weight: 500;">${senderSettings.senderName}</h2>`;

    // Send welcome email to the user (always sent)
    const welcomeEmailPromise = fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${senderSettings.senderName} <${senderSettings.senderEmailNoreply}>`,
        to: [email],
        subject: "Welcome to Buoyancis",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: ${BRAND.background}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <div style="max-width: 560px; margin: 0 auto; padding: 48px 24px;">
              ${logoHtml}
              <h1 style="font-family: 'Georgia', serif; font-size: 28px; font-weight: 400; color: ${BRAND.foreground}; margin: 0 0 24px 0; line-height: 1.3;">
                You're on the list
              </h1>
              <p style="font-size: 16px; color: ${BRAND.muted}; line-height: 1.7; margin: 0 0 20px 0;">
                Thank you for your interest in Buoyancis — a theory of structure in motion. We're exploring how trust, order, and systems persist or decay over time.
              </p>
              <div style="background: ${BRAND.oliveLight}; padding: 24px; border-radius: 12px; margin: 32px 0; border: 1px solid ${BRAND.border};">
                <p style="margin: 0 0 16px 0; font-size: 15px; color: ${BRAND.foreground}; font-weight: 500;">
                  What happens next?
                </p>
                <ul style="margin: 0; padding-left: 20px; color: ${BRAND.muted}; font-size: 15px; line-height: 1.8;">
                  <li style="margin-bottom: 6px;">We'll share updates as the work unfolds</li>
                  <li style="margin-bottom: 6px;">You'll be among the first to engage with the ideas</li>
                  <li>We may reach out for your perspective</li>
                </ul>
              </div>
              <p style="font-size: 16px; color: ${BRAND.muted}; line-height: 1.7; margin: 0 0 32px 0;">
                Feel free to reply to this email if you have questions or thoughts to share. We read every response.
              </p>
              <p style="font-size: 16px; color: ${BRAND.muted}; line-height: 1.7; margin: 0;">
                Warm regards,<br>
                <span style="color: ${BRAND.foreground};">The Buoyancis Team</span>
              </p>
              <hr style="border: none; border-top: 1px solid ${BRAND.border}; margin: 40px 0 24px 0;">
              <p style="font-size: 12px; color: ${BRAND.oliveMuted}; margin: 0;">
                You received this email because you signed up at Buoyancis.
              </p>
            </div>
          </body>
          </html>
        `,
      }),
    });

    // Prepare admin notification (only if enabled)
    let adminEmailPromise: Promise<Response> | null = null;
    
    if (settings.signupsEnabled && settings.adminEmails.length > 0) {
      const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Not provided";
      adminEmailPromise = fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: `${senderSettings.senderName} <${senderSettings.senderEmailNoreply}>`,
          to: settings.adminEmails,
          subject: "🎉 New Early Access Signup!",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #333;">New Early Access Signup</h1>
              <p style="font-size: 16px; color: #666;">
                Great news! Someone just signed up for early access.
              </p>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0 0 10px; font-size: 18px;">
                  <strong>Name:</strong> ${fullName}
                </p>
                <p style="margin: 0; font-size: 18px;">
                  <strong>Email:</strong> ${email}
                </p>
                <p style="margin: 10px 0 0; font-size: 14px; color: #888;">
                  Signed up at: ${new Date().toISOString()}
                </p>
              </div>
              <p style="font-size: 14px; color: #888;">
                View all signups in your admin dashboard.
              </p>
            </div>
          `,
        }),
      });
    } else {
      console.log("Signup notifications disabled, skipping admin email");
    }

    // Send emails
    const welcomeResponse = await welcomeEmailPromise;
    const welcomeData = await welcomeResponse.json();

    let adminData = null;
    if (adminEmailPromise) {
      const adminResponse = await adminEmailPromise;
      adminData = await adminResponse.json();
      
      // Log to notification history
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      await supabase.from("notification_history").insert({
        notification_type: "signup",
        recipients: settings.adminEmails,
        subject: "🎉 New Early Access Signup!",
        status: adminResponse.ok ? "sent" : "failed",
        error_message: adminResponse.ok ? null : JSON.stringify(adminData),
      });
      
      if (!adminResponse.ok) {
        console.error("Admin notification error:", adminData);
      } else {
        console.log("Admin notification sent successfully:", adminData);
      }
    }

    if (!welcomeResponse.ok) {
      console.error("Welcome email error:", welcomeData);
    } else {
      console.log("Welcome email sent successfully:", welcomeData);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      welcomeEmail: welcomeData,
      adminNotification: adminData,
      adminNotificationSkipped: !settings.signupsEnabled,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in notify-signup function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
