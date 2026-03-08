import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import EntropyParticles from "./EntropyParticles";
import SignalMap from "./SignalMap";
import { useReducedMotion, useIsLowEndDevice } from "@/hooks/useReducedMotion";

const Hero = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const rafRef = useRef<number>();
  const prefersReduced = useReducedMotion();
  const isLowEnd = useIsLowEndDevice();
  const skipParallax = prefersReduced || isLowEnd;

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

  // Parallax mouse tracking — disabled on low-end / reduced-motion
  useEffect(() => {
    if (skipParallax) return;

    let ticking = false;
    const handleMouseMove = (e: MouseEvent) => {
      mousePositionRef.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      };
      if (!ticking) {
        ticking = true;
        rafRef.current = requestAnimationFrame(() => {
          setMousePosition(mousePositionRef.current);
          ticking = false;
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [skipParallax]);

  return (
    <section 
      id="hero-section" 
      ref={sectionRef} 
      className="relative min-h-[90vh] flex items-center justify-center section-padding pt-24 md:pt-32 overflow-hidden"
    >
      {/* Deep space gradient with multiple layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background" />
      
      {/* Radial gradient spotlight */}
      <div 
        className="absolute inset-0 opacity-60"
        style={{
          background: `radial-gradient(ellipse 80% 60% at ${50 + mousePosition.x * 0.5}% ${40 + mousePosition.y * 0.5}%, 
            rgba(212, 175, 55, 0.08) 0%, 
            rgba(212, 175, 55, 0.02) 40%, 
            transparent 70%)`,
          transition: 'background 0.3s ease-out',
        }}
      />
      
      {/* Entropy Particles — scaled down on low-end devices */}
      {!prefersReduced && (
        <div className="absolute inset-0 overflow-hidden">
          <EntropyParticles 
            particleCount={isLowEnd ? 30 : 60} 
            intensity={isLowEnd ? "low" : "medium"} 
          />
        </div>
      )}
      
      {/* Cyber grid overlay — static on low-end */}
      <div 
        className="absolute inset-0 cyber-grid opacity-30"
        style={skipParallax ? undefined : {
          transform: `translate(${mousePosition.x * 0.1}px, ${mousePosition.y * 0.1}px)`,
        }}
      />
      
      {/* Orbital rings decoration — hidden on reduced motion */}
      {!prefersReduced && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          {[400, 500, 600].map((size, i) => (
            <div
              key={size}
              className="absolute rounded-full border border-gold/10 animate-orbital-pulse"
              style={{
                width: size,
                height: size,
                left: -size / 2,
                top: -size / 2,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${6 + i * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Interactive signal map – behind text, above gradients */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50 mix-blend-screen">
        <div className="w-full max-w-5xl h-[70%] [&_svg]:pointer-events-auto">
          <SignalMap />
        </div>
      </div>
      
      {/* Horizontal ritual lines */}
      <div className={`absolute top-1/4 left-0 right-0 h-px transition-all duration-1500 ease-out delay-500 ${
        isVisible ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
      }`}>
        <div className="h-full bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      </div>
      <div className={`absolute bottom-1/4 left-0 right-0 h-px transition-all duration-1500 ease-out delay-700 ${
        isVisible ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
      }`}>
        <div className="h-full bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
      </div>
      
      <div className="container-narrow relative z-10 text-center">
        {/* Floating badge with glow */}
        <div 
          className={`inline-flex items-center gap-2 px-5 py-2.5 mb-10 rounded-full glass-morphism animate-float transition-all duration-700 ease-out ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ animationDelay: '0.5s' }}
        >
          <Sparkles className="w-4 h-4 text-gold animate-pulse" />
          <span className="text-xs uppercase tracking-[0.25em] text-gold font-medium">
            The Global Verification Layer
          </span>
          <span className="w-2 h-2 rounded-full bg-gold animate-radial-pulse" />
        </div>
        
        {/* Main headline - Sovereign Pitch */}
        <h1 
          className={`text-5xl md:text-7xl lg:text-8xl font-serif font-medium mb-8 leading-[1.05] transition-all duration-1000 ease-out delay-100 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{
            transform: `translate(${mousePosition.x * 0.05}px, ${mousePosition.y * 0.05}px)`,
          }}
        >
          <span className="text-holographic animate-chromatic-shimmer block">
            Trust Has Mass.
          </span>
          <span className="text-gold block" style={{ animationDelay: '0.2s' }}>
            We Measure It.
          </span>
        </h1>
        
        {/* Sub-headline - Protocol Definition */}
        <p 
          className={`text-lg md:text-2xl text-foreground/90 font-light mb-6 max-w-3xl mx-auto transition-all duration-700 ease-out delay-300 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          Buoyancis is the world's first <span className="text-gold font-medium">Verification Protocol</span>.
          <br className="hidden md:block" />
          We replace the noise of "Five Stars" with the physics of <span className="text-gold font-medium">Reputation Gravity</span>.
        </p>
        
        {/* Technical descriptor */}
        <p 
          className={`max-w-2xl mx-auto text-sm md:text-base text-muted-foreground leading-relaxed mb-12 transition-all duration-700 ease-out delay-400 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          Observer Nodes weighted by historical integrity. 99% AI-generated noise filtered.
          <br className="hidden md:block" />
          The result is not an average—it's a <span className="text-gold/80">deterministic truth</span>.
        </p>
        
        {/* CTAs - Sovereign Language */}
        <div 
          className={`flex flex-col sm:flex-row items-center justify-center gap-5 transition-all duration-700 ease-out delay-500 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <Button 
            variant="hero" 
            size="lg" 
            className="group magnetic-hover animate-neon-border relative overflow-hidden"
            asChild
          >
            <a href="#early-access">
              <span className="relative z-10 flex items-center gap-2">
                Verify Your Business
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </a>
          </Button>
          <Button 
            variant="calm" 
            size="lg" 
            className="magnetic-hover gold-accent-line"
            asChild
          >
            <a href="#trust-matrix">
              View the Signal
            </a>
          </Button>
        </div>

        {/* Decoder hint with enhanced styling */}
        <div 
          className={`mt-20 transition-all duration-700 ease-out delay-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <Link 
            to="/tools/decoder?word=ENTROPY" 
            className="inline-block group"
          >
            <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground/50 hover:text-gold/80 transition-all duration-300">
              <span className="uppercase tracking-[0.3em]">Decode:</span>
              <span className="px-5 py-2 glass-morphism rounded-lg font-medium group-hover:animate-neon-border transition-all duration-300">
                E-N-T-R-O-P-Y
              </span>
              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        </div>
      </div>
      
      {/* Bottom fade gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
};

export default Hero;
