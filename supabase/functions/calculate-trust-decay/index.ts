import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { validateCronSecret } from "../_shared/cron-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TrustProfile {
  id: string;
  user_id: string;
  resonance_frequency: number;
  base_frequency: number;
  last_observation_at: string | null;
  current_tier: number;
  is_incubated: boolean;
  incubation_expires_at: string | null;
  created_at: string;
}

interface DecayResult {
  user_id: string;
  previous_frequency: number;
  new_frequency: number;
  decay_amount: number;
  days_since_observation: number;
  tier_before: number;
  tier_after: number;
  at_risk: boolean;
}

const tierThresholds = [
  { tier: 1, name: "Observer", threshold: 0 },
  { tier: 2, name: "Witness", threshold: 10 },
  { tier: 3, name: "Guardian", threshold: 50 },
  { tier: 4, name: "Sage", threshold: 200 },
  { tier: 5, name: "Oracle", threshold: 500 },
];

function getTierForFrequency(frequency: number): number {
  for (let i = tierThresholds.length - 1; i >= 0; i--) {
    if (frequency >= tierThresholds[i].threshold) {
      return tierThresholds[i].tier;
    }
  }
  return 1;
}

function getTierName(tier: number): string {
  return tierThresholds[tier - 1]?.name || "Observer";
}

