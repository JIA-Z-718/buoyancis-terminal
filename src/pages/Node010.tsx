import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Zap, Filter, Focus, Beaker, Activity, Radio } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
}

interface DissolutionRipple {
  id: number;
  x: number;
  y: number;
  delay: number;
}

interface WorkMeter {
  id: string;
  label: string;
  stressLevel: number;
  color: string;
}

interface DistilledParticle {
  id: number;
  x: number;
  y: number;
  char: string;
}

const CORRECT_PASSWORD = "exhale-to-evolve";

const INITIAL_METERS: WorkMeter[] = [
  { id: "work-1", label: "Work-1", stressLevel: 75, color: "#E57373" },
  { id: "work-2", label: "Work-2", stressLevel: 60, color: "#FFB74D" },
  { id: "work-3", label: "Work-3", stressLevel: 45, color: "#FFF176" },
  { id: "research", label: "Research (Johan)", stressLevel: 85, color: "#E57373" },
  { id: "future", label: "Future-Project", stressLevel: 30, color: "#81C784" },
];

// Emotion to Logic transformation map
const transformEmotionToLogic = (input: string): string => {
  const transformations: { pattern: RegExp; replacement: string }[] = [
    { pattern: /he is biased|biased/gi, replacement: "Node 013 exhibits confirmation bias patterns" },
    { pattern: /failed me|he failed/gi, replacement: "Evaluation metrics incompatible with Genesis v1.0 logic" },
    { pattern: /unfair|not fair/gi, replacement: "Asymmetric assessment protocol detected" },
    { pattern: /angry|furious|mad/gi, replacement: "Elevated cortisol response. Status: Acknowledged" },
    { pattern: /hate|despise/gi, replacement: "Strong negative correlation identified. Flagged for review" },
    { pattern: /stressed|overwhelmed/gi, replacement: "System load exceeding optimal parameters" },
    { pattern: /stupid|idiot/gi, replacement: "Low-efficiency node. Recommend: Bypass protocol" },
    { pattern: /impossible|can't do/gi, replacement: "Resource allocation requires reconfiguration" },
    { pattern: /tired|exhausted/gi, replacement: "Energy reserves depleted. Initiate recovery cycle" },
    { pattern: /scared|afraid|fear/gi, replacement: "Uncertainty threshold elevated. Gathering additional data" },
  ];

  let result = input;
  transformations.forEach(({ pattern, replacement }) => {
    result = result.replace(pattern, replacement);
  });

  // If no transformations applied, add a logical wrapper
  if (result === input && input.trim().length > 0) {
    result = `[PROCESSED] ${input}\n[STATUS] Emotional residue neutralized. Logic layer active.`;
  }

  return result;
};

type ViewMode = "sanctuary" | "journal" | "calibration";

export default function Node010() {
  // Gate state
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isDisssolving, setIsDissolving] = useState(false);
  const [dissolutionRipples, setDissolutionRipples] = useState<DissolutionRipple[]>([]);
  const [showMistClearing, setShowMistClearing] = useState(false);
  const gateInputRef = useRef<HTMLInputElement>(null);

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>("sanctuary");

  // Honor external entry hints (e.g. /node/010?mode=calibration or Gateway handoff)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlMode = (params.get("mode") || "").toLowerCase();
      const storedMode = (sessionStorage.getItem("node010_initial_mode") || "").toLowerCase();
      const mode = urlMode || storedMode;
      if (mode === "calibration") {
        setViewMode("calibration");
      }
      // one-shot hint
      sessionStorage.removeItem("node010_initial_mode");
    } catch {
      // ignore
    }
  }, []);

  // Sanctuary state
  const [particles, setParticles] = useState<Particle[]>([]);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [journalText, setJournalText] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);

  // Calibration state
  const [meters, setMeters] = useState<WorkMeter[]>(INITIAL_METERS);
  const [isFlushing, setIsFlushing] = useState(false);
  const [logicFilterOn, setLogicFilterOn] = useState(false);
  const [focusLevel, setFocusLevel] = useState([50]);
  const [syncStatus, setSyncStatus] = useState("Initializing...");

  // NEW: Emotion Distiller state
  const [rawInput, setRawInput] = useState("");
  const [distilledOutput, setDistilledOutput] = useState("");
  const [isDistilling, setIsDistilling] = useState(false);
  const [distilledParticles, setDistilledParticles] = useState<DistilledParticle[]>([]);

  // NEW: Frequency Stabilizer state
  const [frequencyLevel, setFrequencyLevel] = useState([20]); // 0 = chaos, 100 = calm

  // Check localStorage for previous unlock
  useEffect(() => {
    try {
      const unlocked = sessionStorage.getItem("node010_unlocked");
      if (unlocked === "true") {
        setIsUnlocked(true);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // One-shot autounlock (used when the user enters EXHALE-TO-EVOLVE on /gateway)
  useEffect(() => {
    if (isUnlocked) return;

    try {
      if (sessionStorage.getItem("node010_autounlock") !== "1") return;
      sessionStorage.removeItem("node010_autounlock");

      // Set for visual continuity, then trigger the same dissolve/mist flow as manual entry.
      setPassword(CORRECT_PASSWORD);
      triggerDissolution();
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUnlocked]);

  // Sync status animation
  useEffect(() => {
    if (viewMode !== "calibration") return;
    
    const messages = [
      "Syncing with Node 011 (Donnie)...",
      "Calibration Successful.",
      "Toolset optimized for high-velocity output.",
    ];
    let index = 0;
    
    const interval = setInterval(() => {
      setSyncStatus(messages[index % messages.length]);
      index++;
    }, 2000);
    
    return () => clearInterval(interval);
  }, [viewMode]);

  // Auto-focus gate input
  useEffect(() => {
    if (!isUnlocked && gateInputRef.current) {
      gateInputRef.current.focus();
    }
  }, [isUnlocked]);

  // Calculate glow intensity based on character match
  const glowIntensity = Math.min(password.length / CORRECT_PASSWORD.length, 1);

  // Handle password submission
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedInput = password.trim().toLowerCase();

    if (normalizedInput === CORRECT_PASSWORD) {
      triggerDissolution();
    } else {
      setIsShaking(true);
      setShowError(true);
      setTimeout(() => {
        setIsShaking(false);
        setShowError(false);
      }, 600);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handlePasswordSubmit(e);
    }
  };

  const triggerDissolution = () => {
    setIsDissolving(true);
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const newRipples: DissolutionRipple[] = [];

    for (let i = 0; i < 5; i++) {
      newRipples.push({
        id: i,
        x: centerX + (Math.random() - 0.5) * 100,
        y: centerY + (Math.random() - 0.5) * 100,
        delay: i * 0.15,
      });
    }
    setDissolutionRipples(newRipples);

    // Trigger mist clearing animation
    setShowMistClearing(true);

    setTimeout(() => {
      try {
        sessionStorage.setItem("node010_unlocked", "true");
      } catch {
        // Ignore
      }
      setIsUnlocked(true);
      setShowMistClearing(false);
    }, 2500);
  };

  // Stress Flush animation
  const handleStressFlush = () => {
    setIsFlushing(true);
    
    // Animate meters down to stable (20-30 range)
    setTimeout(() => {
      setMeters((prev) =>
        prev.map((meter) => ({
          ...meter,
          stressLevel: 20 + Math.random() * 10,
          color: "#81C784", // All become green/stable
        }))
      );
    }, 1000);
    
    setTimeout(() => {
      setIsFlushing(false);
    }, 2500);
  };

  // NEW: Handle emotion distillation
  const handleDistill = () => {
    if (!rawInput.trim()) return;
    
    setIsDistilling(true);
    setDistilledOutput("");
    
    // Create dissolution particles from input text
    const chars = rawInput.split("");
    const newParticles: DistilledParticle[] = chars.slice(0, 50).map((char, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      char,
    }));
    setDistilledParticles(newParticles);
    
    // Animate particles disappearing
    setTimeout(() => {
      setDistilledParticles([]);
    }, 1000);
    
    // Show distilled output after animation
    setTimeout(() => {
      const transformed = transformEmotionToLogic(rawInput);
      setDistilledOutput(transformed);
      setIsDistilling(false);
    }, 1500);
  };

  // Initialize floating particles
  useEffect(() => {
    if (!isUnlocked) return;

    const initialParticles: Particle[] = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 4 + 2,
      opacity: Math.random() * 0.5 + 0.2,
    }));
    setParticles(initialParticles);
  }, [isUnlocked]);

  // Track mouse position
  const handleMouseMove = useCallback((e: MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  useEffect(() => {
    if (!isUnlocked) return;
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove, isUnlocked]);

  // Animate particles toward cursor
  useEffect(() => {
    if (!isUnlocked) return;

    const interval = setInterval(() => {
      setParticles((prev) =>
        prev.map((p) => {
          const dx = mousePos.x - p.x;
          const dy = mousePos.y - p.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const attractionStrength = Math.max(0, 1 - distance / 400) * 0.02;

          return {
            ...p,
            x: p.x + dx * attractionStrength + (Math.random() - 0.5) * 0.5,
            y: p.y + dy * attractionStrength + (Math.random() - 0.5) * 0.5,
          };
        })
      );
    }, 50);

    return () => clearInterval(interval);
  }, [mousePos, isUnlocked]);

  // Handle card click ripple
  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newRipple = { id: Date.now(), x, y };
    setRipples((prev) => [...prev, newRipple]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 1500);
  };

  // Calculate background blur based on focus level
  const backgroundBlur = 100 - focusLevel[0];
  
  // Calculate frequency-based visuals
  const frequencyNormalized = frequencyLevel[0] / 100;
  const chaosAmount = 1 - frequencyNormalized;

  // Password Gate
  if (!isUnlocked) {
    return (
      <div
        className="fixed inset-0 font-mono"
        style={{
          background: "linear-gradient(180deg, #0F172A 0%, #1E293B 100%)",
          minHeight: "100dvh",
        }}
      >
        {/* Breathing Wave Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-0"
              style={{
                background: `radial-gradient(ellipse 100% 50% at 50% ${100 + i * 20}%, rgba(178, 172, 136, 0.02) 0%, transparent 70%)`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.5,
              }}
            />
          ))}
        </div>

        {/* Mist Clearing Animation */}
        <AnimatePresence>
          {showMistClearing && (
            <motion.div
              className="absolute inset-0 z-5 pointer-events-none"
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 2.5, ease: "easeOut" }}
              style={{
                background: "radial-gradient(ellipse at center, rgba(15, 30, 40, 0.9) 0%, rgba(15, 30, 40, 0.95) 100%)",
              }}
            />
          )}
        </AnimatePresence>

        {/* Frosted Glass Overlay */}
        <AnimatePresence>
          {!isDisssolving ? (
            <motion.div
              className="absolute inset-0 flex items-center justify-center z-10"
              style={{
                background: "rgba(15, 23, 42, 0.7)",
                backdropFilter: "blur(30px)",
                WebkitBackdropFilter: "blur(30px)",
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.form
                onSubmit={handlePasswordSubmit}
                className="flex flex-col items-center gap-8 px-4 w-full max-w-md"
                animate={isShaking ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : {}}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  className="text-xs tracking-[0.4em] text-center"
                  style={{ color: "rgba(178, 172, 136, 0.5)" }}
                  animate={{ opacity: [0.4, 0.7, 0.4] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  NODE 010 AUTHENTICATION
                </motion.div>

                <motion.div
                  className="relative w-full"
                  animate={{
                    boxShadow: [
                      `0 0 ${20 + glowIntensity * 40}px rgba(178, 172, 136, ${0.1 + glowIntensity * 0.3})`,
                      `0 0 ${30 + glowIntensity * 60}px rgba(178, 172, 136, ${0.15 + glowIntensity * 0.4})`,
                      `0 0 ${20 + glowIntensity * 40}px rgba(178, 172, 136, ${0.1 + glowIntensity * 0.3})`,
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  style={{ borderRadius: "12px" }}
                >
                  <input
                    ref={gateInputRef}
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter the Key to Exhale"
                    className="w-full px-6 py-4 pr-14 text-center text-sm tracking-[0.15em] outline-none transition-colors duration-300"
                    style={{
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(178, 172, 136, 0.2)",
                      borderRadius: "12px",
                      color: showError ? "#E57373" : "rgba(255, 255, 255, 0.9)",
                      fontFamily: "'Fira Code', monospace",
                      caretColor: "#B2AC88",
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 transition-colors"
                    style={{ color: "rgba(178, 172, 136, 0.5)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(178, 172, 136, 0.9)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(178, 172, 136, 0.5)")}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </motion.div>

                <AnimatePresence>
                  {showError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-xs tracking-[0.2em]"
                      style={{ color: "#E57373" }}
                    >
                      FREQUENCY MISALIGNED
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div
                  className="text-xs tracking-[0.15em] text-center"
                  style={{ color: "rgba(178, 172, 136, 0.3)" }}
                  animate={{ opacity: [0.2, 0.4, 0.2] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  [ breathe deeply, then release ]
                </motion.div>
              </motion.form>
            </motion.div>
          ) : (
            <motion.div
              className="absolute inset-0 z-20 pointer-events-none"
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 2, ease: "easeOut" }}
            >
              {dissolutionRipples.map((ripple) => (
                <motion.div
                  key={ripple.id}
                  className="absolute pointer-events-none"
                  style={{
                    left: ripple.x,
                    top: ripple.y,
                    transform: "translate(-50%, -50%)",
                  }}
                  initial={{ width: 0, height: 0, opacity: 0.8 }}
                  animate={{ width: 2000, height: 2000, opacity: 0 }}
                  transition={{ duration: 2, delay: ripple.delay, ease: "easeOut" }}
                >
                  <div
                    className="w-full h-full rounded-full"
                    style={{
                      background: "radial-gradient(circle, rgba(178, 172, 136, 0.5) 0%, rgba(178, 172, 136, 0.2) 30%, transparent 70%)",
                    }}
                  />
                </motion.div>
              ))}

              <motion.div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 3, opacity: 0 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              >
                <div
                  className="w-64 h-64 rounded-full"
                  style={{
                    background: "radial-gradient(circle, rgba(178, 172, 136, 0.6) 0%, transparent 70%)",
                    filter: "blur(20px)",
                  }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Main Content (after unlock)
  return (
    <div
      className="fixed inset-0 overflow-hidden font-mono"
      style={{
        background: viewMode === "calibration" 
          ? `linear-gradient(180deg, #0A1A1A ${chaosAmount * 20}%, #0D2626 100%)` // Serene Midnight Teal
          : "linear-gradient(180deg, #0F172A 0%, #1E293B 100%)",
        minHeight: "100dvh",
        transition: "background 1s ease-out",
      }}
    >
      {/* Dynamic Background Blur Layer */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-500"
        style={{
          backdropFilter: `blur(${backgroundBlur * 0.3}px)`,
          WebkitBackdropFilter: `blur(${backgroundBlur * 0.3}px)`,
        }}
      />

      {/* Frequency-based Background Effects (Calibration Mode) */}
      {viewMode === "calibration" && (
        <>
          {/* Chaotic Static Noise (decreases with higher frequency) */}
          <div
            className="absolute inset-0 pointer-events-none z-0 transition-opacity duration-500"
            style={{
              opacity: chaosAmount * 0.3,
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />
          
          {/* Jagged Lines (chaos) - transform to smooth beam */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {chaosAmount > 0.3 ? (
              // Chaotic jagged lines
              [...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute h-px w-full"
                  style={{
                    top: `${20 + i * 15}%`,
                    background: `linear-gradient(90deg, transparent 0%, rgba(229, 115, 115, ${chaosAmount * 0.5}) 50%, transparent 100%)`,
                    transform: `skewY(${(Math.random() - 0.5) * 10 * chaosAmount}deg)`,
                  }}
                  animate={{
                    x: [-50, 50, -50],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 0.5 + Math.random() * 0.5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              ))
            ) : (
              // Pure frequency beam (calm)
              <motion.div
                className="absolute left-0 right-0 h-0.5"
                style={{
                  top: "50%",
                  background: `linear-gradient(90deg, transparent 0%, rgba(129, 199, 132, ${frequencyNormalized * 0.8}) 20%, rgba(129, 199, 132, ${frequencyNormalized}) 50%, rgba(129, 199, 132, ${frequencyNormalized * 0.8}) 80%, transparent 100%)`,
                  boxShadow: `0 0 30px rgba(129, 199, 132, ${frequencyNormalized * 0.5})`,
                }}
                animate={{
                  opacity: [0.6, 1, 0.6],
                  scaleY: [1, 1.5, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}
          </div>
        </>
      )}

      {/* Breathing Wave Overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse 100% 50% at 50% ${100 + i * 20}%, rgba(178, 172, 136, 0.03) 0%, transparent 70%)`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      {/* Stress Flush Overlay */}
      <AnimatePresence>
        {isFlushing && (
          <motion.div
            className="absolute inset-0 z-50 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Dark ink being washed away */}
            <motion.div
              className="absolute inset-0"
              initial={{ background: "rgba(0, 0, 0, 0.6)" }}
              animate={{ background: "rgba(0, 0, 0, 0)" }}
              transition={{ duration: 2, ease: "easeOut" }}
            />
            
            {/* Sage Green surge */}
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0, 0.6, 0], scale: [0.5, 2, 3] }}
              transition={{ duration: 2.5, ease: "easeOut" }}
              style={{
                background: "radial-gradient(circle, rgba(178, 172, 136, 0.8) 0%, rgba(129, 199, 132, 0.4) 50%, transparent 70%)",
              }}
            />
            
            {/* Cleansing text */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 2, ease: "easeInOut" }}
            >
              <span
                className="text-2xl tracking-[0.4em]"
                style={{ color: "#B2AC88", textShadow: "0 0 30px rgba(178, 172, 136, 0.8)" }}
              >
                FLUSHING TOXINS...
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Luminescent Particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            background: `radial-gradient(circle, rgba(178, 172, 136, ${particle.opacity}) 0%, transparent 70%)`,
            boxShadow: `0 0 ${particle.size * 2}px rgba(178, 172, 136, ${particle.opacity * 0.5})`,
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [particle.opacity, particle.opacity * 1.3, particle.opacity],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Logic Filter Keywords Overlay */}
      <AnimatePresence>
        {logicFilterOn && (
          <motion.div
            className="fixed inset-0 pointer-events-none z-30 flex items-center justify-center gap-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.span
              className="text-4xl md:text-6xl font-bold tracking-[0.3em]"
              style={{
                color: "rgba(178, 172, 136, 0.15)",
                textShadow: "0 0 40px rgba(178, 172, 136, 0.3)",
              }}
              animate={{ opacity: [0.1, 0.2, 0.1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              RIGOR
            </motion.span>
            <motion.span
              className="text-4xl md:text-6xl font-bold tracking-[0.3em]"
              style={{
                color: "rgba(178, 172, 136, 0.15)",
                textShadow: "0 0 40px rgba(178, 172, 136, 0.3)",
              }}
              animate={{ opacity: [0.1, 0.2, 0.1] }}
              transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
            >
              OBJECTIVITY
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4 overflow-y-auto">
        <AnimatePresence mode="wait">
          {viewMode === "sanctuary" && (
            <motion.div
              key="sanctuary-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex flex-col items-center gap-8"
            >
              {/* Glassmorphic Gift Card */}
              <div
                ref={cardRef}
                onClick={handleCardClick}
                className="relative max-w-lg w-full cursor-pointer overflow-hidden"
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  backdropFilter: "blur(40px)",
                  WebkitBackdropFilter: "blur(40px)",
                  borderRadius: "24px",
                  border: "1px solid rgba(178, 172, 136, 0.2)",
                  boxShadow: `
                    0 0 40px rgba(178, 172, 136, 0.1),
                    0 0 80px rgba(178, 172, 136, 0.05),
                    inset 0 0 60px rgba(178, 172, 136, 0.02)
                  `,
                  padding: "3rem",
                }}
              >
                <motion.div
                  className="absolute inset-0 rounded-3xl pointer-events-none"
                  style={{
                    border: "1px solid transparent",
                    background: `linear-gradient(90deg, transparent, rgba(178, 172, 136, 0.4), transparent) border-box`,
                    WebkitMask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                  }}
                  animate={{ opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />

                {ripples.map((ripple) => (
                  <motion.div
                    key={ripple.id}
                    className="absolute pointer-events-none"
                    style={{ left: ripple.x, top: ripple.y, transform: "translate(-50%, -50%)" }}
                    initial={{ width: 0, height: 0, opacity: 0.8 }}
                    animate={{ width: 600, height: 600, opacity: 0 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  >
                    <div
                      className="w-full h-full rounded-full"
                      style={{ background: "radial-gradient(circle, rgba(178, 172, 136, 0.4) 0%, transparent 70%)" }}
                    />
                  </motion.div>
                ))}

                <div className="relative z-10 text-center">
                  <motion.h1
                    className="text-xs tracking-[0.4em] mb-6"
                    style={{ color: "rgba(178, 172, 136, 0.7)" }}
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    NODE 010: THE SANCTUARY
                  </motion.h1>

                  <div
                    className="w-16 h-px mx-auto mb-8"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(178, 172, 136, 0.5), transparent)" }}
                  />

                  <p
                    className="text-sm md:text-base leading-relaxed mb-8"
                    style={{ color: "rgba(255, 255, 255, 0.85)", fontFamily: "'Fira Code', monospace", lineHeight: "1.8" }}
                  >
                    In the architecture of Genesis, you are the zero-pressure zone.
                    <br /><br />
                    Thank you for the limitless space and professional guidance that allows my soul to recalibrate among the chaos of 5 parallel worlds.
                  </p>

                  <div
                    className="w-16 h-px mx-auto mb-6"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(178, 172, 136, 0.5), transparent)" }}
                  />

                  <motion.p
                    className="text-xs tracking-[0.2em]"
                    style={{ color: "rgba(178, 172, 136, 0.6)" }}
                    animate={{ opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    ACCESS GRANTED: UNIVERSAL COOLING PROTOCOL
                  </motion.p>
                </div>

                <motion.div
                  className="absolute bottom-4 left-0 right-0 text-center text-xs"
                  style={{ color: "rgba(178, 172, 136, 0.3)" }}
                  animate={{ opacity: [0.2, 0.4, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  [ click to release ]
                </motion.div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-center gap-4">
                <motion.button
                  onClick={() => setViewMode("journal")}
                  className="px-8 py-3 text-xs tracking-[0.3em] transition-all duration-500"
                  style={{
                    background: "rgba(178, 172, 136, 0.1)",
                    border: "1px solid rgba(178, 172, 136, 0.3)",
                    color: "rgba(178, 172, 136, 0.8)",
                    borderRadius: "8px",
                    backdropFilter: "blur(10px)",
                  }}
                  whileHover={{ background: "rgba(178, 172, 136, 0.2)", borderColor: "rgba(178, 172, 136, 0.5)", scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  ENTER DIALOGUE
                </motion.button>

                <motion.button
                  onClick={() => setViewMode("calibration")}
                  className="px-8 py-3 text-xs tracking-[0.3em] transition-all duration-500 flex items-center gap-2"
                  style={{
                    background: "rgba(129, 199, 132, 0.1)",
                    border: "1px solid rgba(129, 199, 132, 0.3)",
                    color: "rgba(129, 199, 132, 0.8)",
                    borderRadius: "8px",
                    backdropFilter: "blur(10px)",
                  }}
                  whileHover={{ background: "rgba(129, 199, 132, 0.2)", borderColor: "rgba(129, 199, 132, 0.5)", scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Zap size={14} />
                  CALIBRATION SUITE
                </motion.button>
              </div>
            </motion.div>
          )}

          {viewMode === "journal" && (
            <motion.div
              key="journal-mode"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="w-full max-w-2xl mx-auto px-4"
            >
              <motion.button
                onClick={() => setViewMode("sanctuary")}
                className="mb-8 text-xs tracking-[0.2em] transition-colors"
                style={{ color: "rgba(178, 172, 136, 0.5)" }}
                whileHover={{ color: "rgba(178, 172, 136, 0.8)" }}
              >
                ← RETURN TO SANCTUARY
              </motion.button>

              <motion.div className="text-center mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                <p className="text-xs tracking-[0.3em]" style={{ color: "rgba(178, 172, 136, 0.5)" }}>
                  UNLIMITED JOURNALING SPACE
                </p>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                <textarea
                  value={journalText}
                  onChange={(e) => setJournalText(e.target.value)}
                  placeholder="Begin your dialogue..."
                  className="w-full min-h-[60vh] p-6 resize-none focus:outline-none"
                  style={{
                    background: "rgba(255, 255, 255, 0.02)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(178, 172, 136, 0.1)",
                    borderRadius: "16px",
                    color: "rgba(255, 255, 255, 0.9)",
                    fontFamily: "'Fira Code', monospace",
                    fontSize: "14px",
                    lineHeight: "2",
                    caretColor: "#B2AC88",
                  }}
                  autoFocus
                />
              </motion.div>

              <motion.div
                className="mt-4 text-right text-xs"
                style={{ color: "rgba(178, 172, 136, 0.3)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                {journalText.split(/\s+/).filter(Boolean).length} words
              </motion.div>
            </motion.div>
          )}

          {viewMode === "calibration" && (
            <motion.div
              key="calibration-mode"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="w-full max-w-5xl mx-auto px-4 py-8"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <motion.button
                  onClick={() => setViewMode("sanctuary")}
                  className="text-xs tracking-[0.2em] transition-colors"
                  style={{ color: "rgba(178, 172, 136, 0.5)" }}
                  whileHover={{ color: "rgba(178, 172, 136, 0.8)" }}
                >
                  ← RETURN TO SANCTUARY
                </motion.button>

                <motion.div
                  className="text-xs tracking-[0.4em]"
                  style={{ color: "rgba(129, 199, 132, 0.7)" }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  BIO-DIGITAL CALIBRATION
                </motion.div>
              </div>

              {/* TOOL 1: Emotion Distiller */}
              <div
                className="p-6 mb-8"
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  backdropFilter: "blur(30px)",
                  borderRadius: "20px",
                  border: "1px solid rgba(178, 172, 136, 0.15)",
                }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <Beaker size={18} style={{ color: "rgba(178, 172, 136, 0.7)" }} />
                  <span className="text-xs tracking-[0.3em]" style={{ color: "rgba(178, 172, 136, 0.7)" }}>
                    EMOTION DISTILLER 情緒蒸餾器
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-6 relative">
                  {/* Raw Input */}
                  <div>
                    <label className="block text-xs tracking-[0.2em] mb-3" style={{ color: "rgba(229, 115, 115, 0.7)" }}>
                      RAW INPUT: External Noise
                    </label>
                    <Textarea
                      value={rawInput}
                      onChange={(e) => setRawInput(e.target.value)}
                      placeholder="e.g., Johan is biased and failed me..."
                      className="w-full min-h-[120px] resize-none"
                      style={{
                        background: "rgba(229, 115, 115, 0.05)",
                        border: "1px solid rgba(229, 115, 115, 0.2)",
                        borderRadius: "12px",
                        color: "rgba(255, 255, 255, 0.9)",
                        fontFamily: "'Fira Code', monospace",
                        fontSize: "12px",
                      }}
                    />
                  </div>

                  {/* Distill Button (Center) */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:block">
                    <motion.button
                      onClick={handleDistill}
                      disabled={isDistilling || !rawInput.trim()}
                      className="px-6 py-3 text-xs tracking-[0.2em] flex items-center gap-2 disabled:opacity-50"
                      style={{
                        background: isDistilling ? "rgba(129, 199, 132, 0.3)" : "rgba(178, 172, 136, 0.2)",
                        border: "1px solid rgba(178, 172, 136, 0.4)",
                        color: "rgba(178, 172, 136, 0.9)",
                        borderRadius: "12px",
                        boxShadow: "0 0 20px rgba(178, 172, 136, 0.2)",
                      }}
                      whileHover={!isDistilling ? { scale: 1.05, boxShadow: "0 0 30px rgba(178, 172, 136, 0.4)" } : {}}
                      whileTap={!isDistilling ? { scale: 0.95 } : {}}
                    >
                      {isDistilling ? "DISTILLING..." : "DISTILL →"}
                    </motion.button>
                  </div>

                  {/* Clean Output */}
                  <div className="relative">
                    <label className="block text-xs tracking-[0.2em] mb-3" style={{ color: "rgba(129, 199, 132, 0.7)" }}>
                      CLEAN OUTPUT: Cold Logic
                    </label>
                    <div
                      className="w-full min-h-[120px] p-4 relative overflow-hidden"
                      style={{
                        background: "rgba(129, 199, 132, 0.05)",
                        border: "1px solid rgba(129, 199, 132, 0.2)",
                        borderRadius: "12px",
                        color: "rgba(129, 199, 132, 0.9)",
                        fontFamily: "'Fira Code', monospace",
                        fontSize: "12px",
                        lineHeight: "1.6",
                      }}
                    >
                      {/* Dissolution Particles */}
                      <AnimatePresence>
                        {distilledParticles.map((p) => (
                          <motion.span
                            key={p.id}
                            className="absolute text-xs"
                            style={{
                              left: `${p.x}%`,
                              top: `${p.y}%`,
                              color: "rgba(229, 115, 115, 0.8)",
                            }}
                            initial={{ opacity: 1, scale: 1 }}
                            animate={{ opacity: 0, scale: 0, y: -20 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.8, delay: p.id * 0.02 }}
                          >
                            {p.char}
                          </motion.span>
                        ))}
                      </AnimatePresence>
                      
                      {distilledOutput || (
                        <span style={{ color: "rgba(129, 199, 132, 0.3)" }}>
                          [Awaiting distillation...]
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mobile Distill Button */}
                <div className="flex justify-center mt-4 md:hidden">
                  <motion.button
                    onClick={handleDistill}
                    disabled={isDistilling || !rawInput.trim()}
                    className="px-6 py-3 text-xs tracking-[0.2em] flex items-center gap-2 disabled:opacity-50"
                    style={{
                      background: isDistilling ? "rgba(129, 199, 132, 0.3)" : "rgba(178, 172, 136, 0.2)",
                      border: "1px solid rgba(178, 172, 136, 0.4)",
                      color: "rgba(178, 172, 136, 0.9)",
                      borderRadius: "12px",
                    }}
                    whileHover={!isDistilling ? { scale: 1.05 } : {}}
                    whileTap={!isDistilling ? { scale: 0.95 } : {}}
                  >
                    {isDistilling ? "DISTILLING..." : "DISTILL ↓"}
                  </motion.button>
                </div>
              </div>

              {/* TOOL 2: Breath-Sync Calibrator */}
              <div
                className="p-6 mb-8"
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  backdropFilter: "blur(30px)",
                  borderRadius: "20px",
                  border: "1px solid rgba(178, 172, 136, 0.15)",
                }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <Activity size={18} style={{ color: "rgba(129, 199, 132, 0.7)" }} />
                  <span className="text-xs tracking-[0.3em]" style={{ color: "rgba(129, 199, 132, 0.7)" }}>
                    BREATH-SYNC CALIBRATOR 呼吸同步儀
                  </span>
                </div>

                <div className="flex flex-col items-center py-8">
                  {/* Breathing Sphere */}
                  <motion.div
                    className="relative"
                    animate={{
                      scale: [1, 1.3, 1],
                    }}
                    transition={{
                      duration: 6, // 6-second interval
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    {/* Outer Glow */}
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{
                        width: "180px",
                        height: "180px",
                        background: "radial-gradient(circle, rgba(129, 199, 132, 0.1) 0%, transparent 70%)",
                        filter: "blur(20px)",
                      }}
                      animate={{
                        opacity: [0.3, 0.6, 0.3],
                      }}
                      transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                    
                    {/* Core Sphere */}
                    <motion.div
                      className="relative rounded-full"
                      style={{
                        width: "120px",
                        height: "120px",
                        background: "radial-gradient(circle at 30% 30%, rgba(129, 199, 132, 0.4), rgba(129, 199, 132, 0.1) 60%, transparent 100%)",
                        border: "1px solid rgba(129, 199, 132, 0.3)",
                        boxShadow: `
                          0 0 40px rgba(129, 199, 132, 0.3),
                          inset 0 0 40px rgba(129, 199, 132, 0.1)
                        `,
                      }}
                      animate={{
                        boxShadow: [
                          "0 0 40px rgba(129, 199, 132, 0.3), inset 0 0 40px rgba(129, 199, 132, 0.1)",
                          "0 0 60px rgba(129, 199, 132, 0.5), inset 0 0 60px rgba(129, 199, 132, 0.2)",
                          "0 0 40px rgba(129, 199, 132, 0.3), inset 0 0 40px rgba(129, 199, 132, 0.1)",
                        ],
                      }}
                      transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  </motion.div>

                  {/* Text Overlay */}
                  <motion.p
                    className="mt-8 text-xs tracking-[0.2em] text-center"
                    style={{ color: "rgba(129, 199, 132, 0.6)" }}
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  >
                    Sync your heart rate with the Genesis Core
                  </motion.p>

                  {/* Breathing Phase Indicator */}
                  <motion.p
                    className="mt-4 text-sm tracking-[0.3em]"
                    style={{ color: "rgba(178, 172, 136, 0.5)" }}
                  >
                    <motion.span
                      animate={{
                        opacity: [1, 0, 0, 0, 0, 0, 1],
                      }}
                      transition={{
                        duration: 6,
                        repeat: Infinity,
                        times: [0, 0.1, 0.4, 0.5, 0.6, 0.9, 1],
                      }}
                    >
                      INHALE
                    </motion.span>
                    <motion.span
                      className="mx-4"
                      animate={{
                        opacity: [0, 0, 0, 1, 0, 0, 0],
                      }}
                      transition={{
                        duration: 6,
                        repeat: Infinity,
                        times: [0, 0.1, 0.4, 0.5, 0.6, 0.9, 1],
                      }}
                    >
                      EXHALE
                    </motion.span>
                  </motion.p>
                </div>
              </div>

              {/* TOOL 3: Frequency Stabilizer */}
              <div
                className="p-6 mb-8"
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  backdropFilter: "blur(30px)",
                  borderRadius: "20px",
                  border: "1px solid rgba(178, 172, 136, 0.15)",
                }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <Radio size={18} style={{ color: "rgba(178, 172, 136, 0.7)" }} />
                  <span className="text-xs tracking-[0.3em]" style={{ color: "rgba(178, 172, 136, 0.7)" }}>
                    FREQUENCY STABILIZER 頻率穩定器
                  </span>
                </div>

                {/* Frequency Visualization */}
                <div className="relative h-24 mb-6 overflow-hidden rounded-lg" style={{ background: "rgba(0, 0, 0, 0.3)" }}>
                  {/* Chaotic waves or pure beam based on level */}
                  {chaosAmount > 0.3 ? (
                    // Jagged chaos waves
                    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                      {[...Array(3)].map((_, i) => (
                        <motion.path
                          key={i}
                          d={`M 0 ${48 + i * 10} ${[...Array(20)].map((_, j) => 
                            `L ${j * 25} ${48 + (Math.random() - 0.5) * 40 * chaosAmount}`
                          ).join(' ')} L 500 ${48 + i * 10}`}
                          stroke={`rgba(229, 115, 115, ${0.3 + i * 0.1})`}
                          strokeWidth="2"
                          fill="none"
                          animate={{
                            d: `M 0 ${48 + i * 10} ${[...Array(20)].map((_, j) => 
                              `L ${j * 25} ${48 + (Math.random() - 0.5) * 40 * chaosAmount}`
                            ).join(' ')} L 500 ${48 + i * 10}`,
                          }}
                          transition={{
                            duration: 0.3,
                            repeat: Infinity,
                            repeatType: "mirror",
                          }}
                        />
                      ))}
                    </svg>
                  ) : (
                    // Pure horizontal beam
                    <motion.div
                      className="absolute left-0 right-0 h-1"
                      style={{
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: `linear-gradient(90deg, transparent 0%, rgba(129, 199, 132, ${frequencyNormalized}) 20%, rgba(129, 199, 132, 1) 50%, rgba(129, 199, 132, ${frequencyNormalized}) 80%, transparent 100%)`,
                        boxShadow: `0 0 20px rgba(129, 199, 132, ${frequencyNormalized}), 0 0 40px rgba(129, 199, 132, ${frequencyNormalized * 0.5})`,
                      }}
                      animate={{
                        opacity: [0.8, 1, 0.8],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  )}
                </div>

                {/* Slider */}
                <div className="px-4">
                  <Slider
                    value={frequencyLevel}
                    onValueChange={setFrequencyLevel}
                    max={100}
                    step={1}
                    className="mb-4"
                  />
                  <div className="flex justify-between text-xs">
                    <span style={{ color: "rgba(229, 115, 115, 0.7)" }}>HIGH ALERT</span>
                    <span style={{ color: "rgba(129, 199, 132, 0.7)" }}>DEEP FOCUS</span>
                  </div>
                </div>
              </div>

              {/* 5 Work Meters */}
              <div
                className="p-6 mb-8"
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  backdropFilter: "blur(30px)",
                  borderRadius: "20px",
                  border: "1px solid rgba(178, 172, 136, 0.15)",
                }}
              >
                <div className="text-xs tracking-[0.3em] mb-6 text-center" style={{ color: "rgba(178, 172, 136, 0.5)" }}>
                  CONCURRENT WORKLOAD STRESS MATRIX
                </div>

                <div className="flex justify-center gap-6 md:gap-10 mb-8">
                  {meters.map((meter) => (
                    <div key={meter.id} className="flex flex-col items-center gap-3">
                      {/* Vertical Bar */}
                      <div
                        className="relative w-8 md:w-10 h-40 md:h-48 rounded-full overflow-hidden"
                        style={{
                          background: "rgba(0, 0, 0, 0.3)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                        }}
                      >
                        <motion.div
                          className="absolute bottom-0 left-0 right-0 rounded-full"
                          style={{
                            background: `linear-gradient(to top, ${meter.color}, ${meter.color}88)`,
                            boxShadow: `0 0 20px ${meter.color}66`,
                          }}
                          initial={{ height: "0%" }}
                          animate={{ height: `${meter.stressLevel}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        />
                      </div>

                      {/* Label */}
                      <span
                        className="text-[10px] tracking-[0.1em] text-center max-w-16"
                        style={{ color: "rgba(255, 255, 255, 0.6)" }}
                      >
                        {meter.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Stress Flush Button */}
                <div className="flex justify-center">
                  <motion.button
                    onClick={handleStressFlush}
                    disabled={isFlushing}
                    className="px-8 py-3 text-xs tracking-[0.3em] flex items-center gap-2 transition-all"
                    style={{
                      background: isFlushing ? "rgba(129, 199, 132, 0.3)" : "rgba(229, 115, 115, 0.2)",
                      border: `1px solid ${isFlushing ? "rgba(129, 199, 132, 0.5)" : "rgba(229, 115, 115, 0.4)"}`,
                      color: isFlushing ? "rgba(129, 199, 132, 0.9)" : "rgba(229, 115, 115, 0.9)",
                      borderRadius: "8px",
                    }}
                    whileHover={!isFlushing ? { scale: 1.02, background: "rgba(229, 115, 115, 0.3)" } : {}}
                    whileTap={!isFlushing ? { scale: 0.98 } : {}}
                  >
                    <Zap size={14} />
                    {isFlushing ? "FLUSHING..." : "STRESS FLUSH"}
                  </motion.button>
                </div>
              </div>

              {/* Calibration Tools Grid */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Logic Filter */}
                <div
                  className="p-6"
                  style={{
                    background: "rgba(255, 255, 255, 0.02)",
                    backdropFilter: "blur(30px)",
                    borderRadius: "16px",
                    border: "1px solid rgba(178, 172, 136, 0.15)",
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Filter size={16} style={{ color: "rgba(178, 172, 136, 0.7)" }} />
                      <span className="text-xs tracking-[0.2em]" style={{ color: "rgba(178, 172, 136, 0.7)" }}>
                        LOGIC FILTER
                      </span>
                    </div>
                    <Switch
                      checked={logicFilterOn}
                      onCheckedChange={setLogicFilterOn}
                      className="data-[state=checked]:bg-[#B2AC88]"
                    />
                  </div>
                  <p className="text-xs" style={{ color: "rgba(255, 255, 255, 0.4)", lineHeight: "1.6" }}>
                    Strip emotion from academic reports. Highlights RIGOR & OBJECTIVITY when enabled.
                  </p>
                </div>

                {/* Focus Tuner */}
                <div
                  className="p-6"
                  style={{
                    background: "rgba(255, 255, 255, 0.02)",
                    backdropFilter: "blur(30px)",
                    borderRadius: "16px",
                    border: "1px solid rgba(178, 172, 136, 0.15)",
                  }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Focus size={16} style={{ color: "rgba(178, 172, 136, 0.7)" }} />
                    <span className="text-xs tracking-[0.2em]" style={{ color: "rgba(178, 172, 136, 0.7)" }}>
                      FOCUS TUNER
                    </span>
                  </div>
                  <Slider
                    value={focusLevel}
                    onValueChange={setFocusLevel}
                    max={100}
                    step={1}
                    className="mb-3"
                  />
                  <div className="flex justify-between text-xs" style={{ color: "rgba(255, 255, 255, 0.3)" }}>
                    <span>Overwhelmed</span>
                    <span>Strategic Clarity</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sync Status Feed */}
      {viewMode === "calibration" && (
        <motion.div
          className="fixed bottom-6 left-0 right-0 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <motion.p
            className="text-xs tracking-[0.15em]"
            style={{ color: "rgba(129, 199, 132, 0.6)" }}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {syncStatus}
          </motion.p>
        </motion.div>
      )}

      {/* Breathing Indicator (Sanctuary/Journal only) */}
      {viewMode !== "calibration" && (
        <motion.div
          className="fixed bottom-8 left-1/2 transform -translate-x-1/2 text-xs tracking-[0.2em]"
          style={{ color: "rgba(178, 172, 136, 0.3)" }}
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.span
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          >
            ◯
          </motion.span>
        </motion.div>
      )}
    </div>
  );
}
