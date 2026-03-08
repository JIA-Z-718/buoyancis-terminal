import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "@/components/PageTransition";

interface FadingText {
  id: string;
  text: string;
  createdAt: number;
  x: number;
  y: number;
}

const LAOZI_QUOTE = {
  name: "Laozi",
  quote: "Nature does not hurry, yet everything is accomplished.",
  subtext: "Wu Wei — The art of doing nothing is doing everything.",
};

const EINSTEIN_QUOTE = {
  name: "Einstein",
  quote: "Out of clutter, find simplicity. From discord, find harmony.",
  subtext: "The balance between chaos and order reveals truth.",
};

export default function OscarNode() {
  const [inputValue, setInputValue] = useState("");
  const [fadingTexts, setFadingTexts] = useState<FadingText[]>([]);
  const [isEmergencyReset, setIsEmergencyReset] = useState(false);
  const [breathPhase, setBreathPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [breathCount, setBreathCount] = useState(0);
  const [showGuide, setShowGuide] = useState<"laozi" | "einstein" | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const breathingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Pulsing background effect
  const [pulsePhase, setPulsePhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulsePhase((prev) => (prev + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Clean up fading texts after 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setFadingTexts((prev) => prev.filter((t) => now - t.createdAt < 5000));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Handle text input and create fading effect
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const addedChar = newValue.slice(inputValue.length);
    
    if (addedChar && textareaRef.current) {
      const rect = textareaRef.current.getBoundingClientRect();
      const charWidth = 14;
      const lineHeight = 28;
      const lines = newValue.split("\n");
      const currentLine = lines.length - 1;
      const currentCol = lines[currentLine]?.length || 0;
      
      setFadingTexts((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          text: addedChar,
          createdAt: Date.now(),
          x: rect.left + (currentCol * charWidth) % (rect.width - 40) + 20,
          y: rect.top + (currentLine * lineHeight) % (rect.height - 40) + 20,
        },
      ]);
    }
    
    setInputValue(newValue);
    
    // Clear input after a pause to let text "exhale"
    if (newValue.length > 0) {
      setTimeout(() => {
        setInputValue("");
      }, 3000);
    }
  }, [inputValue]);

  // Emergency Reset breathing animation
  const startBreathingExercise = useCallback(() => {
    setIsEmergencyReset(true);
    setBreathCount(0);
    setBreathPhase("inhale");

    const runBreathCycle = (count: number) => {
      if (count >= 6) {
        // 6 cycles = ~60 seconds
        setIsEmergencyReset(false);
        return;
      }

      // Inhale (4s)
      setBreathPhase("inhale");
      breathingTimerRef.current = setTimeout(() => {
        // Hold (4s)
        setBreathPhase("hold");
        breathingTimerRef.current = setTimeout(() => {
          // Exhale (6s)
          setBreathPhase("exhale");
          breathingTimerRef.current = setTimeout(() => {
            setBreathCount(count + 1);
            runBreathCycle(count + 1);
          }, 6000);
        }, 4000);
      }, 4000);
    };

    runBreathCycle(0);
  }, []);

  const exitEmergencyReset = useCallback(() => {
    if (breathingTimerRef.current) {
      clearTimeout(breathingTimerRef.current);
    }
    setIsEmergencyReset(false);
  }, []);

  // Dynamic background gradient
  const gradientIntensity = Math.sin((pulsePhase * Math.PI) / 180) * 0.1 + 0.9;
  const backgroundStyle = {
    background: `radial-gradient(ellipse at 50% 50%, 
      rgba(143, 188, 143, ${0.15 * gradientIntensity}) 0%, 
      rgba(0, 128, 128, ${0.12 * gradientIntensity}) 40%, 
      rgba(15, 25, 25, 1) 100%)`,
  };

  return (
    <PageTransition>
      <div
        className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden font-mono"
        style={backgroundStyle}
      >
        {/* Breathing ambient particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-teal-400/10"
              style={{
                width: Math.random() * 100 + 50,
                height: Math.random() * 100 + 50,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.2, 0.1],
              }}
              transition={{
                duration: 4 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="absolute top-8 left-0 right-0 text-center"
        >
          <div className="text-teal-300/60 text-xs tracking-[0.4em] mb-2">
            NODE_011 // OSCAR
          </div>
          <div className="text-sage-100 text-lg tracking-[0.2em] font-light"
            style={{ color: "rgba(200, 220, 200, 0.8)" }}
          >
            THE MENTAL SANCTUARY
          </div>
        </motion.div>

        {/* Meditative Guides */}
        <div className="absolute top-32 left-8 right-8 flex justify-between gap-4">
          {/* Laozi Guide */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            onClick={() => setShowGuide(showGuide === "laozi" ? null : "laozi")}
            className="group"
          >
            <div
              className="px-6 py-4 rounded-3xl backdrop-blur-xl transition-all duration-500"
              style={{
                background: "rgba(143, 188, 143, 0.1)",
                border: "1px solid rgba(143, 188, 143, 0.2)",
                boxShadow: showGuide === "laozi" ? "0 0 30px rgba(143, 188, 143, 0.2)" : "none",
              }}
            >
              <div className="text-teal-200/70 text-xs tracking-widest">GUIDE I</div>
              <div className="text-white/80 text-sm mt-1">{LAOZI_QUOTE.name}</div>
            </div>
          </motion.button>

          {/* Einstein Guide */}
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            onClick={() => setShowGuide(showGuide === "einstein" ? null : "einstein")}
            className="group"
          >
            <div
              className="px-6 py-4 rounded-3xl backdrop-blur-xl transition-all duration-500"
              style={{
                background: "rgba(0, 128, 128, 0.1)",
                border: "1px solid rgba(0, 128, 128, 0.2)",
                boxShadow: showGuide === "einstein" ? "0 0 30px rgba(0, 128, 128, 0.2)" : "none",
              }}
            >
              <div className="text-teal-200/70 text-xs tracking-widest">GUIDE II</div>
              <div className="text-white/80 text-sm mt-1">{EINSTEIN_QUOTE.name}</div>
            </div>
          </motion.button>
        </div>

        {/* Quote Display */}
        <AnimatePresence>
          {showGuide && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="absolute top-56 left-8 right-8 mx-auto max-w-2xl"
            >
              <div
                className="p-8 rounded-3xl backdrop-blur-2xl text-center"
                style={{
                  background: "rgba(30, 50, 50, 0.6)",
                  border: "1px solid rgba(143, 188, 143, 0.15)",
                  boxShadow: "0 25px 50px rgba(0, 0, 0, 0.3)",
                }}
              >
                <p className="text-white/90 text-lg italic leading-relaxed">
                  "{showGuide === "laozi" ? LAOZI_QUOTE.quote : EINSTEIN_QUOTE.quote}"
                </p>
                <p className="text-teal-300/60 text-sm mt-4 tracking-wide">
                  {showGuide === "laozi" ? LAOZI_QUOTE.subtext : EINSTEIN_QUOTE.subtext}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* The Void Input */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.5 }}
          className="relative w-full max-w-3xl px-8"
          style={{ marginTop: showGuide ? "180px" : "0" }}
        >
          <div className="text-center mb-4">
            <span
              className="text-sm tracking-[0.3em]"
              style={{ color: "rgba(150, 200, 180, 0.5)" }}
            >
              EXHALE YOUR THOUGHTS
            </span>
          </div>

          <div
            className="relative rounded-[2rem] backdrop-blur-2xl overflow-hidden"
            style={{
              background: "rgba(20, 40, 40, 0.4)",
              border: "1px solid rgba(143, 188, 143, 0.1)",
              boxShadow: "inset 0 0 60px rgba(0, 128, 128, 0.05)",
            }}
          >
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Let your thoughts dissolve..."
              className="w-full h-48 p-8 bg-transparent text-white/80 placeholder-teal-200/30 
                         resize-none focus:outline-none text-lg leading-relaxed"
              style={{
                caretColor: "rgba(143, 188, 143, 0.8)",
                textShadow: inputValue ? "0 0 20px rgba(143, 188, 143, 0.4)" : "none",
              }}
            />
          </div>

          {/* Fading text particles */}
          <AnimatePresence>
            {fadingTexts.map((ft) => (
              <motion.span
                key={ft.id}
                initial={{ opacity: 1, scale: 1 }}
                animate={{ opacity: 0, scale: 0.5, y: -30 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 5 }}
                className="fixed pointer-events-none text-teal-300/60 text-lg"
                style={{
                  left: ft.x,
                  top: ft.y,
                  textShadow: "0 0 15px rgba(143, 188, 143, 0.6)",
                }}
              >
                {ft.text}
              </motion.span>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Emergency Reset Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1 }}
          onClick={startBreathingExercise}
          className="absolute bottom-12 px-8 py-4 rounded-full backdrop-blur-xl transition-all duration-500 
                     hover:scale-105 active:scale-95"
          style={{
            background: "rgba(180, 100, 100, 0.15)",
            border: "1px solid rgba(200, 150, 150, 0.3)",
            boxShadow: "0 0 30px rgba(180, 100, 100, 0.1)",
          }}
        >
          <span className="text-rose-200/80 text-sm tracking-[0.2em]">
            EMERGENCY RESET
          </span>
        </motion.button>

        {/* Back button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          onClick={() => window.history.back()}
          className="absolute bottom-12 left-8 text-teal-300/40 hover:text-teal-300/70 
                     transition-colors text-xs tracking-widest"
        >
          ← EXIT SANCTUARY
        </motion.button>

        {/* Emergency Reset Overlay */}
        <AnimatePresence>
          {isEmergencyReset && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="fixed inset-0 z-50 flex flex-col items-center justify-center"
              style={{
                background: breathPhase === "inhale"
                  ? "linear-gradient(180deg, #1a3a3a 0%, #0f2525 100%)"
                  : breathPhase === "hold"
                  ? "linear-gradient(180deg, #2a4a4a 0%, #1a3535 100%)"
                  : "linear-gradient(180deg, #152a2a 0%, #0a1a1a 100%)",
              }}
              onClick={exitEmergencyReset}
            >
              {/* Breathing circle */}
              <motion.div
                animate={{
                  scale: breathPhase === "inhale" ? [1, 1.5] : breathPhase === "hold" ? 1.5 : [1.5, 1],
                }}
                transition={{
                  duration: breathPhase === "inhale" ? 4 : breathPhase === "hold" ? 4 : 6,
                  ease: "easeInOut",
                }}
                className="relative"
              >
                <div
                  className="w-48 h-48 rounded-full"
                  style={{
                    background: "radial-gradient(circle, rgba(143, 188, 143, 0.3) 0%, transparent 70%)",
                    boxShadow: "0 0 80px rgba(143, 188, 143, 0.2)",
                  }}
                />
                <div
                  className="absolute inset-8 rounded-full"
                  style={{
                    background: "radial-gradient(circle, rgba(0, 128, 128, 0.4) 0%, transparent 70%)",
                  }}
                />
              </motion.div>

              {/* Breathing instruction */}
              <motion.div
                key={breathPhase}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-12 text-center"
              >
                <div className="text-3xl font-light tracking-[0.3em]"
                  style={{ color: "rgba(200, 220, 200, 0.9)" }}
                >
                  {breathPhase === "inhale" && "BREATHE IN"}
                  {breathPhase === "hold" && "HOLD"}
                  {breathPhase === "exhale" && "RELEASE"}
                </div>
                <div className="text-teal-300/50 text-sm mt-4 tracking-widest">
                  Cycle {breathCount + 1} of 6
                </div>
              </motion.div>

              <div className="absolute bottom-12 text-teal-300/30 text-xs tracking-widest">
                TAP ANYWHERE TO EXIT
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
