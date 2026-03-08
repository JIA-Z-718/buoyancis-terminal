import { MapPin, Layers, Clock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useParallax } from "@/hooks/useParallax";

const differentiators = [
  {
    icon: MapPin,
    title: "Context as Coordinate",
    description:
      "Validity is not universal—it refracts through local dimensions. Markets, cultures, and ecosystems each impose their own gravitational constants on judgment.",
  },
  {
    icon: Layers,
    title: "Stratified Authority",
    description:
      "Influence is not distributed—it is earned. Those who endure cycles accumulate mass; newcomers remain weightless until proven through persistence.",
  },
  {
    icon: Clock,
    title: "Entropic Resistance",
    description:
      "All architectures tend toward dissolution. This protocol is the counterforce—an algorithm that preserves coherence against inevitable decay.",
  },
];

const Differentiators = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const parallaxOffset = useParallax(0.02);

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
    <section id="differentiators" ref={sectionRef} className="section-padding bg-foreground/[0.02] dark:bg-background relative overflow-hidden scroll-mt-20">
      {/* Parallax background with gold */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-transparent via-gold/[0.02] dark:via-gold/[0.03] to-transparent pointer-events-none"
        style={{ transform: `translateY(${parallaxOffset}px)` }}
      />
      
      {/* Decorative corner elements */}
      <div className={`absolute top-8 left-8 w-16 h-16 border-l-2 border-t-2 border-gold/10 transition-all duration-1000 ease-out ${
        isVisible ? "opacity-100" : "opacity-0"
      }`} />
      <div className={`absolute top-8 right-8 w-16 h-16 border-r-2 border-t-2 border-gold/10 transition-all duration-1000 ease-out delay-200 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`} />
      
      <div className="container-narrow relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2
            className={`text-3xl md:text-4xl font-serif text-foreground mb-4 transition-all duration-700 ease-out ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            The Axioms
          </h2>
          <p
            className={`text-muted-foreground max-w-lg mx-auto transition-all duration-700 ease-out delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Three immutable principles underpin the architecture of algorithmic truth.
          </p>
        </div>

        {/* Cards grid with gold accents */}
        <div className="grid md:grid-cols-3 gap-6">
          {differentiators.map((item, index) => (
            <div
              key={item.title}
              className={`group p-8 rounded-2xl bg-card dark:bg-card/50 border border-foreground/5 dark:border-gold/10 hover:border-gold/30 hover:shadow-xl hover:shadow-gold/5 transition-all duration-700 ease-out ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
              style={{ transitionDelay: isVisible ? `${400 + index * 150}ms` : "0ms" }}
            >
              {/* Icon with gold accent */}
              <div 
                className="w-12 h-12 rounded-xl bg-gold/10 dark:bg-gold/5 border border-gold/20 flex items-center justify-center mb-6 group-hover:bg-gold group-hover:border-gold transition-colors duration-300"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <item.icon className="w-5 h-5 text-gold group-hover:text-background" />
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold text-foreground mb-3">
                {item.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Differentiators;
