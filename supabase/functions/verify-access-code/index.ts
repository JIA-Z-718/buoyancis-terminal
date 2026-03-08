import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { checkRateLimit, createRateLimitResponse } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Gateway access code routing matrix ───
const GATEWAY_CODES: Record<string, { route: string; transition?: string; identityTag?: string; isDebug?: boolean }> = {
  "SEQUOIA-GRAVITY":        { route: "/node-088" },
  "E-ACC-GRAVITY":          { route: "/node-000" },
  "WHITE-HOUSE-SIGNAL":     { route: "/node-001" },
  "READ-WRITE-VERIFY":      { route: "/node-002" },
  "POST-MILK-GENERATION":   { route: "/node-003-rickard" },
  "LEGACY-FOUNDATION":      { route: "/node-003-rickard" },
  "KTH-DISTRIBUTED":        { route: "/node/010" },
  "RUNTIME-CHECK-PASSED":   { route: "/node/010" },
  "NO-HOT-AIR":             { route: "/node/010" },
  "EXHALE-TO-EVOLVE":       { route: "/node/010?mode=calibration" },
  "CONSTRUCT-OVER-CONSOLE": { route: "/node-011", transition: "matrix_rain", identityTag: "The tool defines the architect." },
  "DONNIE-MOONSHOT":        { route: "/node-011" },
  "STABILITY-PROTOCOL":     { route: "/node-011" },
  "EAST-WEST-BRIDGE":       { route: "/node-009" },
  "FAMILY-LEGACY":          { route: "/node-009" },
  "ROELOF-SOVEREIGN":       { route: "/sovereign" },
  "SUDO-DONNIE":            { route: "/node-011", transition: "matrix_rain", identityTag: "Debug protocol engaged.", isDebug: true },
};

// ─── Private Access valid codes ───
const PRIVATE_ACCESS_CODES: Record<string, { route?: string }> = {
  "VERNISSAGE-Z":           {},
  "ENTROPY-2025":           {},
  "FOUNDER-INVITE":         {},
  "A16Z-GENESIS":           {},
  "SEQUOIA-ORDER":          {},
  "SEQUOIA-GRAVITY":        { route: "/node/088" },
  "KTH-DISTRIBUTED":        { route: "/node/010" },
  "DONNIE-MOONSHOT":        { route: "/node/011" },
  "ROELOF-SOVEREIGN":       { route: "/sovereign" },
  "E-ACC-GRAVITY":          { route: "/node/000" },
  "WHITE-HOUSE-SIGNAL":     { route: "/node/001" },
  "FAMILY-LEGACY":          { route: "/node/009" },
  "READ-WRITE-VERIFY":      { route: "/node/002" },
  "POST-MILK-GENERATION":   { route: "/node/003" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limit: 10 attempts per minute per IP
  const rateLimitResult = checkRateLimit(req, {
    maxRequests: 10,
    windowMs: 60_000,
    identifier: "verify-access-code",
  });

  if (!rateLimitResult.allowed) {
    return createRateLimitResponse(rateLimitResult, corsHeaders);
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
    const context = typeof body.context === "string" ? body.context : "gateway";

    if (!code || code.length > 50) {
      return new Response(
        JSON.stringify({ valid: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (context === "gateway") {
      const entry = GATEWAY_CODES[code];
      if (entry) {
        return new Response(
          JSON.stringify({
            valid: true,
            route: entry.route,
            transition: entry.transition || "standard",
            identityTag: entry.identityTag || null,
            isDebug: entry.isDebug || false,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else if (context === "private") {
      const entry = PRIVATE_ACCESS_CODES[code];
      if (entry) {
        return new Response(
          JSON.stringify({
            valid: true,
            route: entry.route || null,
            showManifesto: !entry.route,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Invalid code – generic response (no information leakage)
    return new Response(
      JSON.stringify({ valid: false }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("verify-access-code error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
