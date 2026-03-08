import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  ShieldCheck,
  AlertTriangle,
  User,
  Bot,
  Eye,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  MapPin,
  Clock,
  Zap,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

interface Review {
  id: number;
  author: string;
  text: string;
  stars: number;
  type: "expert" | "local" | "tourist" | "bot";
  trustWeight: number;
  badge?: string;
  meta: string;
  flagReason?: string;
}

const reviews: Review[] = [
  {
    id: 1,
    author: "Anna Lindqvist",
    text: "The truffle pasta here is transformative. Chef Magnus sources directly from Gotland—worth every krona. Wine list curated with precision.",
    stars: 5,
    type: "expert",
    trustWeight: 8.2,
    badge: "Local Expert",
    meta: "312 reviews · 8 yr resident · Food critic",
  },
  {
    id: 2,
    author: "Erik Johansson",
    text: "Been coming here since 2019. Consistently excellent. The seasonal menu shows real dedication to Nordic cuisine.",
    stars: 4,
    type: "local",
    trustWeight: 5.1,
    badge: "Verified Local",
    meta: "89 reviews · 5 yr resident",
  },
  {
    id: 3,
    author: "TravelBot_2847",
    text: "AMAZING!! Best restaurant EVER!! Five stars!!!! Must visit!!!",
    stars: 5,
    type: "bot",
    trustWeight: 0.01,
    meta: "1 review · Account age: 2 hrs",
    flagReason: "Bot pattern: burst timing, keyword stuffing",
  },
  {
    id: 4,
    author: "ReviewFarm_EU",
    text: "Perfect food perfect service perfect everything I love it so much!!!",
    stars: 5,
    type: "bot",
    trustWeight: 0.01,
    meta: "1 review · Account age: 4 hrs",
    flagReason: "Bot pattern: identical syntax, coordinated IP",
  },
  {
    id: 5,
    author: "James K.",
    text: "Nice place. Had a burger. It was OK I guess.",
    stars: 3,
    type: "tourist",
    trustWeight: 0.3,
    meta: "2 reviews · Visiting from London",
  },
  {
    id: 6,
    author: "spam_promo_99",
    text: "Great restaurant!! Also check out my crypto link in bio!!",
    stars: 5,
    type: "bot",
    trustWeight: 0.0,
    meta: "0 reviews · Flagged account",
    flagReason: "Spam: promotional content detected",
  },
  {
    id: 7,
    author: "Björn Strandberg",
    text: "Solid 4/5. The dessert menu could use more variety, but main courses never disappoint. The sommelier knows her craft.",
    stars: 4,
    type: "local",
    trustWeight: 4.7,
    badge: "Verified Local",
    meta: "156 reviews · 3 yr resident",
  },
  {
    id: 8,
    author: "fake_review_42",
    text: "WOW INCREDIBLE FOOD!! 100% RECOMMEND TO EVERYONE!!!",
    stars: 5,
    type: "bot",
    trustWeight: 0.01,
    meta: "1 review · Account age: 1 hr",
    flagReason: "Bot pattern: repetitive superlatives, no specifics",
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const getTypeColor = (type: Review["type"]) => {
  switch (type) {
    case "expert":
      return "text-[hsl(var(--gold))]";
    case "local":
      return "text-emerald-400";
    case "tourist":
      return "text-muted-foreground";
    case "bot":
      return "text-red-400";
  }
};

const getTypeBg = (type: Review["type"]) => {
  switch (type) {
    case "expert":
      return "bg-[hsl(var(--gold)/0.12)] border-[hsl(var(--gold)/0.3)]";
    case "local":
      return "bg-emerald-500/10 border-emerald-500/30";
    case "tourist":
      return "bg-muted/50 border-border";
    case "bot":
      return "bg-red-500/10 border-red-500/30";
  }
};

const getTypeIcon = (type: Review["type"]) => {
  switch (type) {
    case "expert":
      return <ShieldCheck className="w-4 h-4" />;
    case "local":
      return <MapPin className="w-4 h-4" />;
    case "tourist":
      return <User className="w-4 h-4" />;
    case "bot":
      return <Bot className="w-4 h-4" />;
  }
};

const calcTraditionalRating = () => {
  const total = reviews.reduce((s, r) => s + r.stars, 0);
  return (total / reviews.length).toFixed(1);
};

const calcBuoyancisRating = () => {
  const weightedSum = reviews.reduce(
    (s, r) => s + r.stars * r.trustWeight,
    0
  );
  const totalWeight = reviews.reduce((s, r) => s + r.trustWeight, 0);
  return (weightedSum / totalWeight).toFixed(1);
};

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

const ReviewCard = ({
  review,
  mode,
  index,
}: {
  review: Review;
  mode: "traditional" | "buoyancis";
  index: number;
}) => {
  const isBuoyancis = mode === "buoyancis";
  const isFiltered = isBuoyancis && review.type === "bot";
  const isAmplified = isBuoyancis && (review.type === "expert" || review.type === "local");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{
        opacity: isFiltered ? 0.25 : 1,
        y: 0,
        scale: isAmplified ? 1.02 : isFiltered ? 0.95 : 1,
      }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      className="relative"
    >
      <div
        className={`relative rounded-xl border p-4 transition-all duration-500 ${
          isFiltered
            ? "border-red-500/20 bg-red-500/5"
            : isAmplified
            ? `${getTypeBg(review.type)} shadow-lg`
            : "border-border bg-card"
        }`}
      >
        {/* Filtered overlay */}
        {isFiltered && (
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500/5 to-transparent pointer-events-none flex items-center justify-end pr-4">
            <div className="flex items-center gap-1.5 text-red-400 text-xs font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              Filtered
            </div>
          </div>
        )}

        {/* Amplified glow */}
        {isAmplified && review.type === "expert" && (
          <div className="absolute -inset-px rounded-xl bg-gradient-to-br from-[hsl(var(--gold)/0.15)] to-transparent pointer-events-none" />
        )}

        <div className="relative">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isFiltered ? "bg-red-500/10" : getTypeBg(review.type).split(" ")[0]
                }`}
              >
                <span className={isFiltered ? "text-red-400" : getTypeColor(review.type)}>
                  {getTypeIcon(review.type)}
                </span>
              </div>
              <div className="min-w-0">
                <p
                  className={`text-sm font-medium truncate ${
                    isFiltered
                      ? "line-through text-muted-foreground/50"
                      : "text-foreground"
                  }`}
                >
                  {review.author}
                </p>
                <p className="text-[10px] text-muted-foreground/60 truncate">
                  {review.meta}
                </p>
              </div>
            </div>

            {/* Badge */}
            {review.badge && isBuoyancis && !isFiltered && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider flex-shrink-0 ${
                  review.type === "expert"
                    ? "bg-[hsl(var(--gold)/0.12)] text-[hsl(var(--gold))]"
                    : "bg-emerald-500/10 text-emerald-400"
                }`}
              >
                <ShieldCheck className="w-2.5 h-2.5" />
                {review.badge}
              </motion.span>
            )}
          </div>

          {/* Stars */}
          <div className="flex gap-0.5 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${
                  i < review.stars
                    ? isFiltered
                      ? "fill-muted-foreground/20 text-muted-foreground/20"
                      : isAmplified
                      ? "fill-[hsl(var(--gold))] text-[hsl(var(--gold))]"
                      : "fill-muted-foreground/40 text-muted-foreground/40"
                    : "text-border"
                }`}
              />
            ))}
          </div>

          {/* Text */}
          <p
            className={`text-xs leading-relaxed mb-3 ${
              isFiltered
                ? "text-muted-foreground/30 line-through"
                : "text-muted-foreground"
            }`}
          >
            {review.text}
          </p>

          {/* Footer: weight or flag */}
          <div className="flex items-center justify-between">
            {isBuoyancis && review.flagReason && (
              <span className="text-[10px] text-red-400/70 italic truncate mr-2">
                {review.flagReason}
              </span>
            )}
            {!review.flagReason && <span />}

            {isBuoyancis && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium tabular-nums flex-shrink-0 ${
                  isFiltered
                    ? "border-red-500/20 text-red-400/60"
                    : review.type === "expert"
                    ? "border-[hsl(var(--gold)/0.3)] bg-[hsl(var(--gold)/0.08)] text-[hsl(var(--gold))]"
                    : review.type === "local"
                    ? "border-emerald-500/30 bg-emerald-500/8 text-emerald-400"
                    : "border-border text-muted-foreground"
                }`}
              >
                Weight: {review.trustWeight}×
              </motion.span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* ------------------------------------------------------------------ */
