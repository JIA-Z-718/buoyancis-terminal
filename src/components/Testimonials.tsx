import { useEffect, useRef, useState } from "react";
import { useParallax } from "@/hooks/useParallax";
import { Shield, Scale, MapPin, Users, Sparkles, Target } from "lucide-react";

const principles = [
  {
    icon: Shield,
    title: "Trust is earned",
    description:
      "Credibility comes from consistent, honest contributions over time—not from day-one badges or purchased reputation.",
  },
  {
    icon: Scale,
    title: "Reviews should be weighted",
    description:
      "Not all opinions carry equal weight. Context, expertise, and track record matter in determining signal quality.",
  },
  {
    icon: MapPin,
    title: "Context is everything",
    description:
      "A review from someone in your region, your tier, your situation is worth more than a global average.",
  },
  {
    icon: Target,
    title: "Signal over noise",
    description:
      "We optimize for quality and relevance, not volume. Fewer, better reviews beat thousands of meaningless ones.",
  },
  {
    icon: Users,
    title: "Community, not crowds",
    description:
      "Small, trusted networks produce better outcomes than anonymous masses. We build for depth, not reach.",
  },
  {
    icon: Sparkles,
    title: "Transparency by default",
    description:
      "How reviews are weighted, why credibility changes, what factors matter—all visible, all explainable.",
  },
];

const Testimonials = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const parallaxOffset = useParallax(0.015);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="principles"
      ref={sectionRef}
      className="section-padding relative overflow-hidden scroll-mt-20"
    >
      {/* Parallax background layer */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-transparent via-olive-light/5 to-transparent pointer-events-none"
        style={{ transform: `translateY(${parallaxOffset}px)` }}
      />

      <div className="container-narrow relative z-10">
        {/* Section header */}
        <div className="text-center mb-14">
          <p
            className={`text-sm uppercase tracking-widest text-primary mb-3 transition-all duration-700 ease-out ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            What we believe
          </p>
          <h2
            className={`text-3xl md:text-4xl font-serif text-foreground mb-4 transition-all duration-700 ease-out delay-100 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Core principles
          </h2>
          <p
            className={`text-muted-foreground max-w-lg mx-auto transition-all duration-700 ease-out delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            The foundation of how Buoyancis approaches trust, reviews, and credibility.
          </p>
        </div>

        {/* Principles grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {principles.map((principle, index) => {
            const Icon = principle.icon;
            return (
              <div
                key={principle.title}
                className={`group p-6 rounded-2xl bg-card border border-border/60 hover:border-olive-muted/40 hover:shadow-md transition-all duration-300 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{
                  transitionDelay: isVisible ? `${300 + index * 100}ms` : "0ms",
                }}
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl bg-olive-light/60 flex items-center justify-center mb-4 group-hover:bg-olive-light transition-colors">
                  <Icon className="w-5 h-5 text-primary" />
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {principle.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {principle.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
