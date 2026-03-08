import { useState, useEffect, useRef } from "react";
import { Slider } from "@/components/ui/slider";
import { Star, Users, ShieldCheck, AlertTriangle, TrendingDown } from "lucide-react";

// Simulated review data for a restaurant
const mockReviews = [
  { id: 1, rating: 5, trust: "oracle", weight: 30, isGenuine: true, label: "本地美食評論家" },
  { id: 2, rating: 5, trust: "bot", weight: 0.1, isGenuine: false, label: "可疑新帳戶" },
  { id: 3, rating: 5, trust: "bot", weight: 0.1, isGenuine: false, label: "複製貼上評論" },
  { id: 4, rating: 4, trust: "verified", weight: 5, isGenuine: true, label: "驗證在地居民" },
  { id: 5, rating: 5, trust: "bot", weight: 0.1, isGenuine: false, label: "一星期內多次評論" },
  { id: 6, rating: 3, trust: "regular", weight: 2, isGenuine: true, label: "回訪顧客" },
  { id: 7, rating: 5, trust: "bot", weight: 0.1, isGenuine: false, label: "疑似付費評論" },
  { id: 8, rating: 2, trust: "verified", weight: 5, isGenuine: true, label: "驗證在地居民" },
  { id: 9, rating: 5, trust: "bot", weight: 0.1, isGenuine: false, label: "VPN 異常登入" },
  { id: 10, rating: 4, trust: "anchor", weight: 10, isGenuine: true, label: "區域守護者" },
];

