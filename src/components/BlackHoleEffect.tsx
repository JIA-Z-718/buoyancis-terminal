import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BlackHoleEffectProps {
  isActive: boolean;
  onComplete: () => void;
}

const BlackHoleEffect = ({ isActive, onComplete }: BlackHoleEffectProps) => {
  const [phase, setPhase] = useState<'idle' | 'collapse' | 'expand' | 'reveal'>('idle');

  useEffect(() => {
    if (isActive) {
      setPhase('collapse');
      
      // Phase 1: Collapse (1.5s)
      const expandTimer = setTimeout(() => setPhase('expand'), 1500);
      
      // Phase 2: Expand back (1s)
      const revealTimer = setTimeout(() => setPhase('reveal'), 2500);
      
      // Phase 3: Show message then complete (3s)
      const completeTimer = setTimeout(() => {
        setPhase('idle');
        onComplete();
      }, 5500);

      return () => {
        clearTimeout(expandTimer);
        clearTimeout(revealTimer);
        clearTimeout(completeTimer);
      };
    }
  }, [isActive, onComplete]);

  if (!isActive && phase === 'idle') return null;

  return (
    <AnimatePresence>
      {(isActive || phase !== 'idle') && (
        <motion.div
          className="fixed inset-0 z-[9999] pointer-events-auto flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Black hole center */}
          <motion.div
            className="absolute rounded-full bg-black"
            initial={{ width: 0, height: 0 }}
            animate={
              phase === 'collapse'
                ? { width: '300vmax', height: '300vmax' }
                : phase === 'expand'
                ? { width: 100, height: 100 }
                : phase === 'reveal'
                ? { width: 100, height: 100, opacity: 0.8 }
                : { width: 0, height: 0 }
            }
            transition={{
              duration: phase === 'collapse' ? 1.5 : phase === 'expand' ? 1 : 0.5,
              ease: phase === 'collapse' ? 'easeIn' : 'easeOut',
            }}
            style={{
              boxShadow: phase === 'reveal' 
                ? '0 0 60px 20px rgba(212,175,55,0.3), 0 0 100px 40px rgba(212,175,55,0.1)'
                : phase === 'expand'
                ? '0 0 100px 50px rgba(212,175,55,0.5), 0 0 200px 100px rgba(212,175,55,0.2)'
                : 'none',
            }}
          />

          {/* Gravitational ring effect during collapse */}
          {phase === 'collapse' && (
            <>
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full border border-[#D4AF37]/30"
                  initial={{ width: '100vmax', height: '100vmax', opacity: 0.5 }}
                  animate={{ 
                    width: 0, 
                    height: 0, 
                    opacity: 0,
                    rotate: 360
                  }}
                  transition={{
                    duration: 1.5,
                    delay: i * 0.2,
                    ease: 'easeIn',
                  }}
                />
              ))}
            </>
          )}

          {/* Particles being sucked in */}
          {phase === 'collapse' && (
            <>
              {[...Array(30)].map((_, i) => {
                const angle = (i / 30) * Math.PI * 2;
                const distance = 800 + Math.random() * 400;
                return (
                  <motion.div
                    key={`particle-${i}`}
                    className="absolute w-2 h-2 rounded-full bg-[#D4AF37]"
                    initial={{
                      x: Math.cos(angle) * distance,
                      y: Math.sin(angle) * distance,
                      opacity: 1,
                      scale: 1,
                    }}
                    animate={{
                      x: 0,
                      y: 0,
                      opacity: 0,
                      scale: 0,
                    }}
                    transition={{
                      duration: 1.2 + Math.random() * 0.5,
                      delay: Math.random() * 0.3,
                      ease: 'easeIn',
                    }}
                  />
                );
              })}
            </>
          )}

          {/* Expansion burst particles */}
          {phase === 'expand' && (
            <>
              {[...Array(40)].map((_, i) => {
                const angle = (i / 40) * Math.PI * 2;
                const distance = 300 + Math.random() * 500;
                return (
                  <motion.div
                    key={`burst-${i}`}
                    className="absolute w-1 h-1 rounded-full bg-[#D4AF37]"
                    initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                    animate={{
                      x: Math.cos(angle) * distance,
                      y: Math.sin(angle) * distance,
                      opacity: 0,
                      scale: 2,
                    }}
                    transition={{
                      duration: 1,
                      delay: Math.random() * 0.2,
                      ease: 'easeOut',
                    }}
                  />
                );
              })}
            </>
          )}

          {/* Secret message reveal */}
          {phase === 'reveal' && (
            <motion.div
              className="absolute text-center z-10"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <motion.div
                className="text-[#D4AF37] text-4xl md:text-6xl font-serif tracking-widest mb-4"
                initial={{ letterSpacing: '0.5em', opacity: 0 }}
                animate={{ letterSpacing: '0.2em', opacity: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
              >
                GENESIS
              </motion.div>
              
              <motion.p
                className="text-white/60 text-sm md:text-base max-w-md mx-auto font-light"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1 }}
              >
                You have witnessed the collapse of uncertainty.
                <br />
                <span className="text-[#D4AF37]/80">The Protocol awaits.</span>
              </motion.p>

              <motion.div
                className="mt-6 text-white/30 text-xs tracking-[0.3em] uppercase"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
              >
                Node #∞ Activated
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BlackHoleEffect;
