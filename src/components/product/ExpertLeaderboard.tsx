import { ShieldCheck, Award, TrendingUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

// Mock data for expert leaderboard — in production this would come from the database
const EXPERTS = [
  { name: "Sofia A.", reviews: 48, tier: 5, badge: "Authority", avatar: "S" },
  { name: "Erik L.", reviews: 35, tier: 4, badge: "Expert", avatar: "E" },
  { name: "Yuki T.", reviews: 29, tier: 4, badge: "Expert", avatar: "Y" },
  { name: "Marcus B.", reviews: 22, tier: 3, badge: "Trusted", avatar: "M" },
  { name: "Anna K.", reviews: 19, tier: 3, badge: "Trusted", avatar: "A" },
];

const tierColors: Record<number, string> = {
  3: "bg-primary/10 text-primary",
  4: "bg-accent/10 text-accent",
  5: "bg-score-high/10 text-score-high",
};

const ExpertLeaderboard = () => {
  const { t } = useLanguage();

  return (
    <section className="py-14 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-accent/10 text-accent">
            <Award className="w-4.5 h-4.5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              {t("expert.title")}
            </h2>
            <p className="text-sm text-muted-foreground">{t("expert.subtitle")}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-5 gap-3">
          {EXPERTS.map((expert, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
              viewport={{ once: true }}
              className="bg-card border border-border rounded-2xl p-4 text-center hover:shadow-md transition-shadow"
            >
              {/* Rank */}
              {i < 3 && (
                <div className="text-xs font-bold text-accent mb-2">#{i + 1}</div>
              )}

              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold mx-auto mb-3">
                {expert.avatar}
              </div>

              <h4 className="text-sm font-bold text-foreground">{expert.name}</h4>
              <div className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1.5 ${tierColors[expert.tier] || tierColors[3]}`}>
                <ShieldCheck className="w-3 h-3" />
                {expert.badge}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {expert.reviews} {t("card.reviews")}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExpertLeaderboard;
