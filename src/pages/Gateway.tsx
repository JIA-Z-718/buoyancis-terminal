import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import MatrixRainTransition from "@/components/donnie/MatrixRainTransition";
import { supabase } from "@/integrations/supabase/client";

const Gateway = () => {
  const [code, setCode] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showMatrixRain, setShowMatrixRain] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);
  const [identityTag, setIdentityTag] = useState<string | null>(null);

  const handleMatrixComplete = useCallback(() => {
    if (pendingRoute) {
      window.location.assign(pendingRoute);
    }
  }, [pendingRoute]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isProcessing) return;
    
    const submittedCode = code.trim().toUpperCase();
    if (!submittedCode) return;

    setIsProcessing(true);
    setErrorMessage("");
    setIdentityTag(null);

    try {
      const { data, error } = await supabase.functions.invoke("verify-access-code", {
        body: { code: submittedCode, context: "gateway" },
      });

      if (error) throw error;

      if (data?.valid) {
        if (data.identityTag) {
          setIdentityTag(data.identityTag);
        }

        if (data.transition === "matrix_rain") {
          setPendingRoute(data.route);
          setShowMatrixRain(true);
        } else {
          setTimeout(() => {
            window.location.assign(data.route);
          }, 600);
        }
      } else {
        // Invalid code
        setIsProcessing(false);
        setIsShaking(true);
        setErrorMessage("CALIBRATING TOOLS...");
        
        setTimeout(() => {
          setIsShaking(false);
        }, 500);
        
        setTimeout(() => {
          setErrorMessage("");
        }, 3000);
      }
    } catch (err) {
      console.error("Access code verification failed:", err);
      setIsProcessing(false);
      setIsShaking(true);
      setErrorMessage("CALIBRATING TOOLS...");
      
      setTimeout(() => {
        setIsShaking(false);
      }, 500);
      
      setTimeout(() => {
        setErrorMessage("");
      }, 3000);
    }
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center relative overflow-hidden">
      {/* Matrix Rain Transition for Node 011 */}
      <MatrixRainTransition 
        isActive={showMatrixRain} 
        onComplete={handleMatrixComplete} 
      />
      {/* Breathing pulse effect - outer glow */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.div
          className="w-[600px] h-[600px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(183, 110, 121, 0.08) 0%, rgba(183, 110, 121, 0.02) 40%, transparent 70%)",
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>

      {/* Secondary breathing ring */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        <motion.div
          className="w-[400px] h-[400px] rounded-full border border-rose-gold/10"
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        />
      </motion.div>

      {/* Subtle particle dust */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-0.5 h-0.5 bg-rose-gold/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 0.6, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        {/* System status indicator */}
        <motion.div
          className="flex items-center gap-2 mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <motion.div
            className="w-2 h-2 rounded-full bg-rose-gold"
            animate={{
              opacity: [0.4, 1, 0.4],
              boxShadow: [
                "0 0 4px 0 rgba(183, 110, 121, 0.4)",
                "0 0 12px 2px rgba(183, 110, 121, 0.8)",
                "0 0 4px 0 rgba(183, 110, 121, 0.4)",
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <span className="font-mono text-xs tracking-[0.3em] text-white/40 uppercase">
            System Active
          </span>
        </motion.div>

        {/* Input form */}
        <form onSubmit={handleSubmit} className="flex flex-col items-center">
          <motion.div
            className="relative"
            animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="ENTER ACCESS CODE"
              className={`
                w-[320px] md:w-[400px] px-6 py-4
                bg-transparent
                font-mono text-base md:text-lg tracking-[0.15em] text-center
                border transition-all duration-300
                placeholder:text-white/20 placeholder:tracking-[0.15em]
                focus:outline-none
                ${isFocused || code 
                  ? "border-rose-gold/60 text-rose-gold shadow-[0_0_20px_-5px_rgba(183,110,121,0.5)]" 
                  : "border-white/20 text-white/60"
                }
                ${isShaking ? "border-red-500/80" : ""}
              `}
              autoComplete="off"
              spellCheck={false}
              disabled={isProcessing}
            />
            
            {/* Glow effect when focused */}
            <AnimatePresence>
              {(isFocused || code) && !isShaking && (
                <motion.div
                  className="absolute inset-0 -z-10 rounded-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    background: "radial-gradient(ellipse at center, rgba(183, 110, 121, 0.15) 0%, transparent 70%)",
                    filter: "blur(20px)",
                  }}
                />
              )}
            </AnimatePresence>
          </motion.div>

          {/* Submit button */}
          <motion.button
            type="submit"
            disabled={isProcessing || !code.trim()}
            className={`
              mt-8 px-8 py-3
              font-mono text-sm tracking-[0.2em] uppercase
              border border-white/20
              flex items-center gap-3
              transition-all duration-300
              ${isProcessing 
                ? "text-rose-gold border-rose-gold/40 cursor-wait" 
                : "text-white/60 hover:text-rose-gold hover:border-rose-gold/60 hover:shadow-[0_0_15px_-5px_rgba(183,110,121,0.4)]"
              }
              disabled:opacity-30 disabled:cursor-not-allowed
            `}
            whileHover={{ scale: isProcessing ? 1 : 1.02 }}
            whileTap={{ scale: isProcessing ? 1 : 0.98 }}
          >
            {isProcessing ? (
              <>
                <motion.span
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  INITIALIZING
                </motion.span>
                <motion.div
                  className="w-4 h-4 border border-rose-gold/60 border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              </>
            ) : (
              <>
                INITIALIZE
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>

        {/* Identity Tag - shown when valid code with tag is entered */}
        <AnimatePresence>
          {identityTag && !errorMessage && !isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-6 font-mono text-xs tracking-[0.1em] text-[#D4AF37]/60 italic"
            >
              "{identityTag}"
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error message */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-8 font-mono text-xs tracking-[0.15em] text-red-500/90"
            >
              {errorMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Subtle footer hint */}
        <motion.p
          className="mt-16 font-mono text-[10px] tracking-[0.2em] text-white/15 uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          Genesis Protocol v1.0
        </motion.p>
      </motion.div>

      {/* Corner decorations */}
      <div className="absolute top-8 left-8 w-16 h-16 border-l border-t border-white/5" />
      <div className="absolute top-8 right-8 w-16 h-16 border-r border-t border-white/5" />
      <div className="absolute bottom-8 left-8 w-16 h-16 border-l border-b border-white/5" />
      <div className="absolute bottom-8 right-8 w-16 h-16 border-r border-b border-white/5" />
    </div>
  );
};

export default Gateway;