function calculateDaysSince(dateStr: string | null, fallbackDate: string): number {
  const date = dateStr ? new Date(dateStr) : new Date(fallbackDate);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate cron secret for scheduled execution
    const cronValidation = await validateCronSecret(req);
    if (!cronValidation.authorized) {
      return cronValidation.response || new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get sovereignty settings
    const { data: settingsData } = await supabase
      .from("sovereignty_settings")
      .select("setting_key, setting_value");

    const settings: Record<string, number> = {};
    (settingsData || []).forEach((s: { setting_key: string; setting_value: unknown }) => {
      const value = typeof s.setting_value === "string" 
        ? JSON.parse(s.setting_value) 
        : s.setting_value;
      settings[s.setting_key] = typeof value === "number" ? value : Number(value);
    });

    const halfLifeDays = settings.decay_half_life_days || 30;
    const demotionWarningThreshold = 0.15; // Warn when within 15% of next tier threshold

    // Fetch all trust profiles
    const { data: profiles, error: profileError } = await supabase
      .from("trust_profiles")
      .select("*");

    if (profileError) {
      throw new Error(`Failed to fetch profiles: ${profileError.message}`);
    }

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ message: "No profiles to process", processed: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const decayResults: DecayResult[] = [];
    const atRiskUsers: DecayResult[] = [];

    // Process each profile
    for (const profile of profiles as TrustProfile[]) {
      const daysSinceObservation = calculateDaysSince(
        profile.last_observation_at,
        profile.created_at
      );

      // Skip if observed today
      if (daysSinceObservation === 0) continue;

      // Calculate decay using half-life formula: N(t) = N₀ × (0.5)^(t/t½)
      const decayFactor = Math.pow(0.5, daysSinceObservation / halfLifeDays);
      const newFrequency = Math.max(
        profile.base_frequency,
        profile.resonance_frequency * decayFactor
      );
      const decayAmount = profile.resonance_frequency - newFrequency;

      // Only update if there's meaningful decay
      if (decayAmount < 0.001) continue;

      const tierBefore = profile.current_tier;
      const tierAfter = getTierForFrequency(newFrequency);

      // Check if at risk of demotion
      let atRisk = false;
      if (tierBefore > 1) {
        const currentTierThreshold = tierThresholds[tierBefore - 1].threshold;
        const buffer = currentTierThreshold * demotionWarningThreshold;
        atRisk = newFrequency <= currentTierThreshold + buffer && newFrequency > currentTierThreshold;
      }

      const result: DecayResult = {
        user_id: profile.user_id,
        previous_frequency: profile.resonance_frequency,
        new_frequency: newFrequency,
        decay_amount: decayAmount,
        days_since_observation: daysSinceObservation,
        tier_before: tierBefore,
        tier_after: tierAfter,
        at_risk: atRisk,
      };

      decayResults.push(result);
      if (atRisk || tierAfter < tierBefore) {
        atRiskUsers.push(result);
      }

      // Update the profile
      await supabase
        .from("trust_profiles")
        .update({
          resonance_frequency: newFrequency,
          current_tier: tierAfter,
        })
        .eq("id", profile.id);

      // Record decay event
      await supabase.from("decay_events").insert({
        user_id: profile.user_id,
        days_since_observation: daysSinceObservation,
        decay_amount: decayAmount,
        frequency_before: profile.resonance_frequency,
        frequency_after: newFrequency,
        decay_formula: `N(t) = ${profile.resonance_frequency.toFixed(2)} × (0.5)^(${daysSinceObservation}/${halfLifeDays})`,
      });
    }

    // Send notifications to at-risk users
    if (atRiskUsers.length > 0) {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (resendApiKey) {
        const resend = new Resend(resendApiKey);

        // Get sender settings
        const { data: senderSettings } = await supabase
          .from("escalation_settings")
          .select("setting_key, setting_value")
          .in("setting_key", ["sender_name", "noreply_email"]);

        const senderMap = Object.fromEntries(
          (senderSettings || []).map((s: { setting_key: string; setting_value: string }) => [s.setting_key, s.setting_value])
        );
        const senderName = senderMap.sender_name || "Buoyancis";
        const senderEmail = senderMap.noreply_email || "noreply@buoyancis.com";
        const baseUrl = Deno.env.get("SITE_URL") || "https://buoyancis.com";

        // Get user emails
        for (const user of atRiskUsers) {
          const { data: authUser } = await supabase.auth.admin.getUserById(user.user_id);
          if (!authUser?.user?.email) continue;

          const email = authUser.user.email;
          const tierName = getTierName(user.tier_before);
          const nextTierName = getTierName(user.tier_before - 1);
          const isDemoted = user.tier_after < user.tier_before;

          const subject = isDemoted
            ? `Your Trust Tier Has Changed: ${getTierName(user.tier_before)} → ${getTierName(user.tier_after)}`
            : `⚠️ Trust Decay Warning: You're Approaching ${nextTierName} Tier`;

          const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: 'Courier New', monospace;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 40px;">
      <span style="color: #666666; font-size: 10px; letter-spacing: 3px; text-transform: uppercase;">
        MANAGED SOVEREIGNTY ALERT
      </span>
    </div>
    
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: ${isDemoted ? '#ef4444' : '#f59e0b'}; font-size: 24px; font-weight: 300; margin: 0;">
        ${isDemoted ? '📉 Tier Demotion' : '⚠️ Decay Warning'}
      </h1>
    </div>
    
    <div style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(239, 68, 68, 0.05)); border: 1px solid ${isDemoted ? '#ef4444' : '#f59e0b'}33; border-radius: 8px; padding: 24px; margin-bottom: 30px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
        <div style="text-align: center; flex: 1;">
          <p style="color: #666; font-size: 10px; margin: 0 0 4px 0; text-transform: uppercase;">Previous</p>
          <p style="color: #fff; font-size: 18px; margin: 0; font-weight: bold;">${user.previous_frequency.toFixed(2)}</p>
        </div>
        <div style="text-align: center; flex: 1;">
          <p style="color: #666; font-size: 10px; margin: 0 0 4px 0; text-transform: uppercase;">Current</p>
          <p style="color: ${isDemoted ? '#ef4444' : '#f59e0b'}; font-size: 18px; margin: 0; font-weight: bold;">${user.new_frequency.toFixed(2)}</p>
        </div>
        <div style="text-align: center; flex: 1;">
          <p style="color: #666; font-size: 10px; margin: 0 0 4px 0; text-transform: uppercase;">Decay</p>
          <p style="color: #ef4444; font-size: 18px; margin: 0; font-weight: bold;">-${user.decay_amount.toFixed(2)}</p>
        </div>
      </div>
      
      <div style="border-top: 1px solid #333; padding-top: 16px; text-align: center;">
        <p style="color: #999; font-size: 12px; margin: 0;">
          ${user.days_since_observation} days since last observation • Half-life: ${halfLifeDays} days
        </p>
      </div>
    </div>
    
    <div style="text-align: center; margin-bottom: 30px;">
      <p style="color: #ccc; font-size: 14px; line-height: 1.6; margin: 0;">
        ${isDemoted 
          ? `Your trust tier has changed from <strong style="color: #fff">${tierName}</strong> to <strong style="color: #fff">${getTierName(user.tier_after)}</strong> due to inactivity decay.`
          : `Your resonance frequency is approaching the ${nextTierName} tier threshold. Engage with the community to rebuild your trust.`
        }
      </p>
    </div>
    
    <div style="background: #111; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
      <p style="color: #888; font-size: 11px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">The Formula</p>
      <code style="color: #c9a227; font-size: 12px;">N(t) = N₀ × (½)^(t/t½)</code>
      <p style="color: #666; font-size: 11px; margin: 8px 0 0 0; font-style: italic;">
        「物壯則老」— All things decline after reaching their prime
      </p>
    </div>
    
    <div style="text-align: center; margin-bottom: 30px;">
      <a href="${baseUrl}/decoder" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #c9a227, #a78b1d); color: #000; text-decoration: none; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; border-radius: 4px;">
        Rebuild Your Trust →
      </a>
    </div>
    
    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #222;">
      <p style="color: #444; font-size: 10px; margin: 0;">
        Buoyancis Managed Sovereignty System
      </p>
    </div>
  </div>
</body>
</html>`;

          try {
            await resend.emails.send({
              from: `${senderName} <${senderEmail}>`,
              to: [email],
              subject,
              html: htmlContent,
            });
            console.log(`Sent decay notification to ${email}`);
          } catch (emailError) {
            console.error(`Failed to send decay notification to ${email}:`, emailError);
          }
        }
      }
    }

    // Log to notification history
    await supabase.from("notification_history").insert({
      notification_type: "trust_decay_calculation",
      subject: `Daily Trust Decay: ${decayResults.length} profiles processed`,
      recipients: atRiskUsers.map(u => u.user_id),
      status: "sent",
    });

    const demotedCount = decayResults.filter(r => r.tier_after < r.tier_before).length;

    return new Response(
      JSON.stringify({
        message: "Trust decay calculation completed",
        processed: decayResults.length,
        demoted: demotedCount,
        at_risk: atRiskUsers.length - demotedCount,
        half_life_days: halfLifeDays,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in calculate-trust-decay:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
