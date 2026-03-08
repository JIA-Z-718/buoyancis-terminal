import { useEffect, useRef, useState, useCallback } from "react";
import { useParallax } from "@/hooks/useParallax";
import { Quote as QuoteIcon } from "lucide-react";

// Primary founder statement
const founderStatement = {
  textZh: "在免費的熵增世界裡，我是那個支付高昂代價去換取秩序的人。",
  textEn: "At the cost of five lives' labor, I build the monuments that outlast chaos.",
  attribution: "— Founder's Axiom",
};

// Secondary rotating quotes
const quotes = [
  {
    text: "Trust isn't given. It's earned—review by review, over time.",
    attribution: "On credibility",
  },
  {
    text: "What matters here isn't who's loudest. It's who's been right.",
    attribution: "On authority",
  },
  {
    text: "Local context, long-term trust. Everything else is noise.",
    attribution: "On persistence",
  },
];

const Quote = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const parallaxOffset = useParallax(0.015);

  const rotateQuote = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % quotes.length);
      setIsTransitioning(false);
    }, 400);
  }, []);

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

  // Auto-rotate quotes every 6 seconds
  useEffect(() => {
    if (!isVisible) return;
    
    const interval = setInterval(rotateQuote, 6000);
    return () => clearInterval(interval);
  }, [isVisible, rotateQuote]);

  const currentQuote = quotes[currentIndex];

  return (
    <section
      ref={sectionRef}
      className="section-padding bg-foreground/[0.02] dark:bg-background relative overflow-hidden"
    >
      {/* Parallax background with gold */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-transparent via-gold/[0.02] dark:via-gold/[0.03] to-transparent pointer-events-none"
        style={{ transform: `translateY(${parallaxOffset}px)` }}
      />
      
      {/* Decorative quote marks */}
      <div className={`absolute top-1/4 left-1/4 text-8xl font-serif text-gold/5 dark:text-gold/10 select-none transition-all duration-1000 ease-out ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}>"</div>
      <div className={`absolute bottom-1/4 right-1/4 text-8xl font-serif text-gold/5 dark:text-gold/10 select-none rotate-180 transition-all duration-1000 ease-out delay-200 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}>"</div>

      <div className="container-narrow relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Quote icon with gold */}
          <div
            className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-gold/10 dark:bg-gold/5 border border-gold/20 mb-8 transition-all duration-700 ease-out ${
              isVisible ? "opacity-100 translate-y-0 animate-float" : "opacity-0 translate-y-4"
            }`}
          >
            <QuoteIcon className="w-4 h-4 text-gold" />
          </div>

          {/* Primary Founder Statement - Chinese */}
          <blockquote
            className={`text-xl md:text-2xl lg:text-3xl font-serif text-gold leading-relaxed mb-4 transition-all duration-700 ease-out ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{ 
              textShadow: '0 0 30px rgba(212, 175, 55, 0.2)'
            }}
          >
            「{founderStatement.textZh}」
          </blockquote>

          {/* Primary Founder Statement - English */}
          <blockquote
            className={`text-base md:text-lg text-foreground/70 font-light italic leading-relaxed mb-6 transition-all duration-700 ease-out delay-100 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            "{founderStatement.textEn}"
          </blockquote>

          {/* Founder Attribution */}
          <p
            className={`text-xs uppercase tracking-[0.3em] text-gold/60 mb-12 transition-all duration-700 ease-out delay-200 ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            {founderStatement.attribution}
          </p>

          {/* Divider */}
          <div 
            className={`w-16 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent mx-auto mb-12 transition-all duration-700 ease-out delay-300 ${
              isVisible ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
            }`}
          />

          {/* Secondary Rotating Quote */}
          <blockquote
            className={`text-lg md:text-xl font-serif text-foreground/80 leading-relaxed mb-4 transition-all duration-500 ease-out ${
              isVisible && !isTransitioning ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
          >
            "{currentQuote.text}"
          </blockquote>

          {/* Attribution */}
          <p
            className={`text-sm text-muted-foreground transition-all duration-500 ease-out ${
              isVisible && !isTransitioning ? "opacity-100" : "opacity-0"
            }`}
          >
            — {currentQuote.attribution}
          </p>

          {/* Dots indicator */}
          <div
            className={`flex items-center justify-center gap-2 mt-6 transition-all duration-700 ease-out delay-500 ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            {quotes.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  if (index !== currentIndex) {
                    setIsTransitioning(true);
                    setTimeout(() => {
                      setCurrentIndex(index);
                      setIsTransitioning(false);
                    }, 400);
                  }
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "bg-gold w-4"
                    : "bg-gold/30 hover:bg-gold/50"
                }`}
                aria-label={`Go to quote ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Quote;
