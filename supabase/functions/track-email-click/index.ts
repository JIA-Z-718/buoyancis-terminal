import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const handler = async (req: Request): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const campaignId = url.searchParams.get("c");
    const email = url.searchParams.get("e");
    const targetUrl = url.searchParams.get("u");
    const variant = url.searchParams.get("v");

    // If missing params, redirect to homepage
    if (!campaignId || !email || !targetUrl) {
      return Response.redirect("https://buoyancis.com", 302);
    }

    // Decode the email, URL, and variant (base64 encoded)
    let decodedEmail: string;
    let decodedUrl: string;
    let decodedVariant: string;
    
    try {
      decodedEmail = atob(email);
      decodedUrl = atob(targetUrl);
      decodedVariant = variant ? atob(variant) : "A";
    } catch {
      return Response.redirect("https://buoyancis.com", 302);
    }

    const userAgent = req.headers.get("user-agent") || null;

    // Use service role to bypass RLS
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Insert click record (allow multiple clicks on same link)
    const { error } = await supabase
      .from("email_clicks")
      .insert({
        campaign_id: campaignId,
        recipient_email: decodedEmail,
        original_url: decodedUrl,
        user_agent: userAgent,
        variant: decodedVariant,
      });

    if (error) {
      console.error("Error logging email click:", error);
    } else {
      console.log(`Email click tracked: campaign=${campaignId}, email=${decodedEmail}, url=${decodedUrl}, variant=${decodedVariant}`);
    }

    // Redirect to original URL
    return Response.redirect(decodedUrl, 302);
  } catch (error) {
    console.error("Error in track-email-click:", error);
    // On any error, redirect to homepage
    return Response.redirect("https://buoyancis.com", 302);
  }
};

serve(handler);
