import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

interface AdminWithoutMFA {
  userId: string;
  email: string;
  displayName: string;
  adminSince: string;
  daysSinceAssignment: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate cron secret for scheduled invocations
    const cronSecret = req.headers.get("x-cron-secret");
    const expectedSecret = Deno.env.get("CRON_SECRET");
    
    // Allow either cron secret or admin authorization
    const authHeader = req.headers.get("Authorization");
    let isAuthorized = false;
    
    if (cronSecret && expectedSecret && cronSecret === expectedSecret) {
      isAuthorized = true;
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // If not cron, verify admin authorization
    if (!isAuthorized && authHeader) {
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: { user }, error: userError } = await userClient.auth.getUser();
      if (!userError && user) {
        const { data: roleData } = await adminClient
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .single();

        if (roleData) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if reminders are enabled
    const { data: enabledSetting } = await adminClient
      .from("mfa_settings")
      .select("setting_value")
      .eq("setting_key", "mfa_enrollment_reminder_enabled")
      .single();

    if (!enabledSetting?.setting_value) {
      return new Response(
        JSON.stringify({ message: "MFA enrollment reminders are disabled", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get reminder settings
    const { data: reminderDaysSetting } = await adminClient
      .from("alert_settings")
      .select("setting_value")
      .eq("setting_key", "mfa_enrollment_reminder_days")
      .single();

    const { data: frequencySetting } = await adminClient
      .from("alert_settings")
      .select("setting_value")
      .eq("setting_key", "mfa_enrollment_reminder_frequency_days")
      .single();

    const reminderDays = reminderDaysSetting?.setting_value ?? 3;
    const frequencyDays = frequencySetting?.setting_value ?? 1;

    // Get all admin users
    const { data: adminRoles } = await adminClient
      .from("user_roles")
      .select("user_id, created_at")
      .eq("role", "admin");

    if (!adminRoles || adminRoles.length === 0) {
      return new Response(
        JSON.stringify({ message: "No admin users found", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get admin user details
    const { data: { users: allUsers } } = await adminClient.auth.admin.listUsers();
    
    const adminsWithoutMFA: AdminWithoutMFA[] = [];

    for (const adminRole of adminRoles) {
      const adminUser = allUsers?.find((u) => u.id === adminRole.user_id);
      if (!adminUser) continue;

      // Check if admin has MFA enrolled
      const { data: factorsData } = await adminClient.auth.admin.mfa.listFactors({
        userId: adminUser.id,
      });

      const verifiedTotpFactors = factorsData?.factors?.filter(
        (f: { factor_type: string; status: string }) => 
          f.factor_type === "totp" && f.status === "verified"
      ) || [];

      // Check for passkeys
      const { data: passkeys } = await adminClient
        .from("passkey_credentials")
        .select("id")
        .eq("user_id", adminUser.id);

      const hasAnyMFA = verifiedTotpFactors.length > 0 || (passkeys?.length || 0) > 0;

      if (!hasAnyMFA) {
        const adminSince = new Date(adminRole.created_at);
        const now = new Date();
        const daysSinceAssignment = Math.floor(
          (now.getTime() - adminSince.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Only include if they've been admin for longer than reminder threshold
        if (daysSinceAssignment >= reminderDays) {
          adminsWithoutMFA.push({
            userId: adminUser.id,
            email: adminUser.email || "",
            displayName: adminUser.user_metadata?.display_name || adminUser.email?.split("@")[0] || "Admin",
            adminSince: adminRole.created_at,
            daysSinceAssignment,
          });
        }
      }
    }

    if (adminsWithoutMFA.length === 0) {
      return new Response(
        JSON.stringify({ message: "All admins have MFA enrolled", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check which admins haven't received a reminder recently
    const adminsToRemind: AdminWithoutMFA[] = [];
    const frequencyMs = frequencyDays * 24 * 60 * 60 * 1000;

    for (const admin of adminsWithoutMFA) {
      const { data: lastReminder } = await adminClient
        .from("mfa_enrollment_reminders")
        .select("sent_at")
        .eq("user_id", admin.userId)
        .order("sent_at", { ascending: false })
        .limit(1)
        .single();

      if (!lastReminder) {
        adminsToRemind.push(admin);
      } else {
        const lastSent = new Date(lastReminder.sent_at);
        const timeSinceLastReminder = Date.now() - lastSent.getTime();
        if (timeSinceLastReminder >= frequencyMs) {
          adminsToRemind.push(admin);
        }
      }
    }

    if (adminsToRemind.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: "All unenrolled admins have been reminded recently", 
          unenrolledCount: adminsWithoutMFA.length,
          sent: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get email sender settings
    const { data: senderSettings } = await adminClient
      .from("escalation_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["sender_name", "noreply_email"]);

    const senderName = senderSettings?.find((s) => s.setting_key === "sender_name")?.setting_value || "Buoyancis Security";
    const noreplyEmail = senderSettings?.find((s) => s.setting_key === "noreply_email")?.setting_value || "noreply@buoyancis.com";

    // Send reminder emails
    const sentReminders: { userId: string; email: string }[] = [];
    const errors: { email: string; error: string }[] = [];

    if (resendApiKey) {
      const resend = new Resend(resendApiKey);

      for (const admin of adminsToRemind) {
        try {
          await resend.emails.send({
            from: `${senderName} <${noreplyEmail}>`,
            to: [admin.email],
            subject: "🔐 Security Reminder: Enable Multi-Factor Authentication",
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: Georgia, serif; margin: 0; padding: 0; background-color: #f5f5f0;">
                <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                  <div style="background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                    <div style="text-align: center; margin-bottom: 30px;">
                      <img src="https://i.imgur.com/nTpVGYt.png" alt="Buoyancis" style="height: 40px;">
                    </div>
                    
                    <h1 style="color: #5a6f3c; font-size: 24px; margin-bottom: 20px; text-align: center;">
                      Multi-Factor Authentication Required
                    </h1>
                    
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">
                      Hi ${admin.displayName},
                    </p>
                    
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">
                      You've been an administrator for <strong>${admin.daysSinceAssignment} days</strong> but haven't yet enabled Multi-Factor Authentication (MFA) on your account.
                    </p>
                    
                    <div style="background: #fef3cd; border-left: 4px solid #f0ad4e; padding: 15px; margin: 25px 0; border-radius: 4px;">
                      <p style="color: #856404; margin: 0; font-size: 14px;">
                        <strong>⚠️ Security Notice:</strong> MFA is required for all admin accounts to protect sensitive data and prevent unauthorized access.
                      </p>
                    </div>
                    
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">
                      Please log in to the admin dashboard and enable MFA using one of these methods:
                    </p>
                    
                    <ul style="color: #333; font-size: 16px; line-height: 1.8;">
                      <li><strong>Authenticator App</strong> - Use Google Authenticator, Authy, or similar</li>
                      <li><strong>Passkey</strong> - Use Face ID, Touch ID, or Windows Hello</li>
                      <li><strong>SMS Verification</strong> - Receive codes via text message</li>
                    </ul>
                    
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${Deno.env.get("SITE_URL") || "https://buoyancis.com"}/admin" 
                         style="display: inline-block; background: #5a6f3c; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                        Enable MFA Now
                      </a>
                    </div>
                    
                    <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 30px;">
                      If you have any questions about setting up MFA, please contact your system administrator.
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    
                    <p style="color: #999; font-size: 12px; text-align: center;">
                      This is an automated security reminder from Buoyancis.
                    </p>
                  </div>
                </div>
              </body>
              </html>
            `,
          });

          // Record the reminder
          await adminClient.from("mfa_enrollment_reminders").insert({
            user_id: admin.userId,
            user_email: admin.email,
            reminder_type: "enrollment_reminder",
          });

          sentReminders.push({ userId: admin.userId, email: admin.email });
        } catch (emailError: unknown) {
          const errorMessage = emailError instanceof Error ? emailError.message : "Unknown error";
          errors.push({ email: admin.email, error: errorMessage });
          console.error(`Failed to send reminder to ${admin.email}:`, emailError);
        }
      }
    } else {
      console.warn("RESEND_API_KEY not configured, skipping email sending");
      return new Response(
        JSON.stringify({ 
          error: "Email service not configured",
          adminsNeedingReminder: adminsToRemind.map(a => a.email),
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log notification
    await adminClient.from("notification_history").insert({
      notification_type: "mfa_enrollment_reminder",
      recipients: sentReminders.map((r) => r.email),
      subject: "MFA Enrollment Reminder",
      status: errors.length === 0 ? "sent" : "partial",
      error_message: errors.length > 0 ? JSON.stringify(errors) : null,
    });

    return new Response(
      JSON.stringify({
        message: `Sent ${sentReminders.length} MFA enrollment reminders`,
        sent: sentReminders.length,
        errors: errors.length > 0 ? errors : undefined,
        recipients: sentReminders.map((r) => r.email),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in notify-mfa-enrollment-reminder:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
