import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ArrowRight, Sparkles, Orbit, Atom } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Manifesto content with Reputation Physics formulas
const ManifestoContent = () => (
  <div className="text-left space-y-6 max-w-2xl mx-auto">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <h2 className="text-xl md:text-2xl font-serif text-[#D4AF37] mb-4 tracking-wide">
        THE PROTOCOL OF TRUTH
      </h2>
      <p className="text-white/60 leading-relaxed text-sm md:text-base">
        In an era where information flows like gravity—invisible yet inescapable—we propose 
        a new paradigm: the Structured Consciousness Field. A system where trust is not 
        declared, but observed. Not given, but earned through the immutable laws of 
        reputation physics.
      </p>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="border border-[#D4AF37]/20 rounded-lg p-4 md:p-6 bg-[#D4AF37]/5"
    >
      <h3 className="text-sm uppercase tracking-widest text-[#D4AF37]/80 mb-4 flex items-center gap-2">
        <Orbit className="w-4 h-4" />
        Core Algorithms
      </h3>
      
      <div className="space-y-4 font-mono text-xs md:text-sm">
        <div>
          <span className="text-white/40">// Influence Model</span>
          <div className="text-[#D4AF37] mt-1">
            Influence = (G × M<sub>obs</sub> × M<sub>target</sub>) / r²
          </div>
        </div>
        
        <div>
          <span className="text-white/40">// TrustScore Formula</span>
          <div className="text-[#D4AF37] mt-1">
            TrustScore = (Base × Continuity) + LocalGravity
          </div>
        </div>
        
        <div>
          <span className="text-white/40">// Mass Decay (Anti-Monopoly)</span>
          <div className="text-[#D4AF37] mt-1">
            M(t) = M<sub>0</sub> × e<sup>-λt</sup>
          </div>
        </div>
      </div>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="border border-white/10 rounded-lg p-4 md:p-6"
    >
      <h3 className="text-sm uppercase tracking-widest text-white/50 mb-4 flex items-center gap-2">
        <Atom className="w-4 h-4" />
        System Thresholds
      </h3>
      
      <ul className="space-y-2 text-white/60 text-sm">
        <li className="flex items-start gap-2">
          <span className="text-[#D4AF37]">▸</span>
          Anti-entropy mechanism monitors anomalous gravity wells
        </li>
        <li className="flex items-start gap-2">
          <span className="text-[#D4AF37]">▸</span>
          High-mass observer consensus threshold triggers "Truth Collapse"
        </li>
        <li className="flex items-start gap-2">
          <span className="text-[#D4AF37]">▸</span>
          Liquidity collapse model ensures information orbit stability
        </li>
      </ul>
    </motion.div>

    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
      className="text-center text-white/30 text-xs italic"
    >
      Genesis Protocol • 100 Sovereign Nodes • Founding Architects Only
    </motion.p>
  </div>
);

