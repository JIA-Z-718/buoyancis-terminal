import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin access
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the user is an admin
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all admin users
    const { data: adminRoles } = await adminClient
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    const adminUserIds = adminRoles?.map((r) => r.user_id) || [];

    // Get admin user details from auth.users
    const { data: { users: allUsers } } = await adminClient.auth.admin.listUsers();
    const adminUsers = allUsers?.filter((u) => adminUserIds.includes(u.id)) || [];

      // Get MFA factors for each admin
      const adminMfaStats = await Promise.all(
        adminUsers.map(async (adminUser) => {
          // Get MFA factors from auth
          const { data: factorsData } = await adminClient.auth.admin.mfa.listFactors({
            userId: adminUser.id,
          });

          const allFactors = factorsData?.factors || [];
          const totpFactors = allFactors.filter((f: { factor_type: string }) => f.factor_type === "totp");
          const verifiedTotpFactors = totpFactors.filter((f: { status: string }) => f.status === "verified");

        // Get passkey credentials
        const { data: passkeys } = await adminClient
          .from("passkey_credentials")
          .select("id, friendly_name, created_at, last_used_at")
          .eq("user_id", adminUser.id);

        // Get recovery codes count
        const { count: recoveryCodesCount } = await adminClient
          .from("mfa_recovery_codes")
          .select("id", { count: "exact", head: true })
          .eq("user_id", adminUser.id)
          .is("used_at", null);

        return {
          userId: adminUser.id,
          email: adminUser.email,
          displayName: adminUser.user_metadata?.display_name || adminUser.email?.split("@")[0],
          createdAt: adminUser.created_at,
          lastSignIn: adminUser.last_sign_in_at,
          mfa: {
            totpEnrolled: verifiedTotpFactors.length > 0,
            totpFactorCount: verifiedTotpFactors.length,
            passkeysEnrolled: (passkeys?.length || 0) > 0,
            passkeyCount: passkeys?.length || 0,
            passkeys: passkeys || [],
            recoveryCodesRemaining: recoveryCodesCount || 0,
            hasAnyMfa: verifiedTotpFactors.length > 0 || (passkeys?.length || 0) > 0,
          },
        };
      })
    );

    // Get verification events for pattern analysis (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: verificationEvents } = await adminClient
      .from("mfa_verification_events")
      .select("*")
      .gte("verified_at", thirtyDaysAgo.toISOString())
      .order("verified_at", { ascending: false });

    // Aggregate verification patterns
    const verificationsByMethod: Record<string, number> = {};
    const verificationsByDay: Record<string, number> = {};
    const verificationsByHour: Record<number, number> = {};

    verificationEvents?.forEach((event) => {
      // By method
      verificationsByMethod[event.method] = (verificationsByMethod[event.method] || 0) + 1;

      // By day
      const day = new Date(event.verified_at).toISOString().split("T")[0];
      verificationsByDay[day] = (verificationsByDay[day] || 0) + 1;

      // By hour
      const hour = new Date(event.verified_at).getHours();
      verificationsByHour[hour] = (verificationsByHour[hour] || 0) + 1;
    });

    // Calculate summary stats
    const totalAdmins = adminMfaStats.length;
    const adminsWithTotp = adminMfaStats.filter((a) => a.mfa.totpEnrolled).length;
    const adminsWithPasskey = adminMfaStats.filter((a) => a.mfa.passkeysEnrolled).length;
    const adminsWithAnyMfa = adminMfaStats.filter((a) => a.mfa.hasAnyMfa).length;
    const adminsWithBothMethods = adminMfaStats.filter(
      (a) => a.mfa.totpEnrolled && a.mfa.passkeysEnrolled
    ).length;

    const response = {
      summary: {
        totalAdmins,
        adminsWithAnyMfa,
        adminsWithTotp,
        adminsWithPasskey,
        adminsWithBothMethods,
        adminsWithoutMfa: totalAdmins - adminsWithAnyMfa,
        adoptionRate: totalAdmins > 0 ? Math.round((adminsWithAnyMfa / totalAdmins) * 100) : 0,
        totpAdoptionRate: totalAdmins > 0 ? Math.round((adminsWithTotp / totalAdmins) * 100) : 0,
        passkeyAdoptionRate: totalAdmins > 0 ? Math.round((adminsWithPasskey / totalAdmins) * 100) : 0,
      },
      admins: adminMfaStats,
      verificationPatterns: {
        byMethod: verificationsByMethod,
        byDay: Object.entries(verificationsByDay)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, count]) => ({ date, count })),
        byHour: Object.entries(verificationsByHour)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([hour, count]) => ({ hour: Number(hour), count })),
        totalVerifications: verificationEvents?.length || 0,
        successfulVerifications: verificationEvents?.filter((e) => e.success).length || 0,
        failedVerifications: verificationEvents?.filter((e) => !e.success).length || 0,
      },
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error fetching MFA adoption stats:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
