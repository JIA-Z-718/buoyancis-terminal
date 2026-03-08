import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import ProductHeader from "@/components/product/ProductHeader";
import ProductFooter from "@/components/product/ProductFooter";
import ReviewCard from "@/components/product/ReviewCard";
import ReviewForm from "@/components/product/ReviewForm";
import TrustComparisonBar from "@/components/product/TrustComparisonBar";
import { MapPin, Star, ShieldCheck, Loader2 } from "lucide-react";

const RestaurantDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { lang, t } = useLanguage();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: r } = await supabase
      .from("restaurants")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (r) {
      setRestaurant(r);
      const { data: revs } = await supabase
        .from("reviews_public" as any)
        .select("*")
        .eq("restaurant_id", r.id)
        .order("trust_weight", { ascending: false });
      setReviews(revs || []);
    }
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-background">
        <ProductHeader />
        <div className="pt-24 text-center text-muted-foreground">Restaurant not found.</div>
        <ProductFooter />
      </div>
    );
  }

  const displayName = lang === "cn" && restaurant.name_cn ? restaurant.name_cn : restaurant.name;
  const score = Number(restaurant.buoyancis_score);
  const trad = Number(restaurant.traditional_score);
  const diff = trad - score;

  return (
    <div className="min-h-screen bg-background">
      <ProductHeader />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-16">
        {/* Back link */}
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          {t("detail.back")}
        </Link>

        {/* Restaurant header */}
        <div className="mt-4">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">{displayName}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
            {restaurant.cuisine && <span>{restaurant.cuisine}</span>}
            <span className="text-muted-foreground/30">·</span>
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{restaurant.region}</span>
            {restaurant.address && (
              <>
                <span className="text-muted-foreground/30">·</span>
                <span>{restaurant.address}</span>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 text-accent" />
              {trad.toFixed(1)} {t("detail.traditional")}
            </span>
            <span className="text-muted-foreground/30">|</span>
            <span>{restaurant.review_count} {t("card.reviews")}</span>
            <span className="text-muted-foreground/30">|</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-primary" />
              {restaurant.verified_review_count} {t("card.verified")}
            </span>
          </div>
        </div>

        {/* Trust Score Comparison */}
        <TrustComparisonBar
          traditionalScore={trad}
          buoyancisScore={score}
          className="mt-8"
        />

        {/* Review Form */}
        <section className="mt-10">
          <ReviewForm restaurantId={restaurant.id} onReviewSubmitted={fetchData} />
        </section>

        {/* Reviews */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            {t("detail.allReviews")} ({reviews.length})
          </h2>
          {reviews.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("detail.noReviews")}</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}
        </section>
      </main>
      <ProductFooter />
    </div>
  );
};

export default RestaurantDetail;
