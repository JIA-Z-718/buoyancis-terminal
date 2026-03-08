import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ShieldCheck, Signal, MapPin } from "lucide-react";

interface Review {
  id: string;
  author: string;
  avatar: string;
  trustTier: string;
  region: string;
  body: string;
  signalCount: number;
}

const REVIEWS: Review[] = [
  {
    id: "r1",
    author: "Emi Tanaka",
    avatar: "ET",
    trustTier: "Local Expert",
    region: "Kyoto, Japan",
    body: "After three years of weekly visits, I can say this tea house preserves a craft most travelers never encounter. The matcha preparation follows a lineage that predates the tourist wave — the owner still sources directly from Uji farmers. This is the kind of place that disappears from platforms optimized for volume.",
    signalCount: 142,
  },
  {
    id: "r2",
    author: "Lars Ekström",
    avatar: "LE",
    trustTier: "Resident Anchor",
    region: "Stockholm, Sweden",
    body: "Södermalm has dozens of coffee spots, but this roastery operates on a different frequency. They micro-lot single origins and the baristas understand extraction science at a level that most chains never reach. Five years as a regular — the consistency alone is a signal of integrity.",
    signalCount: 98,
  },
  {
    id: "r3",
    author: "Priya Mehta",
    avatar: "PM",
    trustTier: "Verified Observer",
    region: "Mumbai, India",
    body: "In a city drowning in algorithmic recommendations, this family restaurant has served the same dal recipe for forty years. No influencer partnerships, no sponsored placements — just generational knowledge expressed through food. The kind of truth that survives because the community protects it.",
    signalCount: 211,
  },
];

const TIER_COLORS: Record<string, string> = {
  "Local Expert": "hsl(var(--gold))",
  "Resident Anchor": "hsl(82 32% 45%)",
  "Verified Observer": "hsl(200 60% 55%)",
};

const FeaturedReviews = () => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  const paginate = useCallback(
    (dir: number) => {
      setDirection(dir);
      setCurrent((prev) => (prev + dir + REVIEWS.length) % REVIEWS.length);
    },
    [],
  );

  const review = REVIEWS[current];
  const tierColor = TIER_COLORS[review.trustTier] ?? "hsl(var(--gold))";

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0 }),
  };

  return (
    <section className="py-24 px-6 md:px-12 bg-background relative overflow-hidden">
      {/* Faint grid */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[linear-gradient(hsl(var(--border))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border))_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="max-w-3xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-semibold text-foreground tracking-tight">
            Featured Reviews
          </h2>
          <p className="mt-4 text-muted-foreground text-sm md:text-base max-w-md mx-auto">
            Depth over speed. These signals were earned, not&nbsp;manufactured.
          </p>
        </motion.div>

        {/* Carousel */}
        <div className="relative">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={review.id}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: "easeInOut" }}
            >
              <div className="rounded-2xl border border-border bg-card p-8 md:p-10 shadow-sm">
                {/* Author row */}
                <div className="flex items-center gap-4 mb-6">
                  {/* Avatar */}
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                    style={{
                      backgroundColor: `${tierColor}15`,
                      color: tierColor,
                    }}
                  >
                    {review.avatar}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground">
                        {review.author}
                      </p>
                      {/* Trust tier badge */}
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                        style={{
                          backgroundColor: `${tierColor}12`,
                          color: tierColor,
                        }}
                      >
                        <ShieldCheck className="w-3 h-3" />
                        {review.trustTier}
                      </span>
                    </div>

                    {/* Region */}
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-muted-foreground/50" />
                      <span className="text-xs text-muted-foreground">
                        {review.region}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <p className="text-sm md:text-base text-foreground/80 leading-relaxed mb-8">
                  "{review.body}"
                </p>

                {/* Signal counter */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground hover:border-[hsl(var(--gold)/0.3)] hover:text-[hsl(var(--gold))] transition-colors duration-200 group"
                  >
                    <Signal className="w-3.5 h-3.5 group-hover:text-[hsl(var(--gold))] transition-colors" />
                    <span className="tabular-nums">{review.signalCount}</span>
                    <span className="hidden sm:inline">Useful Signal</span>
                  </button>

                  {/* Dots indicator */}
                  <div className="flex items-center gap-1.5">
                    {REVIEWS.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setDirection(i > current ? 1 : -1);
                          setCurrent(i);
                        }}
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                          i === current
                            ? "bg-[hsl(var(--gold))] w-4"
                            : "bg-border hover:bg-muted-foreground/30"
                        }`}
                        aria-label={`Go to review ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Nav arrows */}
          <button
            onClick={() => paginate(-1)}
            className="absolute top-1/2 -left-4 md:-left-14 -translate-y-1/2 w-9 h-9 rounded-full border border-border bg-card/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-[hsl(var(--gold)/0.3)] transition-colors"
            aria-label="Previous review"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => paginate(1)}
            className="absolute top-1/2 -right-4 md:-right-14 -translate-y-1/2 w-9 h-9 rounded-full border border-border bg-card/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-[hsl(var(--gold)/0.3)] transition-colors"
            aria-label="Next review"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedReviews;
