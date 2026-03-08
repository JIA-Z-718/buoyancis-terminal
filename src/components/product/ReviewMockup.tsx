import { Star, ShieldCheck, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const ReviewMockup = () => {
  const { t } = useLanguage();

  return (
    <section className="py-14 px-4 sm:px-6 bg-secondary/30">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            {t("mockup.title")}
          </h2>
          <p className="text-sm text-muted-foreground mt-2">{t("mockup.subtitle")}</p>
        </div>

        {/* Review card mockup */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm max-w-xl mx-auto">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                S
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">Sofia A.</span>
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-semibold">
                    {t("detail.localExpert")}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-score-high/10 text-score-high">
                    {t("detail.reviewerTier")} 10 · Authority
                  </span>
                  <span className="text-[11px] font-bold text-primary tabular-nums">
                    {/* 🟢 已校準為 9.9x 權重 */}
                    9.9x {t("detail.weight")}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 text-accent fill-accent" />
              {/* 🟢 已校準為 9.8 分 (10.0 制) */}
              <span className="text-base font-bold tabular-nums text-foreground">9.8</span>
            </div>
          </div>

          {/* Content */}
          <p className="text-sm text-foreground/80 leading-relaxed mt-4">
            {t("mockup.review")}
          </p>

          {/* Timestamp */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/60">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground tabular-nums">
              2026-02-28 · 19:42:13 CET
            </span>
            <span className="ml-auto text-[10px] font-medium text-score-high bg-score-high/10 px-2 py-0.5 rounded-full">
              {t("mockup.highImpact")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReviewMockup;