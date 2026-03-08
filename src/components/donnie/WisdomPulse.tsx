import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";

interface WisdomPulseProps {
  isActive: boolean;
  sourceX: number;
  sourceY: number;
}

const WisdomPulse = ({ isActive, sourceX, sourceY }: WisdomPulseProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;
    
    // Play a subtle audio cue if desired
  }, [isActive]);

  return (
    <AnimatePresence>
      {isActive && (
        <div
          ref={containerRef}
          className="fixed inset-0 pointer-events-none z-40 overflow-hidden"
        >
          {/* Primary ripple */}
          <motion.div
            initial={{ 
              scale: 0,
              opacity: 0.8,
              x: sourceX - 100,
              y: sourceY - 100,
            }}
            animate={{ 
              scale: 15,
              opacity: 0,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute w-[200px] h-[200px] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(212, 175, 55, 0.3) 0%, transparent 70%)",
            }}
          />

          {/* Secondary ripple */}
          <motion.div
            initial={{ 
              scale: 0,
              opacity: 0.6,
              x: sourceX - 75,
              y: sourceY - 75,
            }}
            animate={{ 
              scale: 20,
              opacity: 0,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: "easeOut", delay: 0.2 }}
            className="absolute w-[150px] h-[150px] rounded-full border border-[#D4AF37]/30"
          />

          {/* Golden connection line to top (Genesis Home) */}
          <motion.div
            initial={{ 
              scaleY: 0,
              opacity: 0,
            }}
            animate={{ 
              scaleY: 1,
              opacity: [0, 0.6, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute left-1/2 top-0 w-px origin-top"
            style={{
              height: sourceY,
              background: "linear-gradient(to bottom, rgba(212, 175, 55, 0.8), transparent)",
            }}
          />

          {/* Horizontal pulse wave */}
          <motion.div
            initial={{ 
              scaleX: 0,
              opacity: 0,
              y: sourceY,
            }}
            animate={{ 
              scaleX: 1,
              opacity: [0, 0.4, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute left-0 w-full h-px origin-center"
            style={{
              background: "linear-gradient(to right, transparent, rgba(212, 175, 55, 0.6), transparent)",
            }}
          />
        </div>
      )}
    </AnimatePresence>
  );
};

export default WisdomPulse;
