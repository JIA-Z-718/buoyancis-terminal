import { useEffect, useRef, useState, useCallback, useMemo } from "react";

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  speed: number;
  angle: number;
  entropy: number;
  opacity: number;
  pulsePhase: number;
  layer: number;
}

interface EntropyParticlesProps {
  className?: string;
  particleCount?: number;
  intensity?: "low" | "medium" | "high" | "extreme";
}

const EntropyParticles = ({ 
  className = "", 
  particleCount = 80, // Reduced default
  intensity = "medium" // Reduced default
}: EntropyParticlesProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animationRef = useRef<number>();
  const timeRef = useRef(0);
  const [isVisible, setIsVisible] = useState(false);
  const lastFrameTimeRef = useRef(0);

  const intensityConfig = useMemo(() => ({
    low: { particles: 40, connectionDist: 40, glowIntensity: 0.3, skipFrames: 2 },
    medium: { particles: 60, connectionDist: 50, glowIntensity: 0.5, skipFrames: 1 },
    high: { particles: 80, connectionDist: 60, glowIntensity: 0.6, skipFrames: 1 },
    extreme: { particles: 100, connectionDist: 80, glowIntensity: 0.8, skipFrames: 0 },
  }), []);

  const config = intensityConfig[intensity];
  const actualParticleCount = Math.min(particleCount, config.particles);

  // Initialize particles - simplified
  const initParticles = useCallback((width: number, height: number) => {
    const particles: Particle[] = [];
    for (let i = 0; i < actualParticleCount; i++) {
      const layer = i % 3;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        baseX: Math.random() * width,
        baseY: Math.random() * height,
        size: (Math.random() * 1.5 + 0.8) * (1 + layer * 0.2),
        speed: (Math.random() * 0.3 + 0.15),
        angle: Math.random() * Math.PI * 2,
        entropy: 0.3 + Math.random() * 0.3,
        opacity: (Math.random() * 0.3 + 0.15) * (0.5 + layer * 0.2),
        pulsePhase: Math.random() * Math.PI * 2,
        layer,
      });
    }
    particlesRef.current = particles;
  }, [actualParticleCount]);

  // Optimized animation loop with frame skipping
  const animate = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Frame rate limiting - target ~30fps for smooth but efficient animation
    const elapsed = timestamp - lastFrameTimeRef.current;
    if (elapsed < 33) { // ~30fps
      animationRef.current = requestAnimationFrame(animate);
      return;
    }
    lastFrameTimeRef.current = timestamp;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const { width, height } = canvas;
    timeRef.current += 0.02;
    const time = timeRef.current;

    // Clear with fade effect
    ctx.fillStyle = "rgba(10, 12, 15, 0.2)";
    ctx.fillRect(0, 0, width, height);

    const mouse = mouseRef.current;
    const influenceRadius = 180;
    const glowIntensity = config.glowIntensity;
    const particles = particlesRef.current;

    // Draw consciousness field only when mouse active
    if (mouse.x > 0 && mouse.y > 0) {
      const coreGlow = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 25);
      coreGlow.addColorStop(0, `rgba(255, 230, 150, ${0.3 * glowIntensity})`);
      coreGlow.addColorStop(1, "rgba(212, 175, 55, 0)");
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 25, 0, Math.PI * 2);
      ctx.fillStyle = coreGlow;
      ctx.fill();
    }

    // Update and draw particles - simplified loop
    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i];
      
      // Calculate distance from mouse
      const dx = mouse.x - particle.x;
      const dy = mouse.y - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Update position
      if (distance < influenceRadius && mouse.x > 0) {
        const force = (1 - distance / influenceRadius) * 0.15;
        particle.x += dx * force * 0.1;
        particle.y += dy * force * 0.1;
        particle.entropy = Math.max(0, particle.entropy - 0.03);
      } else {
        particle.angle += (Math.random() - 0.5) * 0.06;
        particle.x += Math.cos(particle.angle) * particle.speed * particle.entropy;
        particle.y += Math.sin(particle.angle) * particle.speed * particle.entropy;
        particle.entropy = Math.min(1, particle.entropy + 0.003);
      }

      // Wrap boundaries
      if (particle.x < -20) particle.x = width + 20;
      if (particle.x > width + 20) particle.x = -20;
      if (particle.y < -20) particle.y = height + 20;
      if (particle.y > height + 20) particle.y = -20;

      // Calculate opacity with pulse
      const pulse = Math.sin(time * 1.5 + particle.pulsePhase) * 0.2 + 0.8;
      const currentOpacity = particle.opacity * pulse;
      const currentSize = particle.size * (0.9 + pulse * 0.2);

      // Draw particle - simplified
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, currentSize, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(212, 175, 55, ${currentOpacity})`;
      ctx.fill();

      // Draw connections only for nearby particles (limit connections)
      if (particle.entropy < 0.5 && i < particles.length - 1) {
        let connectionCount = 0;
        for (let j = i + 1; j < particles.length && connectionCount < 2; j++) {
          const other = particles[j];
          if (other.layer !== particle.layer) continue;
          
          const odx = other.x - particle.x;
          const ody = other.y - particle.y;
          const odist = Math.sqrt(odx * odx + ody * ody);
          
          if (odist < config.connectionDist && other.entropy < 0.5) {
            const lineOpacity = 0.12 * (1 - particle.entropy) * (1 - odist / config.connectionDist);
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(212, 175, 55, ${lineOpacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
            connectionCount++;
          }
        }
      }
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [config]);

  // Handle resize with debounce
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const parent = canvas.parentElement;
        if (!parent) return;
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        initParticles(canvas.width, canvas.height);
      }, 100);
    };

    handleResize();
    window.addEventListener("resize", handleResize, { passive: true });
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [initParticles]);

  // Throttled mouse movement
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let lastMoveTime = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastMoveTime < 32) return; // Throttle to ~30fps
      lastMoveTime = now;
      
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    canvas.addEventListener("mousemove", handleMouseMove, { passive: true });
    canvas.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  // Visibility observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.05 }
    );

    if (canvasRef.current) {
      observer.observe(canvasRef.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isVisible) {
      lastFrameTimeRef.current = performance.now();
      animationRef.current = requestAnimationFrame(animate);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isVisible, animate]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-auto ${className}`}
      style={{ opacity: 0.7 }}
    />
  );
};

export default EntropyParticles;
