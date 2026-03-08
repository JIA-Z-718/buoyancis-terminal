import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

interface ABVariant {
  name: string;
  subject: string;
}

interface BulkEmailRequest {
  emails: string[];
  subject: string;
  body: string;
  abTestEnabled?: boolean;
  variants?: ABVariant[];
}

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

  try {
    // Authenticate the request - require admin role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - no authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth error:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized - invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify admin role
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      console.error("Non-admin user attempted to send bulk email:", user.id);
      return new Response(
        JSON.stringify({ error: "Forbidden - admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { emails, subject, body, abTestEnabled, variants }: BulkEmailRequest = await req.json();

    if (!emails || emails.length === 0) {
      return new Response(
        JSON.stringify({ error: "No recipients provided" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!subject || !body) {
      return new Response(
        JSON.stringify({ error: "Subject and body are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Use the already-created admin client
    const supabase = supabaseAdmin;
    
    // Get sender settings
    const senderSettings = await getSenderSettings(supabase);
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

    const filteredEmails = emails.filter(e => {
      const emailLower = e.toLowerCase();
      return !unsubscribedSet.has(emailLower) && !bouncedSet.has(emailLower) && !complainedSet.has(emailLower);
    });
    const skippedUnsubscribed = emails.filter(e => unsubscribedSet.has(e.toLowerCase())).length;
    const skippedBounced = emails.filter(e => bouncedSet.has(e.toLowerCase())).length;
    const skippedComplained = emails.filter(e => complainedSet.has(e.toLowerCase())).length;
    const skippedCount = skippedUnsubscribed + skippedBounced + skippedComplained;

    if (filteredEmails.length === 0) {
      return new Response(
        JSON.stringify({ error: "All recipients have unsubscribed, bounced, or complained" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Determine subjects for variants
    const isABTest = abTestEnabled && variants && variants.length >= 2;
    const variantSubjects: { name: string; subject: string }[] = isABTest
      ? variants
      : [{ name: "A", subject }];

    // Create campaign record with primary subject (variant A) and audit trail
    const { data: campaign, error: campaignError } = await supabase
      .from("email_campaigns")
      .insert({
        subject: variantSubjects[0].subject,
        body,
        recipient_count: filteredEmails.length,
        created_by: user.id,
      })
      .select()
      .single();

    if (campaignError) {
      console.error("Error creating campaign:", campaignError);
      return new Response(
        JSON.stringify({ error: "Failed to create campaign record" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const campaignId = campaign.id;

    // If A/B test, create variant records
    if (isABTest) {
      const variantRecords = variantSubjects.map((v, idx) => ({
        campaign_id: campaignId,
        variant_name: v.name,
        subject: v.subject,
        recipient_count: Math.floor(filteredEmails.length / variantSubjects.length) + 
          (idx < filteredEmails.length % variantSubjects.length ? 1 : 0),
      }));

      const { error: variantError } = await supabase
        .from("ab_test_variants")
        .insert(variantRecords);

      if (variantError) {
        console.error("Error creating variant records:", variantError);
      }
    }

    // Assign each recipient to a variant
    const recipientVariants: { email: string; variant: string; subject: string }[] = filteredEmails.map(
      (email, idx) => {
        const variantIdx = idx % variantSubjects.length;
        return {
          email,
          variant: variantSubjects[variantIdx].name,
          subject: variantSubjects[variantIdx].subject,
        };
      }
    );

    // Function to wrap links with click tracking (including variant)
    const wrapLinksWithTracking = (html: string, recipientEmail: string, variant: string) => {
      const encodedEmail = btoa(recipientEmail);
      const encodedVariant = btoa(variant);
      return html.replace(
        /href="(https?:\/\/[^"]+)"/g,
        (match, url) => {
          if (url.includes('/functions/v1/track-')) {
            return match;
          }
          const encodedUrl = btoa(url);
          const trackingUrl = `${SUPABASE_URL}/functions/v1/track-email-click?c=${campaignId}&e=${encodedEmail}&u=${encodedUrl}&v=${encodedVariant}`;
          return `href="${trackingUrl}"`;
        }
      );
    };

    // Fetch first names from database for personalization
    const { data: signupData } = await supabase
      .from("early_access_signups")
      .select("email, first_name, last_name");
    
    const nameMap = new Map<string, { firstName: string; lastName: string }>();
    (signupData || []).forEach((s) => {
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
    const htmlBody = body
      .split('\n\n')
      .map(paragraph => `<p style="font-size: 16px; color: ${BRAND.muted}; line-height: 1.7; margin: 0 0 16px 0;">${paragraph.replace(/\n/g, '<br>')}</p>`)
      .join('');

    // Build branded email template with tracking pixel (including variant)
    const buildEmailHtml = (recipientEmail: string, emailSubject: string, variant: string) => {
      const encodedEmail = btoa(recipientEmail);
      const encodedVariant = btoa(variant);
      const trackingPixelUrl = `${SUPABASE_URL}/functions/v1/track-email-open?c=${campaignId}&e=${encodedEmail}&v=${encodedVariant}`;
      
      // Apply merge tags to subject and body
      const personalizedSubject = replaceMergeTags(emailSubject, recipientEmail);
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
            <!-- Logo -->
            <img src="${LOGO_URL}" alt="Buoyancis" style="height: 40px; margin-bottom: 32px;" />
            
            <!-- Main Content -->
            <h1 style="font-family: 'Georgia', serif; font-size: 28px; font-weight: 400; color: ${BRAND.foreground}; margin: 0 0 24px 0; line-height: 1.3;">
              ${personalizedSubject}
            </h1>
            
            ${personalizedBody}
            
            <p style="font-size: 16px; color: ${BRAND.muted}; line-height: 1.7; margin: 32px 0 0 0;">
              Warm regards,<br>
              <span style="color: ${BRAND.foreground};">The Buoyancis Team</span>
            </p>
            
            <!-- Footer -->
            <hr style="border: none; border-top: 1px solid ${BRAND.border}; margin: 40px 0 24px 0;">
            <p style="font-size: 12px; color: ${BRAND.oliveMuted}; margin: 0 0 8px 0;">
              You received this email because you signed up for early access at Buoyancis.
            </p>
            <p style="font-size: 12px; color: ${BRAND.oliveMuted}; margin: 0;">
              <a href="${SUPABASE_URL}/functions/v1/unsubscribe?e=${encodedEmail}" style="color: ${BRAND.oliveMuted}; text-decoration: underline;">Unsubscribe</a>
            </p>
            
            <!-- Tracking Pixel -->
            <img src="${trackingPixelUrl}" alt="" width="1" height="1" style="display:none !important; width:1px !important; height:1px !important;" />
          </div>
        </body>
        </html>
      `;
      
      return wrapLinksWithTracking(baseHtml, recipientEmail, variant);
    };

    // Send emails in batches
    const BATCH_SIZE = 50;
    const results: { success: string[]; failed: string[] } = { success: [], failed: [] };

    for (let i = 0; i < recipientVariants.length; i += BATCH_SIZE) {
      const batch = recipientVariants.slice(i, i + BATCH_SIZE);
      
      const promises = batch.map(async ({ email, variant, subject: emailSubject }) => {
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
              subject: emailSubject,
              html: buildEmailHtml(email, emailSubject, variant),
            }),
          });

          const data = await response.json();

          if (response.ok) {
            results.success.push(email);
          } else {
            console.error(`Failed to send to ${email}:`, data);
            results.failed.push(email);
          }
        } catch (err) {
          console.error(`Error sending to ${email}:`, err);
          results.failed.push(email);
        }
      });

      await Promise.all(promises);
      
      if (i + BATCH_SIZE < recipientVariants.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`Bulk email complete: campaign=${campaignId}, ${results.success.length} sent, ${results.failed.length} failed, A/B test=${isABTest}`);

    return new Response(
      JSON.stringify({
        success: true,
        campaignId,
        sent: results.success.length,
        failed: results.failed.length,
        failedEmails: results.failed,
        skipped: skippedCount,
        skippedBounced,
        skippedUnsubscribed,
        skippedComplained,
        abTest: isABTest,
        variants: isABTest ? variantSubjects.map(v => v.name) : undefined,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-bulk-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
