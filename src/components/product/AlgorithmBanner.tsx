import { ShieldCheck, Award, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

const AlgorithmBanner = () => {
  const { t } = useLanguage();

  const pillars = [
    {
      icon: ShieldCheck,
      title: t("algo.verified.title"),
      desc: t("algo.verified.desc"),
      stat: "87%",
      statLabel: t("algo.verified.stat"),
      color: "text-score-high",
      bg: "bg-score-high/10",
    },
    {
      icon: Award,
      title: t("algo.expert.title"),
      desc: t("algo.expert.desc"),
      stat: "5x",
      statLabel: t("algo.expert.stat"),
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      icon: Clock,
      title: t("algo.decay.title"),
      desc: t("algo.decay.desc"),
      stat: "90d",
      statLabel: t("algo.decay.stat"),
      color: "text-accent",
      bg: "bg-accent/10",
    },
  ];

  return (
    <section className="py-12 border-y border-border/60 bg-secondary/40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
            {t("algo.badge")}
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            {t("algo.title")}
          </h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {pillars.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              viewport={{ once: true }}
              className="bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl ${p.bg} ${p.color} mb-4`}>
                <p.icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1 font-sans">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{p.desc}</p>
              <div className="pt-3 border-t border-border/60">
                <span className={`text-2xl font-bold tabular-nums ${p.color}`}>{p.stat}</span>
                <span className="text-xs text-muted-foreground ml-2">{p.statLabel}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AlgorithmBanner;
