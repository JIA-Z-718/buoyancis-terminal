import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateCronSecret } from "../_shared/cron-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate cron secret for scheduled invocations
    const cronValidation = await validateCronSecret(req);
    if (!cronValidation.authorized) {
      console.log("Cron secret validation failed");
      return cronValidation.response || new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find posts that are scheduled to be published and the time has passed
    const now = new Date().toISOString();
    
    const { data: scheduledPosts, error: fetchError } = await supabase
      .from("blog_posts")
      .select("id, title, slug, scheduled_publish_at")
      .eq("is_published", false)
      .not("scheduled_publish_at", "is", null)
      .lte("scheduled_publish_at", now);

    if (fetchError) {
      console.error("Error fetching scheduled posts:", fetchError);
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!scheduledPosts || scheduledPosts.length === 0) {
      console.log("No posts scheduled for publishing at this time");
      return new Response(
        JSON.stringify({ message: "No posts to publish", published: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${scheduledPosts.length} posts to publish`);

    // Publish each scheduled post
    const results = [];
    for (const post of scheduledPosts) {
      const { error: updateError } = await supabase
        .from("blog_posts")
        .update({
          is_published: true,
          published_at: now,
          scheduled_publish_at: null,
        })
        .eq("id", post.id);

      if (updateError) {
        console.error(`Failed to publish post ${post.id}:`, updateError);
        results.push({ id: post.id, title: post.title, success: false, error: updateError.message });
      } else {
        console.log(`Successfully published: ${post.title}`);
        results.push({ id: post.id, title: post.title, success: true });
      }
    }

    const successCount = results.filter(r => r.success).length;
    
    return new Response(
      JSON.stringify({ 
        message: `Published ${successCount} of ${scheduledPosts.length} scheduled posts`,
        published: successCount,
        results 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
