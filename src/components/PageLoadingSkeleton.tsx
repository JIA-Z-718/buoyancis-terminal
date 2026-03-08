import { useEffect, useState } from "react";

const PageLoadingSkeleton = () => {
  const [phase, setPhase] = useState<"superposition" | "collapsing" | "collapsed">("superposition");
  
  useEffect(() => {
    // Transition through wave collapse phases
    const timer1 = setTimeout(() => setPhase("collapsing"), 300);
    const timer2 = setTimeout(() => setPhase("collapsed"), 600);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Quantum field background */}
      <div className="absolute inset-0">
        {/* Multiple probability waves */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-all duration-500 ${
              phase === "superposition" 
                ? "opacity-40 scale-100" 
                : phase === "collapsing" 
                  ? "opacity-20 scale-50" 
                  : "opacity-0 scale-0"
            }`}
            style={{
              width: `${100 + i * 60}px`,
              height: `${100 + i * 60}px`,
              borderColor: `rgba(212, 175, 55, ${0.3 - i * 0.02})`,
              animationDelay: `${i * 0.1}s`,
              transitionDelay: `${i * 30}ms`,
            }}
          />
        ))}
        
        {/* Probability cloud - Schrödinger wave visualization */}
        <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ${
          phase === "superposition" ? "blur-xl scale-150 opacity-30" : 
          phase === "collapsing" ? "blur-md scale-75 opacity-50" : 
          "blur-0 scale-100 opacity-100"
        }`}>
          <svg width="200" height="200" viewBox="0 0 200 200" className="animate-pulse">
            <defs>
              <radialGradient id="probability-gradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(212, 175, 55, 0.8)" />
                <stop offset="40%" stopColor="rgba(212, 175, 55, 0.4)" />
                <stop offset="100%" stopColor="rgba(212, 175, 55, 0)" />
              </radialGradient>
              <filter id="glow-filter">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            
            {/* Probability cloud */}
            <circle 
              cx="100" 
              cy="100" 
              r="80" 
              fill="url(#probability-gradient)" 
              className={`transition-all duration-500 ${
                phase === "collapsed" ? "r-4" : ""
              }`}
            />
            
            {/* Wave function lines */}
            {phase !== "collapsed" && [...Array(8)].map((_, i) => (
              <path
                key={i}
                d={`M ${50 + Math.cos(i * Math.PI / 4) * 20} ${100 + Math.sin(i * Math.PI / 4) * 20} 
                   Q 100 100 ${150 - Math.cos(i * Math.PI / 4) * 20} ${100 - Math.sin(i * Math.PI / 4) * 20}`}
                stroke="rgba(212, 175, 55, 0.3)"
                strokeWidth="1"
                fill="none"
                className="animate-energy-wave"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </svg>
        </div>
        
        {/* Collapsed particle - the revealed truth */}
        <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-out ${
          phase === "collapsed" ? "opacity-100 scale-100" : "opacity-0 scale-0"
        }`}>
          {/* Golden core particle */}
          <div className="relative">
            <div className="w-4 h-4 rounded-full bg-gold shadow-[0_0_30px_rgba(212,175,55,0.8),0_0_60px_rgba(212,175,55,0.4)]" />
            {/* Ripple effect from collapse */}
            <div className="absolute inset-0 w-4 h-4 rounded-full border border-gold/50 animate-ping" />
          </div>
        </div>
      </div>
      
      {/* Logo/Brand mark appearing after collapse */}
      <div className={`relative z-10 text-center transition-all duration-700 delay-300 ${
        phase === "collapsed" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}>
        <p className="text-xs uppercase tracking-[0.4em] text-gold/60 font-mono mt-24">
          ψ → Ω
        </p>
        <p className="text-xs text-muted-foreground/40 mt-2 font-mono">
          Wave function collapsed
        </p>
      </div>
      
      {/* Schrödinger equation hint */}
      <div className={`absolute bottom-12 left-1/2 -translate-x-1/2 transition-all duration-500 ${
        phase === "superposition" ? "opacity-40" : "opacity-0"
      }`}>
        <p className="text-xs font-mono text-gold/30 tracking-wider">
          iℏ ∂ψ/∂t = Ĥψ
        </p>
      </div>
    </div>
  );
};

export default PageLoadingSkeleton;