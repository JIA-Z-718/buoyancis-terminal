import { useEffect, useRef, useState } from "react";
import { useParallax } from "@/hooks/useParallax";
import { Linkedin, Twitter } from "lucide-react";
import founderPhoto from "@/assets/founder-photo.jpg";

const founder = {
  name: "Jiahao Zhang",
  role: "Solo Founder",
  linkedin: "https://www.linkedin.com/in/jiahao-zhang718",
  twitter: "https://x.com/JiaZhan78394153",
};

const Team = () => {
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
      id="team"
      ref={sectionRef}
      className="section-padding relative overflow-hidden scroll-mt-20"
    >
      {/* Parallax background layer */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-cream/20 via-transparent to-transparent pointer-events-none"
        style={{ transform: `translateY(${parallaxOffset}px)` }}
      />

      <div className="container-narrow relative z-10">
        {/* Section header */}
        <div className="text-center mb-12">
          <p
            className={`text-sm uppercase tracking-widest text-primary mb-3 transition-all duration-700 ease-out ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            The Founding Team
          </p>
          <h2
            className={`text-3xl md:text-4xl font-serif text-foreground mb-2 transition-all duration-700 ease-out delay-100 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Real-time Status
          </h2>
        </div>

        {/* Founder card - centered, minimal */}
        <div
          className={`max-w-sm mx-auto text-center mb-12 transition-all duration-700 ease-out ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: isVisible ? "300ms" : "0ms" }}
        >
          {/* Avatar */}
          <div className="w-24 h-24 mx-auto mb-5 rounded-full overflow-hidden ring-2 ring-primary/20 ring-offset-2 ring-offset-background shadow-lg shadow-primary/10 transition-transform duration-300 hover:scale-105">
            <img
              src={founderPhoto}
              alt={founder.name}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>

          {/* Name & Role */}
          <h3 className="text-xl font-semibold text-foreground mb-1">
            {founder.name}
          </h3>
          <p className="text-sm text-primary font-medium mb-4">
            {founder.role}
          </p>

          {/* Social links */}
          <div className="flex items-center justify-center gap-3">
            <a
              href={founder.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${founder.name} on LinkedIn`}
              className="w-9 h-9 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <Linkedin className="w-4 h-4" />
            </a>
            <a
              href={founder.twitter}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${founder.name} on Twitter`}
              className="w-9 h-9 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <Twitter className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Humorous recruitment status */}
        <div
          className={`max-w-xl mx-auto text-center transition-all duration-700 ease-out ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ transitionDelay: isVisible ? "500ms" : "0ms" }}
        >
          {/* Headline */}
          <p className="text-lg md:text-xl font-serif text-foreground mb-4 italic">
            "Currently a solo mission, but the recruitment pipeline is hot."
          </p>

          {/* Body */}
          <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
            It's just me for now. However, the expansion plan is aggressive:{" "}
            <span className="text-foreground font-medium">Mom</span> has officially joined the board.{" "}
            <span className="text-foreground font-medium">Stepdad</span> is currently reviewing the offer{" "}
            <span className="text-muted-foreground/70">(pending approval)</span>.{" "}
            <span className="text-foreground font-medium">Donnie</span> is showing great potential, and{" "}
            <span className="text-foreground font-medium">Oscar</span> is highly likely to sign the contract soon.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Team;
