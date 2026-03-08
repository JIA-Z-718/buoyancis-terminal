import { useEffect, useRef, useState } from "react";
import { useParallax } from "@/hooks/useParallax";

const steps = [
  {
    number: "01",
    title: "Data Ingestion",
    subtitle: "信號攝取",
    description:
      "We ingest signals from verifiable interactions, filtering out 99% of AI-generated noise. Only authenticated observer nodes produce coherent input.",
    icon: "◎",
    footnote: "Noise in. Signal out."
  },
  {
    number: "02",
    title: "Gravitational Weighting",
    subtitle: "引力加權",
    description:
      "Observer Nodes are weighted by their historical integrity—the Buoyancis Score. High-mass observers exert gravitational influence; low-mass signals decay into noise.",
    icon: "◈",
    footnote: "M = Σ(Integrity × Frequency)"
  },
  {
    number: "03",
    title: "Temporal Decay",
    subtitle: "時間衰減",
    description:
      "Like radioactive half-life, observer mass diminishes without continuous contribution. The protocol demands perpetual verification—influence is a state, not an asset.",
    icon: "⏱",
    footnote: "M(t) = M₀ × e^(-λt)"
  },
  {
    number: "04",
    title: "Incubation Field",
    subtitle: "孵化場",
    description:
      "New high-potential observers receive algorithmic amplification—a protected field where nascent signals develop mass before competing with established nodes.",
    icon: "◉",
    footnote: "Targeted cultivation."
  },
  {
    number: "05",
    title: "Signal Collapse",
    subtitle: "信號塌縮",
    description:
      "The final output is not an average, but a deterministic truth. When 55% of high-mass observers reach consensus, the wave function collapses into verified reality.",
    icon: "◆",
    footnote: "Truth is computed, not voted."
  },
];

const HowItWorks = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const parallaxOffset = useParallax(0.025);

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

  return (
    <section id="how-it-works" ref={sectionRef} className="section-padding relative overflow-hidden scroll-mt-20 dark:bg-background">
      {/* Animated cyber grid */}
      <div className="absolute inset-0 cyber-grid opacity-10" />
      
      {/* Parallax background with gold accent */}
      <div 
        className="absolute inset-0 bg-gradient-to-t from-gold/[0.03] to-transparent pointer-events-none"
        style={{ transform: `translateY(${parallaxOffset}px)` }}
      />
      
      {/* Decorative horizontal gold line - enhanced */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 transition-all duration-1500 ease-out ${
        isVisible ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
      }`}>
        <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
        <div className="w-48 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent mt-1" />
      </div>
      
      <div className="container-narrow relative z-10">
        {/* Section header - System Logic */}
        <div className="text-center mb-20">
          <p
            className={`text-xs uppercase tracking-[0.4em] text-gold/80 mb-6 transition-all duration-700 ease-out ${
              isVisible ? "opacity-100 animate-chromatic-shimmer" : "opacity-0"
            }`}
          >
            ◇ System Architecture ◇
          </p>
          <h2
            className={`text-4xl md:text-5xl font-serif mb-6 transition-all duration-700 ease-out delay-100 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <span className="text-holographic">The Protocol</span>
          </h2>
          <p
            className={`text-muted-foreground max-w-lg mx-auto text-lg transition-all duration-700 ease-out delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Five axioms govern the physics of <span className="text-gold/80">verified truth</span>.
          </p>
        </div>

        {/* Steps - enhanced cards */}
        <div className="space-y-6 md:space-y-0 md:grid md:grid-cols-5 md:gap-4 lg:gap-6">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={`relative transition-all duration-700 ease-out ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
              style={{ transitionDelay: isVisible ? `${400 + index * 150}ms` : "0ms" }}
              onMouseEnter={() => setActiveStep(index)}
              onMouseLeave={() => setActiveStep(null)}
            >
              {/* Card with glass morphism */}
              <div className={`relative p-5 md:p-4 lg:p-6 rounded-2xl glass-morphism transition-all duration-500 cursor-pointer ${
                activeStep === index ? 'scale-105 animate-neon-border' : 'hover:scale-102'
              }`}>
                {/* Connector line with gold (desktop only) */}
                {index < steps.length - 1 && (
                  <div className={`hidden md:block absolute top-1/2 left-full w-8 transition-all duration-1000 ease-out ${
                    isVisible ? "opacity-100" : "opacity-0"
                  }`} style={{ transitionDelay: isVisible ? `${600 + index * 200}ms` : "0ms" }}>
                    <div className="h-0.5 w-full bg-gradient-to-r from-gold/40 to-transparent" />
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 border-r border-t border-gold/40" />
                  </div>
                )}

                {/* Step number with geometric frame */}
                <div className="relative mb-4">
                  <div className={`text-4xl md:text-3xl lg:text-5xl font-serif transition-all duration-300 ${
                    activeStep === index ? 'text-gold' : 'text-gold/30'
                  }`}>
                    {step.number}
                  </div>
                  <span className={`absolute top-0 right-0 text-xl md:text-lg lg:text-2xl transition-all duration-300 ${
                    activeStep === index ? 'text-gold animate-pulse' : 'text-gold/20'
                  }`}>
                    {step.icon}
                  </span>
                </div>

                {/* Content */}
                <h3 className={`text-base lg:text-lg font-semibold mb-1 transition-colors duration-300 ${
                  activeStep === index ? 'text-gold' : 'text-foreground'
                }`}>
                  {step.title}
                </h3>
                {step.subtitle && (
                  <p className="text-xs text-gold/60 mb-2 tracking-wider">{step.subtitle}</p>
                )}
                <p className="text-muted-foreground leading-relaxed text-xs lg:text-sm mb-3">
                  {step.description}
                </p>
                {step.footnote && (
                  <p className="text-xs text-gold/70 italic border-t border-gold/10 pt-2">
                    "{step.footnote}"
                  </p>
                )}
                
                {/* Bottom accent line */}
                <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-gradient-to-r from-transparent via-gold/50 to-transparent transition-all duration-500 ${
                  activeStep === index ? 'w-3/4 opacity-100' : 'w-0 opacity-0'
                }`} />
              </div>
            </div>
          ))}
        </div>
        
        {/* Bottom decorative element */}
        <div className={`flex items-center justify-center gap-4 mt-16 transition-all duration-700 ease-out delay-[1000ms] ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}>
          <div className="w-20 h-px bg-gradient-to-r from-transparent to-gold/30" />
          <span className="text-gold/60 text-xl">⬡</span>
          <div className="w-20 h-px bg-gradient-to-l from-transparent to-gold/30" />
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