const PrivateAccess = () => {
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showManifesto, setShowManifesto] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(8);
  const [isExiting, setIsExiting] = useState(false);
  const navigate = useNavigate();

  // Handle smooth navigation with exit animation
  const smoothNavigate = (path: string, delay: number = 800) => {
    setIsExiting(true);
    setTimeout(() => {
      navigate(path);
    }, delay);
  };

  useEffect(() => {
    if (showManifesto && redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (showManifesto && redirectCountdown === 0) {
      smoothNavigate("/");
    }
  }, [showManifesto, redirectCountdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim()) {
      toast.error("Please enter an access code");
      return;
    }

    setIsVerifying(true);
    
    try {
      const normalizedCode = code.trim().toUpperCase();

      const { data, error } = await supabase.functions.invoke("verify-access-code", {
        body: { code: normalizedCode, context: "private" },
      });

      if (error) throw error;

      if (data?.valid) {
        setIsUnlocked(true);
        toast.success("Access granted. Welcome to the inner circle.");
        
        // Store access in session
        sessionStorage.setItem("private_access_granted", "true");
        sessionStorage.setItem("access_code_used", normalizedCode);
        
        if (data.route) {
          smoothNavigate(data.route, 1200);
          return;
        }
        
        // Show manifesto after brief success animation
        setTimeout(() => {
          setShowManifesto(true);
        }, 1200);
      } else {
        toast.error("Invalid access code");
        setIsVerifying(false);
      }
    } catch (err) {
      console.error("Access code verification failed:", err);
      toast.error("Verification error. Please try again.");
      setIsVerifying(false);
    }
  };

  return (
    <motion.div 
      className="min-h-screen bg-black flex items-center justify-center p-4 overflow-hidden"
      animate={{ opacity: isExiting ? 0 : 1, scale: isExiting ? 1.02 : 1 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      {/* Background subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-950 to-black" />
      
      {/* Floating particles effect - enhanced cosmic density when showing manifesto */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Primary particles - small stars */}
        {[...Array(showManifesto ? 60 : 20)].map((_, i) => (
          <motion.div
            key={`star-${i}`}
            className={`absolute rounded-full ${showManifesto ? 'bg-[#D4AF37]' : 'bg-white/20'}`}
            style={{
              width: Math.random() * 2 + 1,
              height: Math.random() * 2 + 1,
            }}
            initial={{ 
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000), 
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
              opacity: 0,
              scale: 0
            }}
            animate={{ 
              y: [null, Math.random() * -300 - 100],
              opacity: [0, showManifesto ? 0.6 : 0.4, 0],
              scale: [0, 1, 0.5]
            }}
            transition={{ 
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 3
            }}
          />
        ))}
        
        {/* Secondary particles - larger glowing orbs (only in manifesto mode) */}
        {showManifesto && [...Array(15)].map((_, i) => (
          <motion.div
            key={`orb-${i}`}
            className="absolute rounded-full bg-[#D4AF37]/20 blur-sm"
            style={{
              width: Math.random() * 6 + 4,
              height: Math.random() * 6 + 4,
            }}
            initial={{ 
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000), 
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
              opacity: 0
            }}
            animate={{ 
              y: [null, Math.random() * -400 - 100],
              x: [null, (Math.random() - 0.5) * 100],
              opacity: [0, 0.5, 0],
              scale: [0.5, 1.2, 0.8]
            }}
            transition={{ 
              duration: 6 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          />
        ))}
        
        {/* Tertiary particles - cosmic dust (only in manifesto mode) */}
        {showManifesto && [...Array(30)].map((_, i) => (
          <motion.div
            key={`dust-${i}`}
            className="absolute w-[1px] h-[1px] bg-white/40"
            initial={{ 
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000), 
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
              opacity: 0
            }}
            animate={{ 
              y: [null, Math.random() * -200],
              opacity: [0, 0.8, 0]
            }}
            transition={{ 
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 4
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {!isUnlocked ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 w-full max-w-md"
          >
            {/* Lock icon */}
            <motion.div
              className="flex justify-center mb-8"
              animate={{ 
                rotateY: isVerifying ? 360 : 0 
              }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            >
              <div className="w-20 h-20 rounded-full border border-white/20 flex items-center justify-center bg-white/5 backdrop-blur-sm">
                <Lock className="w-8 h-8 text-white/60" />
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1 
              className="text-center text-2xl md:text-3xl font-serif text-white/90 mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Private Access
            </motion.h1>
            
            <motion.p 
              className="text-center text-white/40 mb-8 font-light"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              This page is invitation-only
            </motion.p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Input
                  type="text"
                  placeholder="Enter your access code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/30 text-center text-lg tracking-widest h-14 transition-all duration-300 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 focus:ring-2 focus:shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                  disabled={isVerifying}
                  autoFocus
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  type="submit"
                  disabled={isVerifying || !code.trim()}
                  className="w-full h-12 bg-gradient-to-r from-[#D4AF37] via-[#F5D998] to-[#D4AF37] text-black font-medium tracking-wide transition-all duration-300 disabled:opacity-30 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:scale-[1.02] border-0"
                >
                  {isVerifying ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full"
                    />
                  ) : (
                    <>
                      Verify Access
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </>
                  )}
                </Button>
              </motion.div>
            </form>

            {/* Footer note */}
            <motion.p 
              className="text-center text-white/20 text-sm mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Access codes are case-insensitive
            </motion.p>
          </motion.div>
        ) : showManifesto ? (
          <motion.div
            key="manifesto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="relative z-10 w-full max-w-3xl px-4 py-8 overflow-y-auto max-h-[90vh]"
          >
            {/* Rotating Nebula Background */}
            <motion.div
              className="absolute inset-0 -z-10 overflow-hidden rounded-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 1 }}
            >
              {/* Primary nebula layer */}
              <motion.div
                className="absolute inset-[-50%] w-[200%] h-[200%]"
                animate={{ rotate: 360 }}
                transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
                style={{
                  background: `
                    radial-gradient(ellipse at 30% 20%, rgba(212, 175, 55, 0.08) 0%, transparent 50%),
                    radial-gradient(ellipse at 70% 80%, rgba(139, 69, 19, 0.06) 0%, transparent 45%),
                    radial-gradient(ellipse at 50% 50%, rgba(75, 0, 130, 0.04) 0%, transparent 60%)
                  `,
                }}
              />
              {/* Secondary nebula layer - counter rotation */}
              <motion.div
                className="absolute inset-[-30%] w-[160%] h-[160%]"
                animate={{ rotate: -360 }}
                transition={{ duration: 180, repeat: Infinity, ease: "linear" }}
                style={{
                  background: `
                    radial-gradient(ellipse at 60% 30%, rgba(212, 175, 55, 0.05) 0%, transparent 40%),
                    radial-gradient(ellipse at 20% 70%, rgba(148, 103, 189, 0.04) 0%, transparent 50%)
                  `,
                }}
              />
              {/* Subtle vignette overlay */}
              <div 
                className="absolute inset-0"
                style={{
                  background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
                }}
              />
            </motion.div>
            
            <ManifestoContent />
            
            {/* Redirect countdown */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-center mt-8"
            >
              <p className="text-white/30 text-sm">
                Entering the experience in {redirectCountdown}s...
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => smoothNavigate("/")}
                className="mt-2 text-[#D4AF37]/60 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10"
              >
                Enter Now →
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="relative z-10 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="flex justify-center mb-6"
            >
              <div className="w-24 h-24 rounded-full border border-[#D4AF37]/30 flex items-center justify-center bg-[#D4AF37]/10">
                <Sparkles className="w-10 h-10 text-[#D4AF37]" />
              </div>
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-2xl font-serif text-white mb-2"
            >
              Welcome, Insider
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-white/40"
            >
              Initiating Protocol...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PrivateAccess;
