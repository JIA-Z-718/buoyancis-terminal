import { Scale, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useParallax } from "@/hooks/useParallax";

const WhatIsBuoyancis = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const parallaxOffset = useParallax(0.03);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="about" ref={sectionRef} className="section-padding bg-foreground/[0.02] dark:bg-background relative overflow-hidden scroll-mt-20">
      {/* Animated cyber grid */}
      <div className="absolute inset-0 cyber-grid opacity-10" />
      
      {/* Parallax background with gold tint */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-transparent via-gold/[0.03] to-transparent pointer-events-none"
        style={{ transform: `translateY(${parallaxOffset}px)` }}
      />
      
      {/* Decorative gold corner accents - enhanced */}
      <div className={`absolute top-12 left-12 w-24 h-24 transition-all duration-1000 ease-out delay-500 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-gold/50 to-transparent" />
        <div className="absolute top-0 left-0 h-full w-px bg-gradient-to-b from-gold/50 to-transparent" />
        <Sparkles className="absolute top-2 left-2 w-3 h-3 text-gold/40 animate-pulse" />
      </div>
      <div className={`absolute bottom-12 right-12 w-24 h-24 transition-all duration-1000 ease-out delay-700 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}>
        <div className="absolute bottom-0 right-0 w-full h-px bg-gradient-to-l from-gold/50 to-transparent" />
        <div className="absolute bottom-0 right-0 h-full w-px bg-gradient-to-t from-gold/50 to-transparent" />
        <Sparkles className="absolute bottom-2 right-2 w-3 h-3 text-gold/40 animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>
      
      {/* Central radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-gradient-radial from-gold/5 to-transparent pointer-events-none" />
      
      <div className="container-narrow relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          {/* Enhanced icon with orbital ring */}
          <div
            className={`relative inline-flex items-center justify-center w-16 h-16 mb-8 transition-all duration-700 ease-out ${
              isVisible ? "opacity-100 translate-y-0 animate-dramatic-entrance" : "opacity-0 translate-y-4"
            }`}
          >
            {/* Rotating outer ring */}
            <div className="absolute inset-0 rounded-full border border-gold/30 animate-orbital-pulse" />
            <div className="absolute inset-1 rounded-full border border-gold/20" style={{ animationDelay: '0.5s' }} />
            {/* Inner circle with icon */}
            <div className="relative w-12 h-12 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
              <Scale className="w-5 h-5 text-gold" />
            </div>
          </div>
          
          <h2
            className={`text-xs uppercase tracking-[0.4em] text-gold mb-8 font-medium transition-all duration-700 ease-out delay-200 ${
              isVisible ? "opacity-100 translate-y-0 animate-chromatic-shimmer" : "opacity-0 translate-y-4"
            }`}
          >
            ◇ The Consciousness Field ◇
          </h2>
          
          <p
            className={`text-2xl md:text-3xl font-serif leading-relaxed mb-8 transition-all duration-700 ease-out delay-[400ms] ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <span className="text-holographic">The Matthew Effect governs resonance:</span>
            <br />
            <span className="text-foreground">Those who contribute, accumulate. Those who decay, dissolve.</span>
          </p>
          
          <p
            className={`text-base text-muted-foreground leading-relaxed max-w-xl mx-auto mb-6 transition-all duration-700 ease-out delay-[600ms] ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Buoyancis is not a platform—<span className="text-gold/80">it is a managed sovereignty field</span>. Trust compounds through continuous observation, 
            but decays without renewal. A dynamic equilibrium between <span className="text-gold/80">accumulation</span> and <span className="text-gold/80">entropy cleaning</span>.
          </p>
          
          <p
            className={`text-xs text-muted-foreground/60 font-mono tracking-wider max-w-md mx-auto transition-all duration-700 ease-out delay-[800ms] ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            「凡有的，還要加給他 ↔ 天之道，損有餘而補不足」
          </p>
          
          {/* Decorative bottom element */}
          <div className={`flex items-center justify-center gap-4 mt-12 transition-all duration-700 ease-out delay-[800ms] ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}>
            <div className="w-16 h-px bg-gradient-to-r from-transparent to-gold/40" />
            <div className="w-2 h-2 rotate-45 border border-gold/50" />
            <div className="w-16 h-px bg-gradient-to-l from-transparent to-gold/40" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhatIsBuoyancis;
