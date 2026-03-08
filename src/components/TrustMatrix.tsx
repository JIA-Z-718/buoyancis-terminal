import { useState, useEffect, useRef } from "react";

// Custom SVG icons for each tier - more mystical and geometric
const TierIcons = {
  // Tier 1: The Eye of Observation - geometric all-seeing eye
  Observer: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5">
      <path d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7z" />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
      <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeWidth="1" opacity="0.5" />
    </svg>
  ),
  
  // Tier 2: The Rising Flame - emerging power
  Contributor: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2L8 8l4 2-3 5 7-6-4-1 4-6h-4z" fill="currentColor" opacity="0.3" />
      <path d="M12 2L8 8l4 2-3 5 7-6-4-1 4-6h-4z" />
      <circle cx="12" cy="18" r="3" strokeWidth="1" />
      <path d="M12 21v1M9 18H8M16 18h-1" strokeWidth="1" opacity="0.5" />
    </svg>
  ),
  
  // Tier 3: The Sacred Shield - geometric protection sigil
  Sentinel: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2L3 7v6c0 5.25 3.75 10 9 11 5.25-1 9-5.75 9-11V7l-9-5z" />
      <path d="M12 6l-5 3v4c0 3 2 5.5 5 6.5 3-1 5-3.5 5-6.5v-4l-5-3z" fill="currentColor" opacity="0.2" />
      <path d="M12 8v8M8 12h8" strokeWidth="2" />
    </svg>
  ),
  
  // Tier 4: The Compass Rose - arbiter of direction
  Arbiter: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <polygon points="12,2 14,10 12,12 10,10" fill="currentColor" />
      <polygon points="22,12 14,14 12,12 14,10" fill="currentColor" opacity="0.7" />
      <polygon points="12,22 10,14 12,12 14,14" fill="currentColor" opacity="0.5" />
      <polygon points="2,12 10,10 12,12 10,14" fill="currentColor" opacity="0.3" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  ),
  
  // Tier 5: The Oracle's Crown - sacred geometry crown
  Oracle: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5">
      <path d="M2 17l3-8 4 4 3-7 3 7 4-4 3 8" />
      <path d="M2 17h20v3H2z" fill="currentColor" opacity="0.3" />
      <circle cx="5" cy="9" r="1.5" fill="currentColor" />
      <circle cx="12" cy="6" r="2" fill="currentColor" />
      <circle cx="19" cy="9" r="1.5" fill="currentColor" />
      <path d="M12 2v2" strokeWidth="2" />
      <path d="M9 3l3 1 3-1" strokeWidth="1" opacity="0.6" />
    </svg>
  ),
};

// Trust tier definitions with quantum physics terminology
const trustTiers = [
  {
    tier: 1,
    name: "Observer",
    icon: TierIcons.Observer,
    frequency: 1,
    bgGradient: "from-zinc-800 to-zinc-900",
    iconColor: "text-zinc-300",
    borderColor: "border-zinc-600",
    glowColor: "rgba(161, 161, 170, 0.2)",
    description: "New entrant. Awaiting first wave collapse.",
    waveform: "chaotic",
  },
  {
    tier: 2,
    name: "Resonator",
    icon: TierIcons.Contributor,
    frequency: 3,
    bgGradient: "from-blue-900/50 to-indigo-950/50",
    iconColor: "text-blue-400",
    borderColor: "border-blue-700/50",
    glowColor: "rgba(96, 165, 250, 0.25)",
    description: "Emerging frequency. Constructive interference forming.",
    waveform: "unstable",
  },
  {
    tier: 3,
    name: "Sentinel",
    icon: TierIcons.Sentinel,
    frequency: 7,
    bgGradient: "from-emerald-900/40 to-teal-950/40",
    iconColor: "text-emerald-400",
    borderColor: "border-emerald-700/50",
    glowColor: "rgba(52, 211, 153, 0.25)",
    description: "Stable waveform. Local entanglement verified.",
    waveform: "stabilizing",
  },
  {
    tier: 4,
    name: "Arbiter",
    icon: TierIcons.Arbiter,
    frequency: 15,
    bgGradient: "from-amber-900/40 to-orange-950/40",
    iconColor: "text-amber-400",
    borderColor: "border-amber-600/50",
    glowColor: "rgba(251, 191, 36, 0.3)",
    description: "High resonance. Collapses uncertainty fields.",
    waveform: "coherent",
  },
  {
    tier: 5,
    name: "Oracle",
    icon: TierIcons.Oracle,
    frequency: 30,
    bgGradient: "from-gold/20 to-yellow-900/30",
    iconColor: "text-gold",
    borderColor: "border-gold/50",
    glowColor: "rgba(212, 175, 55, 0.4)",
    description: "Maximum frequency. Consciousness anchor point.",
    waveform: "pure",
  },
];

