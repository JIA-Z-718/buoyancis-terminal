import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2, LogIn } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Link } from "react-router-dom";

interface ReviewFormProps {
  restaurantId: string;
  onReviewSubmitted: () => void;
}

const ReviewForm = ({ restaurantId, onReviewSubmitted }: ReviewFormProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-6 text-center">
        <p className="text-sm text-muted-foreground mb-3">{t("review.loginPrompt")}</p>
        <Link to="/genesis/login">
          <Button variant="outline" size="sm" className="gap-2">
            <LogIn className="w-4 h-4" />
            {t("nav.login")}
          </Button>
        </Link>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error(t("review.ratingRequired"));
      return;
    }
    if (content.trim().length < 10) {
      toast.error(t("review.contentMin"));
      return;
    }
    if (content.trim().length > 2000) {
      toast.error(t("review.contentMax"));
      return;
    }

    setSubmitting(true);
    try {
      // Fetch user's trust profile for weight calculation
      let trustTier = 1;
      let trustWeight = 1.0;

      const { data: profile } = await supabase
        .from("trust_profiles")
        .select("current_tier, resonance_frequency")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile) {
        trustTier = profile.current_tier;
        // Weight formula: base weight scaled by tier and frequency
        trustWeight = Math.round((1 + (profile.current_tier - 1) * 1.5 + profile.resonance_frequency * 0.5) * 10) / 10;
      }

      // Get display name from profile
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle();

      const displayName = userProfile?.display_name || user.email?.split("@")[0] || "Anonymous";

      const { error } = await supabase.from("reviews").insert({
        restaurant_id: restaurantId,
        user_id: user.id,
        rating: rating,
        content: content.trim(),
        display_name: displayName,
        trust_tier: trustTier,
        trust_weight: trustWeight,
        is_verified: true,
      });

      if (error) throw error;

      // Update restaurant review counts
      await supabase.rpc("record_observation", {
        p_user_id: user.id,
        p_event_type: "review",
        p_quality_score: rating / 5,
        p_target_entity_id: restaurantId,
        p_target_entity_type: "restaurant",
      });

      toast.success(t("review.success"));
      setRating(0);
      setContent("");
      onReviewSubmitted();
    } catch (err: any) {
      console.error("Review submission error:", err);
      toast.error(t("review.error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">{t("review.title")}</h3>

      {/* Star Rating */}
      <div className="flex items-center gap-1 mb-4">
        <span className="text-xs text-muted-foreground mr-2">{t("review.yourRating")}</span>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="p-0.5 transition-transform hover:scale-110"
            aria-label={`${star} stars`}
          >
            <Star
              className={`w-5 h-5 transition-colors ${
                star <= (hoverRating || rating)
                  ? "text-amber-500 fill-amber-500"
                  : "text-muted-foreground/30"
              }`}
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="text-xs text-muted-foreground ml-2">{rating}.0</span>
        )}
      </div>

      {/* Content */}
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={t("review.placeholder")}
        className="mb-3 text-sm resize-none"
        rows={4}
        maxLength={2000}
      />

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {content.length}/2000
        </span>
        <Button
          onClick={handleSubmit}
          disabled={submitting || rating === 0 || content.trim().length < 10}
          size="sm"
          className="gap-2"
        >
          {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {t("review.submit")}
        </Button>
      </div>
    </div>
  );
};

export default ReviewForm;
