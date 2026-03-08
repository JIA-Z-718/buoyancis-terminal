import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// 1x1 transparent GIF
const TRANSPARENT_GIF = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 
  0x80, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21, 
  0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44, 
  0x01, 0x00, 0x3b
]);

const handler = async (req: Request): Promise<Response> => {
  // Always return the tracking pixel, even on errors
  const gifHeaders = {
    "Content-Type": "image/gif",
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
  };

  try {
    const url = new URL(req.url);
    const campaignId = url.searchParams.get("c");
    const email = url.searchParams.get("e");
    const variant = url.searchParams.get("v");

    if (!campaignId || !email) {
      return new Response(TRANSPARENT_GIF, { headers: gifHeaders });
    }

    // Decode the email and variant (base64 encoded)
    const decodedEmail = atob(email);
    const decodedVariant = variant ? atob(variant) : "A";
    const userAgent = req.headers.get("user-agent") || null;

    // Use service role to bypass RLS
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Insert open record (ignore conflicts for duplicate opens)
    const { error } = await supabase
      .from("email_opens")
      .upsert(
        {
          campaign_id: campaignId,
          recipient_email: decodedEmail,
          user_agent: userAgent,
          variant: decodedVariant,
          opened_at: new Date().toISOString(),
        },
        { onConflict: "campaign_id,recipient_email", ignoreDuplicates: true }
      );

    if (error) {
      console.error("Error logging email open:", error);
    } else {
      console.log(`Email open tracked: campaign=${campaignId}, email=${decodedEmail}, variant=${decodedVariant}`);
    }
  } catch (error) {
    console.error("Error in track-email-open:", error);
  }

  // Always return the pixel
  return new Response(TRANSPARENT_GIF, { headers: gifHeaders });
};

serve(handler);
