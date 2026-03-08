import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { rateLimitMiddleware } from "../_shared/rate-limiter.ts";
import { validateCronSecret } from "../_shared/cron-auth.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

// Rate limit: 5 requests per minute per IP (tightened for cron endpoints)
const RATE_LIMIT_CONFIG = {
  maxRequests: 5,
  windowMs: 60 * 1000,
  identifier: "process-scheduled-emails",
};

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

const LOGO_URL = "https://i.imgur.com/nTpVGYt.png";

interface SenderSettings {
  senderName: string;
  senderEmailNoreply: string;
}

const getSenderSettings = async (supabase: any): Promise<SenderSettings> => {
  try {
    const { data } = await supabase
      .from("escalation_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["sender_name", "sender_email_noreply"]);
    
    const settings: SenderSettings = {
      senderName: "Buoyancis",
      senderEmailNoreply: "noreply@buoyancis.com",
    };

    data?.forEach((item: any) => {
      if (item.setting_key === "sender_name") settings.senderName = item.setting_value;
      if (item.setting_key === "sender_email_noreply") settings.senderEmailNoreply = item.setting_value;
    });

    return settings;
  } catch (error) {
    console.error("Error fetching sender settings:", error);
    return { senderName: "Buoyancis", senderEmailNoreply: "noreply@buoyancis.com" };
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Apply rate limiting
  const rateLimitResponse = rateLimitMiddleware(req, RATE_LIMIT_CONFIG, corsHeaders);
  if (rateLimitResponse) return rateLimitResponse;

  // Validate cron secret
  const cronAuth = await validateCronSecret(req);
  if (!cronAuth.authorized) return cronAuth.response!;

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get sender settings
    const senderSettings = await getSenderSettings(supabase);

    // Find pending scheduled emails that are due
    const { data: scheduledEmails, error: fetchError } = await supabase
      .from("scheduled_emails")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_for", new Date().toISOString())
      .limit(10);

    if (fetchError) {
      console.error("Error fetching scheduled emails:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch scheduled emails" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!scheduledEmails || scheduledEmails.length === 0) {
      return new Response(
        JSON.stringify({ message: "No scheduled emails to process" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const results: { id: string; success: boolean; sent?: number; failed?: number }[] = [];

    for (const scheduled of scheduledEmails) {
      // Mark as processing
      await supabase
        .from("scheduled_emails")
        .update({ status: "processing" })
        .eq("id", scheduled.id);

      try {
        // Filter out unsubscribed emails
        const { data: unsubscribed } = await supabase
          .from("email_unsubscribes")
          .select("email");
        
        const unsubscribedSet = new Set((unsubscribed || []).map(u => u.email.toLowerCase()));

        // Filter out bounced emails
        const { data: bounced } = await supabase
          .from("email_bounces")
          .select("email");
        
        const bouncedSet = new Set((bounced || []).map(b => b.email.toLowerCase()));

        // Filter out complained emails
        const { data: complained } = await supabase
          .from("email_complaints")
          .select("email");
        
        const complainedSet = new Set((complained || []).map(c => c.email.toLowerCase()));

        const filteredEmails = scheduled.emails.filter((e: string) => {
          const emailLower = e.toLowerCase();
          return !unsubscribedSet.has(emailLower) && !bouncedSet.has(emailLower) && !complainedSet.has(emailLower);
        });

        if (filteredEmails.length === 0) {
          await supabase
            .from("scheduled_emails")
            .update({ 
              status: "failed",
              error_message: "All recipients have unsubscribed, bounced, or complained"
            })
            .eq("id", scheduled.id);
          results.push({ id: scheduled.id, success: false });
          continue;
        }

        // Create campaign record
        const { data: campaign, error: campaignError } = await supabase
          .from("email_campaigns")
          .insert({
            subject: scheduled.subject,
            body: scheduled.body,
            recipient_count: filteredEmails.length,
          })
          .select()
          .single();

        if (campaignError) {
          throw new Error("Failed to create campaign record");
        }

        const campaignId = campaign.id;

        // Function to wrap links with click tracking
        const wrapLinksWithTracking = (html: string, recipientEmail: string) => {
          const encodedEmail = btoa(recipientEmail);
          return html.replace(
            /href="(https?:\/\/[^"]+)"/g,
            (match, url) => {
              if (url.includes('/functions/v1/track-')) {
                return match;
              }
              const encodedUrl = btoa(url);
              const trackingUrl = `${SUPABASE_URL}/functions/v1/track-email-click?c=${campaignId}&e=${encodedEmail}&u=${encodedUrl}`;
              return `href="${trackingUrl}"`;
            }
          );
        };

        // Fetch first names from database for personalization
        const { data: signupData } = await supabase
          .from("early_access_signups")
          .select("email, first_name, last_name");
        
        const nameMap = new Map<string, { firstName: string; lastName: string }>();
        (signupData || []).forEach((s: any) => {
          nameMap.set(s.email.toLowerCase(), { 
            firstName: s.first_name || "", 
            lastName: s.last_name || "" 
          });
        });

        // HTML escape function to prevent XSS in email templates
        const escapeHtml = (str: string): string => {
          return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
        };

        // Replace merge tags with personalized values (HTML-escaped for security)
        const replaceMergeTags = (text: string, email: string) => {
          const emailLower = email.toLowerCase();
          const names = nameMap.get(emailLower);
          const firstName = escapeHtml(names?.firstName || "");
          const lastName = escapeHtml(names?.lastName || "");
          const fullName = [firstName, lastName].filter(Boolean).join(" ");
          
          // Fallback to email username if no name available
          const username = email.split("@")[0];
          const fallbackName = escapeHtml(username.charAt(0).toUpperCase() + username.slice(1).replace(/[._-]/g, " "));
          const safeEmail = escapeHtml(email);
          
          return text
            .replace(/\{\{email\}\}/gi, safeEmail)
            .replace(/\{\{first_name\}\}/gi, firstName || fallbackName)
            .replace(/\{\{last_name\}\}/gi, lastName)
            .replace(/\{\{name\}\}/gi, fullName || fallbackName)
            .replace(/\{\{username\}\}/gi, escapeHtml(username));
        };

        // Convert markdown-style line breaks to HTML
        const htmlBody = scheduled.body
          .split('\n\n')
          .map((paragraph: string) => `<p style="font-size: 16px; color: ${BRAND.muted}; line-height: 1.7; margin: 0 0 16px 0;">${paragraph.replace(/\n/g, '<br>')}</p>`)
          .join('');

        // Build branded email template with tracking pixel
        const buildEmailHtml = (recipientEmail: string) => {
          const encodedEmail = btoa(recipientEmail);
          const trackingPixelUrl = `${SUPABASE_URL}/functions/v1/track-email-open?c=${campaignId}&e=${encodedEmail}`;
          
          // Apply merge tags to subject and body
          const personalizedSubject = replaceMergeTags(scheduled.subject, recipientEmail);
          const personalizedBody = replaceMergeTags(htmlBody, recipientEmail);
          
          const baseHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; background-color: ${BRAND.background}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
              <div style="max-width: 560px; margin: 0 auto; padding: 48px 24px;">
                <img src="${LOGO_URL}" alt="Buoyancis" style="height: 40px; margin-bottom: 32px;" />
                <h1 style="font-family: 'Georgia', serif; font-size: 28px; font-weight: 400; color: ${BRAND.foreground}; margin: 0 0 24px 0; line-height: 1.3;">
                  ${personalizedSubject}
                </h1>
                ${personalizedBody}
                <p style="font-size: 16px; color: ${BRAND.muted}; line-height: 1.7; margin: 32px 0 0 0;">
                  Warm regards,<br>
                  <span style="color: ${BRAND.foreground};">The Buoyancis Team</span>
                </p>
                <hr style="border: none; border-top: 1px solid ${BRAND.border}; margin: 40px 0 24px 0;">
                <p style="font-size: 12px; color: ${BRAND.oliveMuted}; margin: 0 0 8px 0;">
                  You received this email because you signed up for early access at Buoyancis.
                </p>
                <p style="font-size: 12px; color: ${BRAND.oliveMuted}; margin: 0;">
                  <a href="${SUPABASE_URL}/functions/v1/unsubscribe?e=${encodedEmail}" style="color: ${BRAND.oliveMuted}; text-decoration: underline;">Unsubscribe</a>
                </p>
                <img src="${trackingPixelUrl}" alt="" width="1" height="1" style="display:none !important; width:1px !important; height:1px !important;" />
              </div>
            </body>
            </html>
          `;
          
          return wrapLinksWithTracking(baseHtml, recipientEmail);
        };

        // Send emails in batches
        const BATCH_SIZE = 50;
        const sendResults: { success: string[]; failed: string[] } = { success: [], failed: [] };

        for (let i = 0; i < filteredEmails.length; i += BATCH_SIZE) {
          const batch = filteredEmails.slice(i, i + BATCH_SIZE);
          
          const promises = batch.map(async (email: string) => {
            try {
              const response = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${RESEND_API_KEY}`,
                },
                body: JSON.stringify({
                  from: `${senderSettings.senderName} <${senderSettings.senderEmailNoreply}>`,
                  to: [email],
                  subject: scheduled.subject,
                  html: buildEmailHtml(email),
                }),
              });

              const data = await response.json();

              if (response.ok) {
                sendResults.success.push(email);
              } else {
                console.error(`Failed to send to ${email}:`, data);
                sendResults.failed.push(email);
              }
            } catch (err) {
              console.error(`Error sending to ${email}:`, err);
              sendResults.failed.push(email);
            }
          });

          await Promise.all(promises);
          
          if (i + BATCH_SIZE < filteredEmails.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        // Mark as sent
        await supabase
          .from("scheduled_emails")
          .update({ 
            status: "sent", 
            sent_at: new Date().toISOString() 
          })
          .eq("id", scheduled.id);

        results.push({
          id: scheduled.id,
          success: true,
          sent: sendResults.success.length,
          failed: sendResults.failed.length,
        });

        console.log(`Scheduled email ${scheduled.id} sent: ${sendResults.success.length} success, ${sendResults.failed.length} failed`);

      } catch (error: any) {
        console.error(`Error processing scheduled email ${scheduled.id}:`, error);
        
        await supabase
          .from("scheduled_emails")
          .update({ 
            status: "failed", 
            error_message: error.message 
          })
          .eq("id", scheduled.id);

        results.push({
          id: scheduled.id,
          success: false,
        });
      }
    }

    return new Response(
      JSON.stringify({ processed: results.length, results }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in process-scheduled-emails:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