const TrustDemo = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [filterStrength, setFilterStrength] = useState([0]); // 0-100

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Calculate scores based on filter strength
  const calculateScores = () => {
    const strength = filterStrength[0] / 100;
    
    // Traditional: simple average
    const traditionalAvg = mockReviews.reduce((sum, r) => sum + r.rating, 0) / mockReviews.length;
    
    // Buoyancis: weighted by trust, with filter affecting low-trust reviews
    let totalWeight = 0;
    let weightedSum = 0;
    
    mockReviews.forEach(review => {
      // As filter strength increases, low-trust reviews have less impact
      let effectiveWeight = review.weight;
      if (!review.isGenuine) {
        effectiveWeight *= (1 - strength);
      }
      totalWeight += effectiveWeight;
      weightedSum += review.rating * effectiveWeight;
    });
    
    const buoyancisAvg = totalWeight > 0 ? weightedSum / totalWeight : 0;
    
    // Count how many fake reviews are "filtered"
    const filteredCount = mockReviews.filter(r => !r.isGenuine).length * strength;
    
    return {
      traditional: traditionalAvg,
      buoyancis: buoyancisAvg,
      filteredCount: Math.round(filteredCount),
      totalFake: mockReviews.filter(r => !r.isGenuine).length,
    };
  };

  const scores = calculateScores();
  const isFiltering = filterStrength[0] > 0;

  const getTrustColor = (trust: string) => {
    switch (trust) {
      case "oracle": return "text-gold";
      case "anchor": return "text-gold/80";
      case "verified": return "text-emerald-400";
      case "regular": return "text-blue-400";
      case "bot": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  const getTrustBg = (trust: string) => {
    switch (trust) {
      case "oracle": return "bg-gold/20 border-gold/40";
      case "anchor": return "bg-gold/10 border-gold/30";
      case "verified": return "bg-emerald-400/20 border-emerald-400/40";
      case "regular": return "bg-blue-400/20 border-blue-400/40";
      case "bot": return "bg-destructive/20 border-destructive/40";
      default: return "bg-muted/20 border-muted/40";
    }
  };

  return (
    <section
      ref={sectionRef}
      id="trust-demo"
      className="section-padding bg-background relative overflow-hidden"
    >
      {/* Background effects */}
      <div className="absolute inset-0 cyber-grid opacity-5" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-gradient-radial from-gold/5 to-transparent pointer-events-none" />
      
      <div className="container-narrow relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <p
            className={`text-xs uppercase tracking-[0.4em] text-gold/80 mb-4 transition-all duration-700 ease-out ${
              isVisible ? "opacity-100 animate-chromatic-shimmer" : "opacity-0"
            }`}
          >
            ◇ Interactive Demo ◇
          </p>
          <h2
            className={`text-3xl md:text-4xl font-serif mb-4 transition-all duration-700 ease-out delay-100 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <span className="text-holographic">看見差異</span>
          </h2>
          <p
            className={`text-muted-foreground max-w-xl mx-auto transition-all duration-700 ease-out delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            拖動滑桿，觀察當低信任度評論被過濾後，真實評分如何浮現
          </p>
        </div>

        {/* Demo Container */}
        <div
          className={`max-w-4xl mx-auto transition-all duration-700 ease-out delay-300 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Score Comparison */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Traditional Score */}
            <div className="p-6 rounded-2xl border border-muted/30 bg-muted/5">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-muted-foreground" />
                <h3 className="text-sm font-medium text-muted-foreground">傳統平台評分</h3>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-5xl font-bold text-foreground/80">
                  {scores.traditional.toFixed(1)}
                </span>
                <span className="text-muted-foreground">/5</span>
              </div>
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(scores.traditional)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground/60">
                所有評論權重相同，包含 {scores.totalFake} 條可疑評論
              </p>
            </div>

            {/* Buoyancis Score */}
            <div className="p-6 rounded-2xl border border-gold/30 bg-gold/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-radial from-gold/20 to-transparent rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck className="w-5 h-5 text-gold" />
                  <h3 className="text-sm font-medium text-gold">Buoyancis 權重評分</h3>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl font-bold text-gold">
                    {scores.buoyancis.toFixed(1)}
                  </span>
                  <span className="text-gold/60">/5</span>
                </div>
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(scores.buoyancis)
                          ? "text-gold fill-gold"
                          : "text-gold/30"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gold/70">
                  {isFiltering
                    ? `已過濾 ${scores.filteredCount} 條低信任評論，在地居民權重 ×5`
                    : "調整滑桿開始過濾低信任評論"
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Filter Slider */}
          <div className="p-6 rounded-2xl border border-border bg-foreground/[0.02] mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">信任過濾強度</span>
              <span className="text-sm font-mono text-gold">{filterStrength[0]}%</span>
            </div>
            <Slider
              value={filterStrength}
              onValueChange={setFilterStrength}
              max={100}
              step={1}
              className="mb-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground/50">
              <span>全部顯示</span>
              <span>僅顯示高信任評論</span>
            </div>
          </div>

          {/* Review Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {mockReviews.map((review, index) => {
              const isFiltered = !review.isGenuine && filterStrength[0] > index * 10;
              return (
                <div
                  key={review.id}
                  className={`p-3 rounded-lg border transition-all duration-500 ${
                    isFiltered
                      ? "opacity-20 scale-95 border-destructive/20 bg-destructive/5"
                      : getTrustBg(review.trust)
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3 h-3 ${
                            star <= review.rating
                              ? isFiltered
                                ? "text-destructive/40 fill-destructive/40"
                                : "text-yellow-400 fill-yellow-400"
                              : "text-muted-foreground/20"
                          }`}
                        />
                      ))}
                    </div>
                    <span
                      className={`text-[10px] font-mono ${
                        isFiltered ? "text-destructive/50" : getTrustColor(review.trust)
                      }`}
                    >
                      ×{review.weight}
                    </span>
                  </div>
                  <p
                    className={`text-[10px] truncate ${
                      isFiltered ? "text-destructive/50" : "text-muted-foreground"
                    }`}
                  >
                    {review.label}
                  </p>
                  {isFiltered && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertTriangle className="w-3 h-3 text-destructive/60" />
                      <span className="text-[9px] text-destructive/60">已降權</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Insight Box */}
          {filterStrength[0] >= 50 && (
            <div className="mt-8 p-4 rounded-xl border border-gold/20 bg-gold/5 flex items-start gap-3">
              <TrendingDown className="w-5 h-5 text-gold mt-0.5" />
              <div>
                <p className="text-sm text-gold font-medium mb-1">Aha Moment</p>
                <p className="text-xs text-muted-foreground">
                  這家餐廳的真實評分是 <span className="text-gold font-bold">{scores.buoyancis.toFixed(1)}</span>，
                  而非傳統平台顯示的 {scores.traditional.toFixed(1)}。
                  有 {scores.totalFake} 條評論來自低信任來源，可能是水軍或虛假帳戶。
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default TrustDemo;
