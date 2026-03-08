import { useEffect, useRef, useState } from "react";
import { AlertTriangle, TrendingDown, Bot, DollarSign } from "lucide-react";

interface StatProps {
  value: number;
  suffix: string;
  label: string;
  source: string;
  icon: React.ElementType;
  delay: number;
  isVisible: boolean;
}

const AnimatedStat = ({ value, suffix, label, source, icon: Icon, delay, isVisible }: StatProps) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 1800;
    const startTime = Date.now();
    const timer = setTimeout(() => {
      const animate = () => {
        const elapsed = Date.now() - startTime - delay;
        if (elapsed < 0) {
          requestAnimationFrame(animate);
          return;
        }
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.round(value * eased));
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }, delay);

    return () => clearTimeout(timer);
  }, [isVisible, value, delay]);

  return (
    <div
      className={`text-center p-6 rounded-2xl border border-border bg-foreground/[0.02] transition-all duration-700 ease-out hover:border-gold/20 hover:bg-gold/5 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="w-10 h-10 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-5 h-5 text-destructive" />
      </div>
      <p className="text-3xl md:text-4xl font-mono font-bold text-foreground tabular-nums mb-1">
        {count}
        <span className="text-gold">{suffix}</span>
      </p>
      <p className="text-sm text-foreground/80 mb-2">{label}</p>
      <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">{source}</p>
    </div>
  );
};

const headlines = [
  {
    text: "Amazon removed 200M+ fake reviews in a single year",
    source: "Amazon Transparency Report, 2023",
  },
  {
    text: "Restaurants lose an average of 5-9% revenue per one-star drop caused by fake reviews",
    source: "Harvard Business School",
  },
  {
    text: "AI-generated fake reviews increased 189% since ChatGPT launched",
    source: "Fakespot Research, 2024",
  },
];

const SocialProof = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [activeHeadline, setActiveHeadline] = useState(0);

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

  // Rotate headlines
  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setActiveHeadline((prev) => (prev + 1) % headlines.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isVisible]);

  const stats = [
    {
      value: 30,
      suffix: "%",
      label: "of online reviews are estimated fake",
      source: "World Economic Forum",
      icon: AlertTriangle,
      delay: 200,
    },
    {
      value: 152,
      suffix: "B",
      label: "USD in spending influenced by fake reviews yearly",
      source: "Chevalier & Mayzlin Study",
      icon: DollarSign,
      delay: 350,
    },
    {
      value: 82,
      suffix: "%",
      label: "of consumers read a fake review in the past year",
      source: "BrightLocal Survey, 2024",
      icon: Bot,
      delay: 500,
    },
    {
      value: 45,
      suffix: "%",
      label: "of consumers can't distinguish fake from real",
      source: "Northwestern University",
      icon: TrendingDown,
      delay: 650,
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="section-padding bg-background relative overflow-hidden"
    >
      {/* Background effects */}
      <div className="absolute inset-0 cyber-grid opacity-5" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-destructive/20 to-transparent" />

      <div className="container-narrow relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <p
            className={`text-xs uppercase tracking-[0.4em] text-destructive/70 mb-4 transition-all duration-700 ease-out ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            ◇ The Problem Is Real ◇
          </p>
          <h2
            className={`text-3xl md:text-4xl font-serif mb-4 transition-all duration-700 ease-out delay-100 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <span className="text-foreground">The Trust Crisis</span>{" "}
            <span className="text-muted-foreground">in Numbers</span>
          </h2>
          <p
            className={`text-muted-foreground max-w-xl mx-auto transition-all duration-700 ease-out delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Every day, billions of decisions are influenced by systems that can't tell
            truth from noise. Here's the scale of the problem Buoyancis exists to solve.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-14">
          {stats.map((stat, index) => (
            <AnimatedStat key={index} {...stat} isVisible={isVisible} />
          ))}
        </div>

        {/* Rotating Headlines */}
        <div
          className={`max-w-2xl mx-auto transition-all duration-700 ease-out delay-[800ms] ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="p-6 rounded-2xl border border-gold/20 bg-gold/5 relative overflow-hidden min-h-[120px] flex flex-col items-center justify-center">
            {/* Decorative corners */}
            <div className="absolute top-2 left-2 w-4 h-4 border-l border-t border-gold/30" />
            <div className="absolute top-2 right-2 w-4 h-4 border-r border-t border-gold/30" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-l border-b border-gold/30" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-r border-b border-gold/30" />

            {headlines.map((headline, index) => (
              <div
                key={index}
                className={`absolute inset-0 flex flex-col items-center justify-center p-6 transition-all duration-700 ${
                  activeHeadline === index
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4 pointer-events-none"
                }`}
              >
                <p className="text-base md:text-lg text-foreground/90 font-serif italic text-center mb-3 leading-relaxed">
                  "{headline.text}"
                </p>
                <p className="text-[10px] text-gold/60 uppercase tracking-widest">
                  — {headline.source}
                </p>
              </div>
            ))}

            {/* Headline indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {headlines.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveHeadline(index)}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    activeHeadline === index
                      ? "bg-gold w-4"
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Closing statement */}
        <div
          className={`mt-10 text-center transition-all duration-700 ease-out delay-[1000ms] ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <p className="text-xs text-muted-foreground/50 uppercase tracking-widest">
            This is why verification can't wait. This is why <span className="text-gold/70">Buoyancis</span> exists.
          </p>
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