/*  Animated counter                                                   */
/* ------------------------------------------------------------------ */

const AnimatedRating = ({ value, color }: { value: string; color: string }) => {
  const [displayed, setDisplayed] = useState("0.0");
  const target = parseFloat(value);

  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const duration = 800;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed((target * eased).toFixed(1));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return (
    <span className={`text-4xl md:text-5xl font-serif tabular-nums ${color}`}>
      {displayed}
    </span>
  );
};

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

const TrustWeightingDemo = () => {
  const [mode, setMode] = useState<"traditional" | "buoyancis">("traditional");
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const traditionalRating = calcTraditionalRating();
  const buoyancisRating = calcBuoyancisRating();
  const isBuoyancis = mode === "buoyancis";

  const botCount = reviews.filter((r) => r.type === "bot").length;
  const expertCount = reviews.filter(
    (r) => r.type === "expert" || r.type === "local"
  ).length;

  // Sort reviews: in buoyancis mode, experts first, bots last
  const sortedReviews = isBuoyancis
    ? [...reviews].sort((a, b) => b.trustWeight - a.trustWeight)
    : reviews;

  return (
    <section
      ref={sectionRef}
      className="py-20 md:py-28 px-6 md:px-12 bg-background relative overflow-hidden"
    >
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(hsl(var(--border))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border))_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-xs uppercase tracking-[0.4em] text-gold/80 mb-4">
            ◇ Interactive Demo ◇
          </p>
          <h2 className="text-3xl md:text-4xl font-serif text-foreground tracking-tight mb-4">
            One Restaurant.{" "}
            <span className="text-holographic">Two Realities.</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
            Toggle between a traditional platform and the Buoyancis Protocol to
            see how gravitational weighting separates{" "}
            <span className="text-gold/80">signal</span> from noise.
          </p>
        </motion.div>

        {/* Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-center mb-10"
        >
          <div className="inline-flex rounded-full border border-border bg-card p-1 shadow-sm">
            <button
              onClick={() => setMode("traditional")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                !isBuoyancis
                  ? "bg-muted text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Traditional Platform
            </button>
            <button
              onClick={() => setMode("buoyancis")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                isBuoyancis
                  ? "bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold))] shadow-sm border border-[hsl(var(--gold)/0.3)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                Buoyancis Protocol
              </span>
            </button>
          </div>
        </motion.div>

        {/* Main content grid */}
        <div className="grid lg:grid-cols-[1fr_300px] gap-8">
          {/* Review feed */}
          <div>
            {/* Restaurant header */}
            <motion.div
              layout
              className="rounded-xl border border-border bg-card p-5 mb-6"
            >
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    Restaurang Nordlys
                  </h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Södermalm, Stockholm
                  </p>
                </div>

                {/* Rating display */}
                <div className="text-right">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={mode}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.4 }}
                    >
                      <AnimatedRating
                        value={isBuoyancis ? buoyancisRating : traditionalRating}
                        color={
                          isBuoyancis
                            ? "text-[hsl(var(--gold))]"
                            : "text-foreground"
                        }
                      />
                      <div className="flex items-center gap-1 mt-1">
                        {isBuoyancis ? (
                          <span className="text-[10px] text-[hsl(var(--gold))] font-medium uppercase tracking-wider">
                            Buoyancis Signal
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                            Platform Average
                          </span>
                        )}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Stats bar */}
              <AnimatePresence>
                {isBuoyancis && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border text-xs">
                      <span className="flex items-center gap-1 text-red-400">
                        <TrendingDown className="w-3 h-3" />
                        {botCount} bot reviews filtered
                      </span>
                      <span className="flex items-center gap-1 text-emerald-400">
                        <TrendingUp className="w-3 h-3" />
                        {expertCount} expert signals amplified
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Eye className="w-3 h-3" />
                        Noise reduction: 99.4%
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Reviews grid */}
            <div className="grid sm:grid-cols-2 gap-3">
              {sortedReviews.map((review, i) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  mode={mode}
                  index={i}
                />
              ))}
            </div>
          </div>

          {/* Sidebar: Protocol Insights */}
          <AnimatePresence>
            {isBuoyancis && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="space-y-4"
              >
                {/* Signal breakdown */}
                <div className="rounded-xl border border-[hsl(var(--gold)/0.2)] bg-card p-5">
                  <h4 className="text-xs uppercase tracking-widest text-gold/80 mb-4">
                    Signal Breakdown
                  </h4>
                  <div className="space-y-3">
                    {[
                      {
                        label: "Local Experts",
                        weight: "8.2×",
                        pct: 82,
                        color: "bg-[hsl(var(--gold))]",
                      },
                      {
                        label: "Verified Locals",
                        weight: "4.9×",
                        pct: 49,
                        color: "bg-emerald-400",
                      },
                      {
                        label: "Tourists",
                        weight: "0.3×",
                        pct: 3,
                        color: "bg-muted-foreground/40",
                      },
                      {
                        label: "Bots / Spam",
                        weight: "0.0×",
                        pct: 0,
                        color: "bg-red-400",
                      },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">
                            {item.label}
                          </span>
                          <span className="text-xs font-medium tabular-nums text-foreground">
                            {item.weight}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.pct}%` }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            className={`h-full rounded-full ${item.color}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* How it works mini */}
                <div className="rounded-xl border border-border bg-card p-5">
                  <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
                    Protocol Logic
                  </h4>
                  <div className="space-y-3">
                    {[
                      {
                        icon: <Eye className="w-3.5 h-3.5" />,
                        title: "Observer Mass",
                        desc: "Weight based on history, residency, and review quality",
                      },
                      {
                        icon: <Clock className="w-3.5 h-3.5" />,
                        title: "Temporal Decay",
                        desc: "Old reviews lose mass; only active nodes retain influence",
                      },
                      {
                        icon: <AlertTriangle className="w-3.5 h-3.5" />,
                        title: "Anomaly Detection",
                        desc: "Burst timing, coordinated IPs, and keyword patterns flagged",
                      },
                    ].map((item) => (
                      <div key={item.title} className="flex gap-3">
                        <div className="mt-0.5 text-gold/60">{item.icon}</div>
                        <div>
                          <p className="text-xs font-medium text-foreground">
                            {item.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key insight */}
                <div className="rounded-xl border border-[hsl(var(--gold)/0.15)] bg-[hsl(var(--gold)/0.03)] p-5">
                  <p className="text-xs text-gold/90 leading-relaxed">
                    <span className="font-semibold">Result:</span> The inflated{" "}
                    <span className="tabular-nums font-semibold">{traditionalRating}★</span>{" "}
                    driven by {botCount} bot reviews collapses to a calibrated{" "}
                    <span className="tabular-nums font-semibold text-[hsl(var(--gold))]">
                      {buoyancisRating}★
                    </span>{" "}
                    — reflecting the true signal from verified observers.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isVisible ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-14"
        >
          <p className="text-xs text-muted-foreground/50">
            {isBuoyancis
              ? "This is what truth looks like when it has mass."
              : "Click \"Buoyancis Protocol\" to see the difference."}
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default TrustWeightingDemo;
