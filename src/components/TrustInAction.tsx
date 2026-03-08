import { motion } from "framer-motion";
import { Star, ShieldCheck, User } from "lucide-react";

const reviewBase = {
  rating: 4,
  text: "Great local café with authentic flavors and friendly atmosphere.",
  date: "3 days ago",
};

const TrustInAction = () => (
  <section className="py-24 px-6 md:px-12 bg-background relative overflow-hidden">
    {/* Subtle grid accent */}
    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(hsl(var(--border))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border))_1px,transparent_1px)] bg-[size:48px_48px]" />

    <div className="max-w-5xl mx-auto relative z-10">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-4xl font-semibold text-foreground tracking-tight">
          See Trust in Action
        </h2>
        <p className="mt-4 text-muted-foreground max-w-xl mx-auto text-sm md:text-base">
          Not all reviews carry the same weight. Buoyancis surfaces the voices
          that matter&nbsp;most.
        </p>
      </motion.div>

      {/* Cards */}
      <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-end">
        {/* ── New User Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative"
        >
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm">
            {/* Author */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">New User</p>
                <p className="text-xs text-muted-foreground">First review</p>
              </div>
            </div>

            {/* Stars */}
            <div className="flex gap-0.5 mb-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < reviewBase.rating
                      ? "fill-muted-foreground/40 text-muted-foreground/40"
                      : "text-border"
                  }`}
                />
              ))}
            </div>

            {/* Body */}
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              {reviewBase.text}
            </p>

            {/* Trust weight */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground/60 uppercase tracking-wider">
                {reviewBase.date}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground tabular-nums">
                Trust Weight:&nbsp;<span className="font-semibold">1×</span>
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── Proven Contributor Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: -12 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="relative md:-translate-y-3"
        >
          {/* Outer glow ring */}
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-[hsl(var(--gold)/0.25)] via-transparent to-[hsl(var(--gold)/0.10)] pointer-events-none" />

          <div className="rounded-2xl border border-[hsl(var(--gold)/0.3)] bg-card p-6 md:p-8 shadow-md relative">
            {/* Author */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-[hsl(var(--gold)/0.12)] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-[hsl(var(--gold))]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">
                    Proven Contributor
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--gold)/0.12)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--gold))]">
                    <ShieldCheck className="w-3 h-3" />
                    Verified Local
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  247 reviews · 5&nbsp;yr resident
                </p>
              </div>
            </div>

            {/* Stars */}
            <div className="flex gap-0.5 mb-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < reviewBase.rating
                      ? "fill-[hsl(var(--gold))] text-[hsl(var(--gold))]"
                      : "text-border"
                  }`}
                />
              ))}
            </div>

            {/* Body */}
            <p className="text-sm text-foreground/80 leading-relaxed mb-5">
              {reviewBase.text}
            </p>

            {/* Trust weight */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground/60 uppercase tracking-wider">
                {reviewBase.date}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--gold)/0.3)] bg-[hsl(var(--gold)/0.08)] px-3 py-1 text-xs font-medium text-[hsl(var(--gold))] tabular-nums">
                Trust Weight:&nbsp;
                <span className="font-bold text-sm">5×</span>
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Caption */}
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.45 }}
        className="text-center text-xs text-muted-foreground/50 mt-10"
      >
        Same review. Different signal strength.
      </motion.p>
    </div>
  </section>
);

export default TrustInAction;
