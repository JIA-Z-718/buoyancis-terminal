import { useLanguage } from "@/contexts/LanguageContext";

interface TrustComparisonBarProps {
  traditionalScore: number;
  buoyancisScore: number;
  className?: string;
}

const TrustComparisonBar = ({ traditionalScore, buoyancisScore, className = "" }: TrustComparisonBarProps) => {
  const { t } = useLanguage();
  const diff = traditionalScore - buoyancisScore;
  const maxScore = 5;

  const tradPercent = (traditionalScore / maxScore) * 100;
  const bPercent = (buoyancisScore / maxScore) * 100;

  const scoreColor = buoyancisScore >= 4.5 ? "text-emerald-500" : buoyancisScore >= 4.0 ? "text-primary" : "text-muted-foreground";

  return (
    <div className={`bg-card border border-border rounded-xl p-5 ${className}`}>
      <h3 className="text-sm font-semibold text-foreground mb-4">{t("detail.trustComparison")}</h3>

      {/* Traditional */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted-foreground">{t("detail.traditional")}</span>
          <span className="text-muted-foreground font-medium tabular-nums">{traditionalScore.toFixed(1)}</span>
        </div>
        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500/60 rounded-full transition-all duration-700"
            style={{ width: `${tradPercent}%` }}
          />
        </div>
      </div>

      {/* Buoyancis */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-foreground font-medium">{t("detail.calibrated")}</span>
          <span className={`font-bold tabular-nums ${scoreColor}`}>{buoyancisScore.toFixed(1)}</span>
        </div>
        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-700"
            style={{ width: `${bPercent}%` }}
          />
        </div>
      </div>

      {/* Inflation note */}
      {diff > 0.05 && (
        <p className="text-xs text-amber-500/80 mt-2">
          ↓ {diff.toFixed(1)} {t("detail.inflated")}
        </p>
      )}
    </div>
  );
};

export default TrustComparisonBar;
