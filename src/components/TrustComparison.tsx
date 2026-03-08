import { useEffect, useRef, useState } from "react";
import { Check, X, Shield, Star, Users, TrendingUp, AlertTriangle, Eye } from "lucide-react";

const TrustComparison = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

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

  const traditionalProblems = [
    { icon: AlertTriangle, text: "Fake reviews from bots & paid actors", color: "text-destructive" },
    { icon: Users, text: "All users have equal weight", color: "text-muted-foreground" },
    { icon: Eye, text: "No verification of experience", color: "text-muted-foreground" },
    { icon: TrendingUp, text: "Easily manipulated rankings", color: "text-muted-foreground" },
  ];

  const buoyancisSolutions = [
    { icon: Shield, text: "Verified locals hold 5× voting power", color: "text-gold" },
    { icon: Star, text: "Tiered trust based on track record", color: "text-gold" },
    { icon: Check, text: "Proof-of-presence verification", color: "text-gold" },
    { icon: TrendingUp, text: "Weighted consensus resists manipulation", color: "text-gold" },
  ];

  return (
    <section ref={sectionRef} className="section-padding bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 cyber-grid opacity-5" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-gradient-radial from-gold/5 to-transparent pointer-events-none" />
      
      <div className="container-narrow relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <p
            className={`text-xs uppercase tracking-[0.4em] text-gold/80 mb-4 transition-all duration-700 ease-out ${
              isVisible ? "opacity-100 animate-chromatic-shimmer" : "opacity-0"
            }`}
          >
            ◇ The Difference ◇
          </p>
          <h2
            className={`text-3xl md:text-4xl font-serif mb-4 transition-all duration-700 ease-out delay-100 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <span className="text-foreground">Traditional Reviews</span>
            <span className="text-muted-foreground mx-4">vs</span>
            <span className="text-holographic">Buoyancis</span>
          </h2>
          <p
            className={`text-muted-foreground max-w-xl mx-auto transition-all duration-700 ease-out delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            See how weighted trust transforms the review landscape
          </p>
        </div>

        {/* Comparison Grid */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
          {/* Traditional Reviews */}
          <div
            className={`p-6 md:p-8 rounded-2xl border border-destructive/20 bg-destructive/5 transition-all duration-700 ease-out delay-300 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                <X className="w-5 h-5 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Traditional Platforms</h3>
            </div>
            <ul className="space-y-4">
              {traditionalProblems.map((item, index) => (
                <li
                  key={index}
                  className={`flex items-start gap-3 transition-all duration-500 ease-out ${
                    isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                  }`}
                  style={{ transitionDelay: `${400 + index * 100}ms` }}
                >
                  <item.icon className={`w-5 h-5 mt-0.5 ${item.color}`} />
                  <span className="text-muted-foreground text-sm">{item.text}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 pt-4 border-t border-destructive/20">
              <p className="text-xs text-destructive/70 italic">
                "One voice = One vote, regardless of credibility"
              </p>
            </div>
          </div>

          {/* Buoyancis */}
          <div
            className={`p-6 md:p-8 rounded-2xl border border-gold/30 bg-gold/5 relative overflow-hidden transition-all duration-700 ease-out delay-300 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            }`}
          >
            {/* Glow effect */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-radial from-gold/20 to-transparent rounded-full blur-2xl" />
            
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center border border-gold/30">
                  <Check className="w-5 h-5 text-gold" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Buoyancis Protocol</h3>
              </div>
              <ul className="space-y-4">
                {buoyancisSolutions.map((item, index) => (
                  <li
                    key={index}
                    className={`flex items-start gap-3 transition-all duration-500 ease-out ${
                      isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
                    }`}
                    style={{ transitionDelay: `${400 + index * 100}ms` }}
                  >
                    <item.icon className={`w-5 h-5 mt-0.5 ${item.color}`} />
                    <span className="text-foreground/90 text-sm">{item.text}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 pt-4 border-t border-gold/20">
                <p className="text-xs text-gold/80 italic">
                  "Verified experience = Amplified influence"
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* The Algorithm - Mathematical Beauty */}
        <div
          className={`mt-16 max-w-3xl mx-auto transition-all duration-700 ease-out delay-600 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="text-center mb-8">
            <p className="text-xs uppercase tracking-[0.3em] text-gold/70 mb-3">The Algorithm</p>
            <h3 className="text-xl font-serif text-foreground">Trust is Mathematics, Not Marketing</h3>
          </div>
          
          {/* Formula Display */}
          <div className="p-8 rounded-2xl border border-gold/20 bg-gradient-to-b from-gold/5 to-transparent relative overflow-hidden">
            {/* Decorative corners */}
            <div className="absolute top-2 left-2 w-4 h-4 border-l border-t border-gold/30" />
            <div className="absolute top-2 right-2 w-4 h-4 border-r border-t border-gold/30" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-l border-b border-gold/30" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-r border-b border-gold/30" />
            
            {/* Main Formula */}
            <div className="text-center mb-6">
              <div className="inline-block px-4 md:px-6 py-4 rounded-xl bg-background/50 border border-gold/10 max-w-full overflow-x-auto">
                <p className="font-mono text-sm sm:text-base md:text-xl text-foreground tracking-wide whitespace-nowrap">
                  <span className="text-gold">TrustScore</span>
                  <span className="text-muted-foreground mx-1 md:mx-2">=</span>
                  <span className="text-foreground/80">(</span>
                  <span className="text-gold/80">Base</span>
                  <span className="text-muted-foreground mx-0.5 md:mx-1">×</span>
                  <span className="text-gold/80">Continuity</span>
                  <span className="text-foreground/80">)</span>
                  <span className="text-muted-foreground mx-1 md:mx-2">+</span>
                  <span className="text-gold/80">LocalGravity</span>
                </p>
              </div>
            </div>
            
            {/* Formula Components */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-lg bg-background/30">
                <p className="text-gold font-mono text-sm mb-1">Base</p>
                <p className="text-xs text-muted-foreground">Tier weight (1×–30×)</p>
              </div>
              <div className="p-4 rounded-lg bg-background/30">
                <p className="text-gold font-mono text-sm mb-1">Continuity</p>
                <p className="text-xs text-muted-foreground">Time × Consistency</p>
              </div>
              <div className="p-4 rounded-lg bg-background/30">
                <p className="text-gold font-mono text-sm mb-1">LocalGravity</p>
                <p className="text-xs text-muted-foreground">Region proximity factor</p>
              </div>
            </div>
          </div>
        </div>

        {/* Visual weight demonstration */}
        <div
          className={`mt-12 max-w-2xl mx-auto text-center transition-all duration-700 ease-out delay-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="p-6 rounded-xl border border-border bg-foreground/[0.02]">
            <p className="text-sm text-muted-foreground mb-4">Visual Weight Comparison</p>
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <div className="w-8 h-8 rounded-full bg-muted mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">New User</p>
                <p className="text-lg font-mono text-muted-foreground">1×</p>
              </div>
              <div className="text-2xl text-muted-foreground/30">→</div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-gold/30 border-2 border-gold/50 mx-auto mb-2 animate-pulse" />
                <p className="text-xs text-gold">Verified Local</p>
                <p className="text-lg font-mono text-gold font-bold">5×</p>
              </div>
              <div className="text-2xl text-muted-foreground/30">→</div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gold/50 border-2 border-gold mx-auto mb-2 animate-radial-pulse" />
                <p className="text-xs text-gold">Oracle Tier</p>
                <p className="text-lg font-mono text-gold font-bold">30×</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustComparison;
