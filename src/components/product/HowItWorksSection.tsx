import { ShieldCheck, Bot, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const HowItWorksSection = () => {
  const { t } = useLanguage();

  const steps = [
    { icon: ShieldCheck, titleKey: "how.step1.title", descKey: "how.step1.desc" },
    { icon: Bot, titleKey: "how.step2.title", descKey: "how.step2.desc" },
    { icon: Clock, titleKey: "how.step3.title", descKey: "how.step3.desc" },
  ];

  return (
    <section id="how-it-works" className="max-w-3xl mx-auto px-4 sm:px-6 py-16 border-t border-border/40">
      <h2 className="text-2xl font-semibold text-foreground text-center mb-10">
        {t("how.title")}
      </h2>
      <div className="grid sm:grid-cols-3 gap-8">
        {steps.map((step, i) => (
          <div key={i} className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
              <step.icon className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-2">{t(step.titleKey)}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{t(step.descKey)}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorksSection;