interface TrustMatrixProps {
  className?: string;
}

const TrustMatrix = ({ className = "" }: TrustMatrixProps) => {
  const [activeTier, setActiveTier] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

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
    <section
      ref={sectionRef}
      id="trust-matrix"
      className={`section-padding bg-background relative overflow-hidden ${className}`}
    >
      {/* Animated cyber grid background */}
      <div className="absolute inset-0 cyber-grid opacity-20" />
      
      {/* Neural network connection lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
        <defs>
          <linearGradient id="neural-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(212, 175, 55, 0)" />
            <stop offset="50%" stopColor="rgba(212, 175, 55, 0.3)" />
            <stop offset="100%" stopColor="rgba(212, 175, 55, 0)" />
          </linearGradient>
        </defs>
        {/* Animated neural paths */}
        {isVisible && (
          <>
            <path
              d="M0,50% Q25%,30% 50%,50% T100%,50%"
              fill="none"
              stroke="url(#neural-gradient)"
              strokeWidth="1"
              className="animate-energy-wave"
            />
            <path
              d="M0,30% Q25%,50% 50%,30% T100%,30%"
              fill="none"
              stroke="url(#neural-gradient)"
              strokeWidth="1"
              className="animate-energy-wave"
              style={{ animationDelay: '0.5s' }}
            />
            <path
              d="M0,70% Q25%,50% 50%,70% T100%,70%"
              fill="none"
              stroke="url(#neural-gradient)"
              strokeWidth="1"
              className="animate-energy-wave"
              style={{ animationDelay: '1s' }}
            />
          </>
        )}
      </svg>

      {/* Central radial glow - enhanced */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[700px] rounded-full pointer-events-none transition-all duration-700"
        style={{
          background: activeTier !== null 
            ? `radial-gradient(ellipse, ${trustTiers[activeTier].glowColor} 0%, ${trustTiers[activeTier].glowColor.replace('0.', '0.0')} 30%, transparent 60%)`
            : 'radial-gradient(ellipse, rgba(212, 175, 55, 0.08) 0%, rgba(212, 175, 55, 0.02) 30%, transparent 60%)',
        }}
      />
      
      {/* Orbital rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        {[300, 450, 600].map((size, i) => (
          <div
            key={size}
            className={`absolute rounded-full border border-gold/5 ${isVisible ? 'animate-orbital-pulse' : 'opacity-0'}`}
            style={{
              width: size,
              height: size,
              left: -size / 2,
              top: -size / 2,
              animationDelay: `${i * 0.7}s`,
              animationDuration: `${8 + i * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="container-narrow relative z-10">
        {/* Section header - enhanced */}
        <div className="text-center mb-20">
          <p
            className={`text-xs uppercase tracking-[0.4em] text-gold/80 mb-6 transition-all duration-700 ease-out ${
              isVisible ? "opacity-100 translate-y-0 animate-chromatic-shimmer" : "opacity-0 translate-y-4"
            }`}
          >
            ◇ Resonance Architecture ◇
          </p>
          <h2
            className={`text-4xl md:text-5xl lg:text-6xl font-serif mb-6 transition-all duration-700 ease-out delay-100 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <span className="text-holographic">Frequency</span>{" "}
            <span className="text-foreground">Matrix</span>
          </h2>
          <p
            className={`text-muted-foreground max-w-2xl mx-auto text-lg transition-all duration-700 ease-out delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            In the consciousness field, <span className="text-gold/80">similar frequencies resonate</span>. High-frequency observers 
            produce constructive interference; low-frequency noise is filtered through destructive interference.
          </p>
          
          {/* Frequency scale indicator */}
          <div className={`flex items-center justify-center gap-2 mt-8 transition-all duration-700 ease-out delay-300 ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}>
            <span className="text-xs text-muted-foreground/50 uppercase tracking-wider">Resonance Scale:</span>
            <div className="flex items-center gap-1">
              {[1, 3, 7, 15, 30].map((freq, i) => (
                <div 
                  key={freq}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    activeTier === i ? 'bg-gold' : 'bg-gold/20'
                  }`}
                  style={{ width: `${8 + freq}px` }}
                />
              ))}
            </div>
            <span className="text-xs font-mono text-gold/70">×1 → ×30 Hz</span>
          </div>
        </div>

        {/* Trust tiers visualization */}
        <div className="relative">
          {/* Connection lines - enhanced */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`h-0.5 w-full max-w-4xl transition-all duration-1500 ease-out ${
              isVisible ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
            }`}>
              <div className="h-full bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
              {/* Animated energy pulse */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/50 to-transparent animate-energy-wave" />
            </div>
          </div>

          {/* Tier cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-5 relative">
            {trustTiers.map((tierData, index) => {
              const Icon = tierData.icon;
              const isActive = activeTier === index;
              
              return (
                <div
                  key={tierData.tier}
                  className={`relative group cursor-pointer transition-all duration-500 ease-out ${
                    isVisible 
                      ? "opacity-100 translate-y-0" 
                      : "opacity-0 translate-y-8"
                  }`}
                  style={{ transitionDelay: `${300 + index * 100}ms` }}
                  onMouseEnter={() => setActiveTier(index)}
                  onMouseLeave={() => setActiveTier(null)}
                >
                  {/* Card - enhanced glass morphism */}
                  <div
                    className={`relative p-6 rounded-2xl border transition-all duration-500 glass-morphism ${
                      isActive
                        ? `${tierData.borderColor} scale-105`
                        : `border-border/20 hover:border-gold/20`
                    }`}
                    style={{
                      boxShadow: isActive 
                        ? `0 0 60px ${tierData.glowColor}, 0 0 30px ${tierData.glowColor}, inset 0 0 20px ${tierData.glowColor.replace(')', ', 0.1)')}` 
                        : 'none',
                    }}
                  >
                    {/* Tier number badge - enhanced */}
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-mono transition-all duration-300 ${
                      isActive 
                        ? `bg-gradient-to-r ${tierData.bgGradient} ${tierData.iconColor} ${tierData.borderColor} border animate-radial-pulse` 
                        : 'bg-background border border-border/50 text-muted-foreground'
                    }`}>
                      TIER {tierData.tier}
                    </div>

                    {/* Icon container with enhanced geometric frame */}
                    <div className="relative w-20 h-20 mx-auto mb-5 mt-2">
                      {/* Outer rotating ring */}
                      <div className={`absolute inset-0 rounded-xl border-2 ${isActive ? tierData.borderColor : 'border-border/30'} transition-all duration-500 ${
                        isActive ? "rotate-45 scale-125 animate-orbital-pulse" : "rotate-0"
                      }`} style={{ animationDuration: '4s' }} />
                      
                      {/* Middle hexagonal frame */}
                      <div className={`absolute inset-1 transition-all duration-300 ${
                        isActive ? "scale-110" : ""
                      }`}>
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                          <polygon 
                            points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" 
                            fill="none" 
                            stroke={isActive ? "currentColor" : "rgba(255,255,255,0.1)"} 
                            strokeWidth="1"
                            className={`${isActive ? tierData.iconColor : 'text-border'} transition-colors duration-300`}
                          />
                        </svg>
                      </div>
                      
                      {/* Inner icon circle with glow */}
                      <div className={`absolute inset-3 rounded-lg flex items-center justify-center transition-all duration-300 ${
                        isActive ? "scale-110" : ""
                      }`}
                      style={{
                        background: isActive 
                          ? `radial-gradient(circle, ${tierData.glowColor.replace('0.', '0.3')} 0%, transparent 70%)`
                          : 'transparent'
                      }}
                      >
                        <Icon className={`w-9 h-9 ${tierData.iconColor} transition-all duration-300 ${
                          isActive ? "scale-110 drop-shadow-lg" : ""
                        }`} />
                      </div>
                      
                      {/* Corner accents with animation */}
                      {isActive && (
                        <>
                          <div className={`absolute -top-2 -left-2 w-3 h-3 border-l-2 border-t-2 ${tierData.borderColor} animate-pulse`} />
                          <div className={`absolute -top-2 -right-2 w-3 h-3 border-r-2 border-t-2 ${tierData.borderColor} animate-pulse`} style={{ animationDelay: '0.1s' }} />
                          <div className={`absolute -bottom-2 -left-2 w-3 h-3 border-l-2 border-b-2 ${tierData.borderColor} animate-pulse`} style={{ animationDelay: '0.2s' }} />
                          <div className={`absolute -bottom-2 -right-2 w-3 h-3 border-r-2 border-b-2 ${tierData.borderColor} animate-pulse`} style={{ animationDelay: '0.3s' }} />
                        </>
                      )}
                    </div>

                    {/* Name - enhanced */}
                    <h3 className={`text-center font-semibold text-lg mb-2 transition-all duration-300 ${
                      isActive ? `${tierData.iconColor} animate-chromatic-shimmer` : "text-foreground"
                    }`}>
                      {tierData.name}
                    </h3>

                    {/* Weight indicator - enhanced visual bar */}
                    <div className="flex flex-col items-center gap-2 mb-4">
                      <div className="w-full h-1.5 bg-border/30 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isActive ? 'animate-energy-wave' : ''
                          }`}
                          style={{ 
                            width: `${(tierData.frequency / 30) * 100}%`,
                            background: isActive 
                              ? `linear-gradient(90deg, ${tierData.glowColor}, rgba(255, 220, 100, 0.8), ${tierData.glowColor})`
                              : 'rgba(212, 175, 55, 0.3)'
                          }}
                        />
                      </div>
                      <span className={`text-sm font-mono font-bold transition-colors duration-300 ${
                        isActive ? tierData.iconColor : "text-muted-foreground"
                      }`}>
                        ×{tierData.frequency} Hz
                      </span>
                    </div>

                    {/* Description - enhanced reveal */}
                    <p className={`text-xs text-center text-muted-foreground/80 transition-all duration-500 ${
                      isActive ? "opacity-100 max-h-24 mt-2" : "opacity-0 max-h-0 overflow-hidden"
                    }`}>
                      {tierData.description}
                    </p>

                    {/* Influence ripple effect - enhanced */}
                    {isActive && (
                      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                        <div 
                          className="absolute inset-0"
                          style={{
                            background: `radial-gradient(circle at 50% 0%, ${tierData.glowColor} 0%, transparent 50%)`,
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Gravity influence visualization - enhanced rings */}
                  {isActive && (
                    <div className="absolute -inset-6 -z-10 pointer-events-none">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className={`absolute inset-0 rounded-3xl border ${tierData.borderColor}`}
                          style={{
                            animation: `ping ${2 + i * 0.5}s cubic-bezier(0, 0, 0.2, 1) infinite`,
                            animationDelay: `${i * 0.2}s`,
                            opacity: 0.3 - i * 0.05,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom note - enhanced */}
        <div
          className={`text-center mt-16 transition-all duration-700 ease-out delay-700 ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <p className="text-xs text-muted-foreground/50 uppercase tracking-[0.3em] mb-3">
            Higher tiers exert gravitational influence on consensus
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-gold/30" />
            <span className="text-gold/60 text-lg">◆</span>
            <div className="w-12 h-px bg-gradient-to-l from-transparent to-gold/30" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustMatrix;
