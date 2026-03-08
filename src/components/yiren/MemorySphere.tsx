import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import memoryYoungMother from "@/assets/memory-young-mother.jpg";

// The secret key - Mother's birth date
const TIME_KEY = "19710824";
const STORAGE_KEY = "node009_memory_unlocked";

interface MemorySphereProps {
  stationNumber?: string;
  stationTitle?: string;
  imageSrc?: string;
  imageAlt?: string;
}

// 30Hz ambient sound generator for "Heavy Memory" feeling
const useAmbientTone = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const playTone = useCallback(() => {
    try {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const ctx = audioContextRef.current;

      oscillatorRef.current = ctx.createOscillator();
      oscillatorRef.current.type = "sine";
      oscillatorRef.current.frequency.setValueAtTime(30, ctx.currentTime);

      gainNodeRef.current = ctx.createGain();
      gainNodeRef.current.gain.setValueAtTime(0, ctx.currentTime);
      gainNodeRef.current.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 2);
      gainNodeRef.current.gain.setValueAtTime(0.15, ctx.currentTime + 5);
      gainNodeRef.current.gain.linearRampToValueAtTime(0, ctx.currentTime + 8);

      oscillatorRef.current.connect(gainNodeRef.current);
      gainNodeRef.current.connect(ctx.destination);

      oscillatorRef.current.start(ctx.currentTime);
      oscillatorRef.current.stop(ctx.currentTime + 8);

      setTimeout(() => {
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
      }, 9000);
    } catch {
      // Audio not supported or blocked
    }
  }, []);

  useEffect(() => {
    return () => {
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
        } catch {
          // Already stopped
        }
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return { playTone };
};

const MemorySphere = ({ 
  stationNumber = "01",
  stationTitle = "THE ORIGIN",
  imageSrc = memoryYoungMother,
  imageAlt = "The Young Mother"
}: MemorySphereProps) => {
  // Check localStorage for persisted unlock state
  const [isUnlocked, setIsUnlocked] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });
  
  const [isRevealed, setIsRevealed] = useState(false);
  const [showYearInput, setShowYearInput] = useState(false);
  const [yearInput, setYearInput] = useState("");
  const [inputError, setInputError] = useState(false);
  const [unlockAnimation, setUnlockAnimation] = useState(false);
  const [showOracleText, setShowOracleText] = useState(isUnlocked);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { playTone } = useAmbientTone();

  // Mouse position for parallax effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 50, damping: 20, mass: 1 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  const rotateX = useTransform(springY, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-8, 8]);
  const translateX = useTransform(springX, [-0.5, 0.5], [-15, 15]);
  const translateY = useTransform(springY, [-0.5, 0.5], [-15, 15]);

  // 5-second reveal animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsRevealed(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Show oracle text after reveal if already unlocked
  useEffect(() => {
    if (isRevealed && isUnlocked) {
      const timer = setTimeout(() => {
        setShowOracleText(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isRevealed, isUnlocked]);

  // Focus input when shown
  useEffect(() => {
    if (showYearInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showYearInput]);

  // Handle year input submission
  const handleYearSubmit = () => {
    if (yearInput === TIME_KEY) {
      setInputError(false);
      setShowYearInput(false);
      setUnlockAnimation(true);
      
      // Play 30Hz ambient tone
      playTone();
      
      // Persist to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, "true");
      } catch {
        // localStorage not available
      }
      
      // Trigger unlock after short delay
      setTimeout(() => {
        setIsUnlocked(true);
      }, 500);

      // Show oracle text after unlock animation
      setTimeout(() => {
        setShowOracleText(true);
      }, 4500);
    } else {
      setInputError(true);
      setYearInput("");
      setTimeout(() => setInputError(false), 600);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const normalizedX = (e.clientX - centerX) / rect.width;
    const normalizedY = (e.clientY - centerY) / rect.height;
    
    mouseX.set(normalizedX);
    mouseY.set(normalizedY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <section 
      ref={containerRef}
      className="min-h-screen relative overflow-hidden bg-[#000000] flex items-center justify-center py-24"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Ambient void particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(40)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-px h-px bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.1, 0.4, 0.1],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Central Memory Sphere */}
      <div className="relative z-10 flex flex-col items-center">
        {/* The floating image with parallax */}
        <motion.div
          className="relative"
          style={{
            rotateX,
            rotateY,
            x: translateX,
            y: translateY,
            perspective: 1000,
            transformStyle: "preserve-3d",
          }}
        >
          {/* HDR Glow layers - Enhanced when unlocked */}
          <motion.div
            className="absolute -inset-8 md:-inset-16"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: isRevealed ? 1 : 0,
              scale: isUnlocked ? 1.3 : 1
            }}
            transition={{ 
              duration: isUnlocked ? 4 : 5, 
              ease: [0.16, 1, 0.3, 1]
            }}
          >
            {/* Outer glow - transforms to golden aura when unlocked */}
            <motion.div 
              className="absolute inset-0 rounded-full blur-3xl"
              animate={{
                background: isUnlocked 
                  ? "radial-gradient(circle, rgba(212,175,55,0.5) 0%, rgba(212,175,55,0.15) 40%, transparent 70%)"
                  : "radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 60%)"
              }}
              transition={{ duration: 4, ease: [0.16, 1, 0.3, 1] }}
            />
            {/* Inner glow */}
            <motion.div 
              className="absolute inset-8 rounded-full blur-2xl"
              animate={{
                background: isUnlocked
                  ? "radial-gradient(circle, rgba(255,255,255,0.25) 0%, rgba(212,175,55,0.15) 40%, transparent 60%)"
                  : "radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 50%)"
              }}
              transition={{ duration: 4, ease: [0.16, 1, 0.3, 1] }}
            />
          </motion.div>

          {/* Image container with Time-Lock filter */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ 
              opacity: isRevealed ? (isUnlocked ? 1 : 0.7) : 0, 
              scale: isRevealed ? (isUnlocked ? 1.15 : 1) : 0.9 
            }}
            transition={{ 
              duration: isUnlocked ? 4 : 5, 
              ease: [0.16, 1, 0.3, 1]
            }}
          >
            {/* Floating animation container */}
            <motion.div
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {/* Frame with dynamic border */}
              <motion.div 
                className="relative"
                animate={{
                  boxShadow: isUnlocked 
                    ? "0 0 80px 30px rgba(212,175,55,0.4), 0 0 150px 60px rgba(212,175,55,0.2)"
                    : "0 0 30px 10px rgba(0,0,0,0.5)"
                }}
                transition={{ duration: 4, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Scanline overlay for vintage feel */}
                <div 
                  className="absolute inset-0 z-20 pointer-events-none opacity-[0.02]"
                  style={{
                    backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)"
                  }}
                />
                
                {/* The image with Time-Lock CSS filters */}
                <motion.div 
                  className="relative overflow-hidden"
                  animate={{
                    borderColor: isUnlocked ? "rgba(212,175,55,0.7)" : "rgba(255,255,255,0.1)"
                  }}
                  transition={{ duration: 4, ease: [0.16, 1, 0.3, 1] }}
                  style={{ borderWidth: 2 }}
                >
                  <motion.img 
                    src={imageSrc}
                    alt={imageAlt}
                    className="w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 object-cover"
                    animate={{
                      filter: isUnlocked 
                        ? "grayscale(0%) brightness(1.1) contrast(1.05) blur(0px)"
                        : "grayscale(100%) brightness(0.5) contrast(1.1) blur(2px)"
                    }}
                    transition={{ 
                      duration: 4, 
                      ease: [0.33, 1, 0.68, 1]
                    }}
                  />
                  
                  {/* HDR luminance overlay */}
                  <motion.div 
                    className="absolute inset-0 pointer-events-none"
                    animate={{
                      background: isUnlocked
                        ? "radial-gradient(circle at 40% 30%, rgba(255,255,255,0.08) 0%, transparent 50%)"
                        : "radial-gradient(circle at 40% 30%, rgba(255,255,255,0.05) 0%, transparent 40%)",
                      opacity: isUnlocked ? 0.8 : 1
                    }}
                    transition={{ duration: 4, ease: [0.16, 1, 0.3, 1] }}
                    style={{ mixBlendMode: "overlay" }}
                  />
                  
                  {/* Vignette effect */}
                  <motion.div 
                    className="absolute inset-0 pointer-events-none"
                    animate={{
                      boxShadow: isUnlocked
                        ? "inset 0 0 50px 15px rgba(0,0,0,0.2)"
                        : "inset 0 0 80px 40px rgba(0,0,0,0.7)"
                    }}
                    transition={{ duration: 4, ease: [0.16, 1, 0.3, 1] }}
                  />
                </motion.div>
                
                {/* Corner accents - animate to gold when unlocked */}
                <motion.div 
                  className="absolute -top-1 -left-1 w-5 h-5 border-t-2 border-l-2"
                  animate={{ borderColor: isUnlocked ? "rgba(212,175,55,0.9)" : "rgba(212,175,55,0.3)" }}
                  transition={{ duration: 2 }}
                />
                <motion.div 
                  className="absolute -top-1 -right-1 w-5 h-5 border-t-2 border-r-2"
                  animate={{ borderColor: isUnlocked ? "rgba(212,175,55,0.9)" : "rgba(212,175,55,0.3)" }}
                  transition={{ duration: 2 }}
                />
                <motion.div 
                  className="absolute -bottom-1 -left-1 w-5 h-5 border-b-2 border-l-2"
                  animate={{ borderColor: isUnlocked ? "rgba(212,175,55,0.9)" : "rgba(212,175,55,0.3)" }}
                  transition={{ duration: 2 }}
                />
                <motion.div 
                  className="absolute -bottom-1 -right-1 w-5 h-5 border-b-2 border-r-2"
                  animate={{ borderColor: isUnlocked ? "rgba(212,175,55,0.9)" : "rgba(212,175,55,0.3)" }}
                  transition={{ duration: 2 }}
                />

                {/* Year Icon - Time-Lock Trigger */}
                {!isUnlocked && isRevealed && (
                  <motion.button
                    className="absolute bottom-4 right-4 z-30 w-10 h-10 rounded-full bg-black/70 border border-[#d4af37]/40 
                               flex items-center justify-center cursor-pointer hover:bg-black/90 hover:border-[#d4af37]/80
                               transition-all duration-300 group"
                    onClick={() => setShowYearInput(true)}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 5.5, duration: 0.5 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Unlock memory"
                  >
                    <span className="text-[#d4af37]/70 group-hover:text-[#d4af37] text-xs font-mono">
                      年
                    </span>
                  </motion.button>
                )}

                {/* Unlocked indicator */}
                {isUnlocked && (
                  <motion.div
                    className="absolute bottom-4 right-4 z-30"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 2, type: "spring" }}
                  >
                    <div className="w-3 h-3 rounded-full bg-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.9)]" />
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Floating light particles around sphere */}
          {isRevealed && [...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                left: "50%",
                top: "50%",
                backgroundColor: isUnlocked ? "rgba(212,175,55,0.7)" : "rgba(212,175,55,0.3)"
              }}
              animate={{
                x: Math.cos((i * 45) * Math.PI / 180) * (isUnlocked ? 150 : 120),
                y: Math.sin((i * 45) * Math.PI / 180) * (isUnlocked ? 150 : 120),
                opacity: [0.2, 0.7, 0.2],
                scale: [0.8, 1.3, 0.8],
              }}
              transition={{
                duration: 4 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.3,
              }}
            />
          ))}
        </motion.div>

        {/* Station caption */}
        <motion.div
          className="mt-12 md:mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: isRevealed ? 1 : 0, 
            y: isRevealed ? 0 : 20 
          }}
          transition={{ 
            duration: 2, 
            delay: 4,
            ease: "easeOut" 
          }}
        >
          <motion.p 
            className="tracking-[0.4em] text-xs md:text-sm font-light uppercase"
            style={{ 
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, monospace",
            }}
            animate={{
              color: isUnlocked ? "rgba(212,175,55,0.9)" : "rgba(255,255,255,0.3)"
            }}
            transition={{ duration: 2 }}
          >
            STATION {stationNumber}: {stationTitle}
          </motion.p>
          
          {/* Subtle underline */}
          <motion.div
            className="h-px mt-4 mx-auto"
            initial={{ width: 0 }}
            animate={{ 
              width: isRevealed ? "100%" : 0,
            }}
            style={{
              background: isUnlocked 
                ? "linear-gradient(to right, transparent, rgba(212,175,55,0.7), transparent)"
                : "linear-gradient(to right, transparent, rgba(212,175,55,0.3), transparent)",
              maxWidth: "200px"
            }}
            transition={{ duration: 2, delay: 5 }}
          />

          {/* Oracle Text - Confucius Quote */}
          <AnimatePresence>
            {showOracleText && isUnlocked && (
              <motion.div
                className="mt-10 max-w-md mx-auto px-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ 
                  duration: 3, 
                  ease: [0.16, 1, 0.3, 1]
                }}
              >
                <p 
                  className="text-lg md:text-xl font-light leading-relaxed"
                  style={{ 
                    color: "rgba(212,175,55,0.85)",
                    fontFamily: "serif"
                  }}
                >
                  「父母之年，不可不知也。
                  <br />
                  一則以喜，一則以懼。」
                </p>
                <motion.p 
                  className="text-white/30 text-xs mt-4 tracking-wider"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5, duration: 2 }}
                >
                  —— 孔子 · Confucius
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Unlock status */}
          <AnimatePresence>
            {isUnlocked && !showOracleText && (
              <motion.p
                className="text-[#d4af37]/60 text-xs mt-6 font-mono tracking-wider"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 2, duration: 1 }}
              >
                // MEMORY UNLOCKED //
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Year Input Modal */}
      <AnimatePresence>
        {showYearInput && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowYearInput(false)}
          >
            {/* Backdrop */}
            <motion.div 
              className="absolute inset-0 bg-black/95 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Input container */}
            <motion.div
              className="relative z-10 text-center"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Prompt text */}
              <motion.p
                className="text-white/40 text-sm font-light mb-6 tracking-wider"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                輸入她的時間印記
              </motion.p>
              <motion.p
                className="text-white/20 text-xs font-light mb-8 tracking-wider"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Enter her temporal signature (YYYYMMDD)
              </motion.p>

              {/* Year input field */}
              <motion.div
                className={`relative ${inputError ? "animate-[shake_0.5s_ease-in-out]" : ""}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={8}
                  value={yearInput}
                  onChange={(e) => setYearInput(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && yearInput.length === 8) {
                      handleYearSubmit();
                    }
                  }}
                  className={`w-56 bg-transparent border-b-2 text-center text-2xl font-mono tracking-[0.3em] 
                             text-[#d4af37] focus:outline-none transition-all duration-300
                             ${inputError ? "border-red-500/60" : "border-[#d4af37]/40 focus:border-[#d4af37]/80"}`}
                  placeholder="________"
                />
              </motion.div>

              {/* Submit hint */}
              <motion.p
                className="text-white/20 text-xs mt-6 font-mono"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                [ press enter ]
              </motion.p>

              {/* Error message */}
              <AnimatePresence>
                {inputError && (
                  <motion.p
                    className="text-red-400/60 text-xs mt-4"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    時間軸未對齊 · Timeline misaligned
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unlock flash effect */}
      <AnimatePresence>
        {unlockAnimation && (
          <motion.div
            className="fixed inset-0 z-[90] pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.4, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.5, ease: "easeOut" }}
            style={{
              background: "radial-gradient(circle at center, rgba(212,175,55,0.6) 0%, transparent 60%)"
            }}
            onAnimationComplete={() => setUnlockAnimation(false)}
          />
        )}
      </AnimatePresence>

      {/* Subtle radial gradient backdrop */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isUnlocked 
            ? "radial-gradient(ellipse at center, rgba(212,175,55,0.03) 0%, transparent 50%)"
            : "radial-gradient(ellipse at center, rgba(212,175,55,0.01) 0%, transparent 50%)"
        }}
      />

      {/* Custom shake animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
      `}</style>
    </section>
  );
};

export default MemorySphere;
