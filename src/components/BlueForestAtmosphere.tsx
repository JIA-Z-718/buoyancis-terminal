import { useEffect, useState, useMemo, memo } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useReducedMotion, useIsLowEndDevice } from "@/hooks/useReducedMotion";

interface BlueForestAtmosphereProps {
  className?: string;
  intensity?: "subtle" | "medium" | "strong";
}

// Memoized static layers to prevent re-renders
const StaticLayers = memo(({ glowOpacity }: { glowOpacity: number }) => (
  <>
    {/* Top vignette */}
    <div 
      className="absolute inset-0 pointer-events-none"
      style={{
        background: `linear-gradient(180deg, 
          rgba(45, 70, 80, ${glowOpacity * 0.5}) 0%, 
          transparent 30%)`,
      }}
    />
    {/* Subtle scanline texture */}
    <div 
      className="absolute inset-0 opacity-[0.015] pointer-events-none"
      style={{
        backgroundImage: `repeating-linear-gradient(
          0deg,
          transparent,
          transparent 3px,
          rgba(70, 100, 90, 0.08) 3px,
          rgba(70, 100, 90, 0.08) 6px
        )`,
      }}
    />
  </>
));
StaticLayers.displayName = 'StaticLayers';

// Single optimized mist layer using CSS animations
const OptimizedMist = memo(({ config }: { config: { mistOpacity: number; glowOpacity: number } }) => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {/* Combined gradient layers - no framer-motion for performance */}
    <div 
      className="absolute inset-0 animate-pulse"
      style={{
        background: `
          radial-gradient(ellipse 120% 80% at 50% 100%, 
            rgba(45, 80, 90, ${config.glowOpacity}) 0%, 
            transparent 60%),
          radial-gradient(ellipse 100% 60% at 20% 80%, 
            rgba(60, 100, 80, ${config.glowOpacity * 0.7}) 0%, 
            transparent 50%),
          radial-gradient(ellipse 100% 60% at 80% 70%, 
            rgba(110, 70, 140, ${config.glowOpacity * 0.8}) 0%, 
            transparent 50%)
        `,
        animationDuration: '8s',
      }}
    />
    {/* Mist overlay with CSS animation */}
    <div 
      className="absolute inset-0"
      style={{
        background: `linear-gradient(180deg, transparent 0%, rgba(70, 110, 100, ${config.mistOpacity}) 50%, transparent 100%)`,
        filter: 'blur(60px)',
        animation: 'float 20s ease-in-out infinite',
      }}
    />
  </div>
));
OptimizedMist.displayName = 'OptimizedMist';

// Reduced particle count with CSS animations
const OptimizedParticles = memo(({ count, isViolet = false }: { count: number; isViolet?: boolean }) => {
  const particles = useMemo(() => 
    Array.from({ length: Math.min(count, 6) }, (_, i) => ({
      id: i,
      size: 30 + (i * 15) % 40,
      x: `${15 + (i * 25) % 70}%`,
      y: `${20 + (i * 30) % 60}%`,
      delay: i * 2,
      duration: 12 + (i * 3) % 8,
    })), [count]);

  return (
    <>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: p.size,
            height: p.size,
            left: p.x,
            top: p.y,
            background: isViolet 
              ? 'radial-gradient(circle, rgba(140, 90, 160, 0.3) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(120, 100, 140, 0.25) 0%, transparent 70%)',
            animation: `float ${p.duration}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </>
  );
});
OptimizedParticles.displayName = 'OptimizedParticles';

const BlueForestAtmosphere = ({ 
  className = "", 
  intensity = "subtle" 
}: BlueForestAtmosphereProps) => {
  const [mounted, setMounted] = useState(false);
  const { scrollY } = useScroll();
  const prefersReduced = useReducedMotion();
  const isLowEnd = useIsLowEndDevice();

  // Single parallax transform for main layer
  const parallaxY = useTransform(scrollY, [0, 2000], [0, -40]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const config = useMemo(() => {
    const configs = {
      subtle: { mistOpacity: 0.03, particleCount: 4, glowOpacity: 0.05 },
      medium: { mistOpacity: 0.05, particleCount: 6, glowOpacity: 0.08 },
      strong: { mistOpacity: 0.08, particleCount: 8, glowOpacity: 0.12 },
    };
    return configs[intensity];
  }, [intensity]);

  // Skip entirely on reduced motion or low-end
  if (!mounted || prefersReduced || isLowEnd) return null;

  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden z-0 ${className}`}>
      {/* Main parallax container - single motion.div for all moving elements */}
      <motion.div 
        className="absolute inset-0"
        style={{ y: parallaxY }}
      >
        <OptimizedMist config={config} />
        <OptimizedParticles count={config.particleCount} />
        <OptimizedParticles count={Math.floor(config.particleCount * 0.6)} isViolet />
      </motion.div>

      {/* Ambient glow - reduced to 2 elements with CSS animation */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '35vw',
          height: '35vw',
          left: '10%',
          bottom: '20%',
          background: 'radial-gradient(circle, rgba(60, 100, 90, 0.06) 0%, transparent 70%)',
          filter: 'blur(40px)',
          animation: 'pulse 15s ease-in-out infinite',
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '30vw',
          height: '30vw',
          right: '5%',
          bottom: '30%',
          background: 'radial-gradient(circle, rgba(130, 80, 160, 0.07) 0%, transparent 70%)',
          filter: 'blur(45px)',
          animation: 'pulse 18s ease-in-out infinite',
          animationDelay: '3s',
        }}
      />

      <StaticLayers glowOpacity={config.glowOpacity} />

      {/* CSS keyframes */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.4; }
          50% { transform: translateY(-10px) scale(1.05); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export default BlueForestAtmosphere;
