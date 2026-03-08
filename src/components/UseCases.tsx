import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Wrench,
  UtensilsCrossed,
  Briefcase,
  GraduationCap,
  ArrowRight,
  X,
  Check,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

interface UseCase {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  problem: string;
  solution: string;
  beforeLabel: string;
  afterLabel: string;
  before: string;
  after: string;
}

const useCases: UseCase[] = [
  {
    icon: Wrench,
    title: "Finding a Local Plumber",
    subtitle: "在地水電工",
    problem:
      "You search online and find a plumber with 4.8★ — but 60% of reviews are from one-time accounts in other cities. You have no idea if they're real.",
    solution:
      "Buoyancis weights your neighbor's 3-year track record at 12× over anonymous drive-by reviews. The plumber's true signal emerges from people who actually live in your area.",
    beforeLabel: "Traditional",
    afterLabel: "Buoyancis",
    before: "4.8★ from 200 unverified reviews",
    after: "4.2★ from 34 verified local residents",
  },
  {
    icon: UtensilsCrossed,
    title: "Choosing a Restaurant",
    subtitle: "選擇餐廳",
    problem:
      "A tourist hotspot has 2,000 five-star reviews. But locals know the quality dropped two years ago when the chef left. The algorithm doesn't care.",
    solution:
      "Temporal decay reduces old reviews' mass. A local food critic's recent assessment carries more gravitational weight than 500 stale tourist reviews.",
    beforeLabel: "Traditional",
    afterLabel: "Buoyancis",
    before: "4.7★ — inflated by 1,800 outdated reviews",
    after: "3.6★ — reflecting current quality from active locals",
  },
  {
    icon: Briefcase,
    title: "Selecting a Business Partner",
    subtitle: "選擇商業夥伴",
    problem:
      "A consulting firm's LinkedIn is full of glowing endorsements. But you can't tell if they're from real clients or a mutual endorsement ring.",
    solution:
      "The protocol detects coordinated endorsement patterns and applies anomaly filtering. Only reviews from verified, independent business relationships retain mass.",
    beforeLabel: "Traditional",
    afterLabel: "Buoyancis",
    before: "87 endorsements — 70% from reciprocal exchanges",
    after: "12 verified client signals — weighted by contract duration",
  },
  {
    icon: GraduationCap,
    title: "Evaluating a Language School",
    subtitle: "評估語言學校",
    problem:
      "A school has perfect ratings, but they incentivize students with discounts for 5-star reviews. The real dropout rate? Hidden.",
    solution:
      "Buoyancis detects incentivized review patterns and de-weights them. Long-term student outcomes and repeat enrollment signals carry true mass.",
    beforeLabel: "Traditional",
    afterLabel: "Buoyancis",
    before: "4.9★ — boosted by discount-for-review programs",
    after: "3.8★ — calibrated by completion rates and alumni signals",
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const UseCases = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [activeCase, setActiveCase] = useState(0);

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

  const current = useCases[activeCase];

  return (
    <section
      ref={sectionRef}
      className="py-20 md:py-28 px-6 md:px-12 bg-background relative overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(hsl(var(--border))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border))_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <p className="text-xs uppercase tracking-[0.4em] text-gold/80 mb-4">
            ◇ Real-World Applications ◇
          </p>
          <h2 className="text-3xl md:text-4xl font-serif text-foreground tracking-tight mb-4">
            Where Trust <span className="text-holographic">Actually Matters</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
            Abstract concepts don't solve real problems. Here's how gravitational
            weighting changes your everyday decisions.
          </p>
        </motion.div>

        {/* Tab selector */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-10"
        >
          {useCases.map((uc, i) => (
            <button
              key={uc.title}
              onClick={() => setActiveCase(i)}
              className={`group relative rounded-xl border p-4 text-left transition-all duration-300 ${
                activeCase === i
                  ? "border-[hsl(var(--gold)/0.4)] bg-[hsl(var(--gold)/0.06)] shadow-md"
                  : "border-border bg-card hover:border-[hsl(var(--gold)/0.2)] hover:bg-card/80"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 transition-colors duration-300 ${
                  activeCase === i
                    ? "bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold))]"
                    : "bg-muted text-muted-foreground group-hover:text-foreground"
                }`}
              >
                <uc.icon className="w-4 h-4" />
              </div>
              <p
                className={`text-xs md:text-sm font-medium leading-tight transition-colors duration-300 ${
                  activeCase === i ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {uc.title}
              </p>
              <p className="text-[10px] text-gold/50 mt-0.5">{uc.subtitle}</p>

              {/* Active indicator */}
              {activeCase === i && (
                <motion.div
                  layoutId="useCaseIndicator"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[hsl(var(--gold))] rounded-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          ))}
        </motion.div>

        {/* Content card */}
        <motion.div
          key={activeCase}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="rounded-2xl border border-border bg-card overflow-hidden"
        >
          {/* Problem → Solution flow */}
          <div className="grid md:grid-cols-2">
            {/* Problem side */}
            <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-border relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center">
                  <X className="w-3 h-3 text-red-400" />
                </div>
                <span className="text-xs uppercase tracking-widest text-red-400/80 font-medium">
                  The Problem
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                {current.problem}
              </p>
              <div className="rounded-lg border border-red-500/15 bg-red-500/5 p-3">
                <p className="text-[10px] uppercase tracking-wider text-red-400/60 mb-1">
                  {current.beforeLabel}
                </p>
                <p className="text-sm font-medium text-red-400/80 tabular-nums">
                  {current.before}
                </p>
              </div>

              {/* Arrow connector (desktop) */}
              <div className="hidden md:flex absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 rounded-full bg-background border border-border items-center justify-center z-10">
                <ArrowRight className="w-3 h-3 text-gold/60" />
              </div>
            </div>

            {/* Solution side */}
            <div className="p-6 md:p-8 relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full bg-[hsl(var(--gold)/0.12)] flex items-center justify-center">
                  <Check className="w-3 h-3 text-[hsl(var(--gold))]" />
                </div>
                <span className="text-xs uppercase tracking-widest text-gold/80 font-medium">
                  With Buoyancis
                </span>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed mb-6">
                {current.solution}
              </p>
              <div className="rounded-lg border border-[hsl(var(--gold)/0.2)] bg-[hsl(var(--gold)/0.04)] p-3">
                <p className="text-[10px] uppercase tracking-wider text-gold/60 mb-1">
                  {current.afterLabel}
                </p>
                <p className="text-sm font-medium text-[hsl(var(--gold))] tabular-nums">
                  {current.after}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isVisible ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center text-xs text-muted-foreground/50 mt-10"
        >
          You don't need global rankings. You need the truth from people who
          actually know.
        </motion.p>
      </div>
    </section>
  );
};

export default UseCases;
