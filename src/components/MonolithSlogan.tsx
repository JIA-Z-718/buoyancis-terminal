import { useState, useEffect } from "react";
import { useParallax } from "@/hooks/useParallax";
import monolithBg from "@/assets/monolith-clean.jpg";

interface MonolithSloganProps {
  className?: string;
}

const MonolithSlogan = ({ className = "" }: MonolithSloganProps) => {
  // Multi-layer parallax speeds for depth differentiation
  const bgParallax = useParallax(0.4);      // Background moves slowest
  const textParallax = useParallax(0.15);   // Text moves faster (appears closer)
  const indicatorParallax = useParallax(0.05); // Indicator barely moves (closest layer)
  
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animations after component mounts
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`relative w-full min-h-[70vh] md:min-h-[85vh] overflow-hidden ${className}`}>
      {/* Background Image with Parallax and fade-in - slowest layer */}
      <div 
        className={`absolute inset-0 w-full h-[130%] -top-[15%] transition-all duration-[2000ms] ease-out ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
        }`}
        style={{ 
          transform: `translateY(${bgParallax}px) scale(${isVisible ? 1 : 1.05})`,
          willChange: 'transform, opacity'
        }}
      >
        <img
          src={monolithBg}
          alt="Black obsidian monolith"
          className="w-full h-full object-cover blur-[2px] md:blur-[2.5px]"
          loading="eager"
          decoding="async"
          style={{ filter: 'blur(2px) saturate(0.85) brightness(0.55)' }}
        />
      </div>
      
      {/* Vignette overlay for focus - enhanced cinematic edges */}
      <div 
        className={`absolute inset-0 pointer-events-none transition-opacity duration-[2000ms] ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.5) 45%, rgba(0,0,0,0.75) 65%, rgba(0,0,0,0.92) 100%)'
        }}
      />
      
      {/* Gradient overlay for depth */}
      <div className={`absolute inset-0 bg-gradient-to-b from-background/30 via-background/10 to-background/50 transition-opacity duration-[1500ms] ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`} />
      
      {/* Text Overlay - Mid-speed layer for depth */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="text-center px-6 py-8 max-w-lg rounded-2xl"
          style={{ 
            transform: `translateY(${textParallax}px)`,
            willChange: 'transform'
          }}
        >
          {/* Brand Name - English (Primary) */}
          <p 
            className={`text-2xl md:text-3xl lg:text-4xl tracking-[0.35em] uppercase mb-4 font-light transition-all duration-[1000ms] ease-out bg-clip-text text-transparent ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ 
              backgroundImage: 'linear-gradient(90deg, #d4af37 0%, #f5d998 50%, #d4af37 100%)',
              filter: 'drop-shadow(0 0 30px rgba(212, 175, 55, 0.5))',
              transitionDelay: '300ms'
            }}
          >
            Buoyancis
          </p>

          {/* English Tagline */}
          <p 
            className={`text-sm md:text-base lg:text-lg tracking-[0.2em] uppercase mb-10 font-light transition-all duration-[1200ms] ease-out bg-clip-text text-transparent ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ 
              backgroundImage: 'linear-gradient(90deg, rgba(200, 130, 110, 0.7) 0%, rgba(245, 217, 152, 0.9) 50%, rgba(200, 130, 110, 0.7) 100%)',
              filter: 'drop-shadow(0 0 15px rgba(212, 175, 55, 0.3))',
              transitionDelay: '550ms'
            }}
          >
            Trust Has Mass. We Measure It.
          </p>
          
          {/* Main Slogan - First line (Chinese) */}
          <p 
            className={`text-base md:text-lg lg:text-xl font-serif tracking-wider leading-relaxed mb-4 transition-all duration-[1200ms] ease-out bg-clip-text text-transparent ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
            style={{ 
              backgroundImage: 'linear-gradient(135deg, #e8a090 0%, #c8826e 40%, #d4af37 100%)',
              filter: 'drop-shadow(0 0 15px rgba(200, 130, 110, 0.3))',
              transitionDelay: '800ms'
            }}
          >
            秩序是昂貴的驚喜
          </p>
          
          {/* Main Slogan - Second line (Chinese) */}
          <p 
            className={`text-base md:text-lg lg:text-xl font-serif tracking-wider leading-relaxed mb-6 transition-all duration-[1200ms] ease-out bg-clip-text text-transparent ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
            style={{ 
              backgroundImage: 'linear-gradient(135deg, #d4af37 0%, #c8826e 60%, #e8a090 100%)',
              filter: 'drop-shadow(0 0 15px rgba(212, 175, 55, 0.2))',
              transitionDelay: '1000ms'
            }}
          >
            熵增是免費的宿命
          </p>
          
          {/* Brand Name - Chinese (Secondary) */}
          <p 
            className={`text-xs md:text-sm tracking-wider transition-all duration-[1000ms] ease-out bg-clip-text text-transparent ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ 
              backgroundImage: 'linear-gradient(90deg, rgba(200, 130, 110, 0.4) 0%, rgba(212, 175, 55, 0.6) 50%, rgba(200, 130, 110, 0.4) 100%)',
              transitionDelay: '1200ms'
            }}
          >
            布扬玺斯
          </p>
        </div>
      </div>
      
      {/* Scroll indicator - fastest layer (closest to viewer) */}
      <div 
        className={`absolute bottom-8 left-1/2 -translate-x-1/2 transition-all duration-[1000ms] ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
        style={{ 
          transitionDelay: '1800ms',
          transform: `translateX(-50%) translateY(${indicatorParallax}px)`
        }}
      >
        <div className="w-6 h-10 border-2 border-[rgba(200,130,110,0.4)] rounded-full flex justify-center">
          <div className="w-1 h-2 bg-[rgba(200,130,110,0.6)] rounded-full mt-2 animate-[pulse_2s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
};

export default MonolithSlogan;
