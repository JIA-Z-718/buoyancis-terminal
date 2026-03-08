import React, { useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { saveUnlockedNode } from "@/lib/genesisNodes";

// Lazy-load page components rendered inside the gateway
const RickardNode = lazy(() => import("@/pages/RickardNode"));
const Node003Rick = lazy(() => import("@/pages/Node003Rick"));
const Node010 = lazy(() => import("@/pages/Node010"));
const DonnieNode = lazy(() => import("@/pages/DonnieNode"));
const Node009Gallery = lazy(() => import("@/components/node009/Node009Gallery"));

const GatewayFallback = () => (
  <div className="fixed inset-0 bg-black flex items-center justify-center">
    <motion.div
      animate={{ opacity: [0.3, 1, 0.3] }}
      transition={{ duration: 1.5, repeat: Infinity }}
      className="text-slate-500 text-xs tracking-[0.3em] font-mono"
    >
      LOADING NODE...
    </motion.div>
  </div>
);

type GatewayPhase =
  | "gateway"
  | "timelock"
  | "collapse"
  | "revealed"
  | "node003"
  | "node003rick"
  | "node010"
  | "node011";

const GenesisGateway = () => {
  const [phase, setPhase] = useState<GatewayPhase>("gateway");
  const [code, setCode] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState(false);
  const [showDenied, setShowDenied] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleInputFocus = () => {
    setTimeout(() => {
      inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
  };

  const showErrorFlash = () => {
    setShowDenied(true);
    setError(true);
    setTimeout(() => {
      setError(false);
      setShowDenied(false);
    }, 2000);
  };

  const handleGateway = (e: React.FormEvent) => {
    e.preventDefault();
    const v = code.trim().toLowerCase().replace(/[^a-z-]/g, "");

    // Node #009 codes -> timelock
    if (v === "east-west-bridge" || v === "family-legacy") {
      saveUnlockedNode("node009");
      setPhase("timelock");
      setCode("");
    }
    // Node #003 Rickard Öste
    else if (v === "post-milk-generation") {
      saveUnlockedNode("node003rickard");
      setPhase("node003");
      setCode("");
    }
    // Node #003 Rick (Infrastructure / Father)
    else if (v === "legacy-foundation") {
      saveUnlockedNode("node003");
      setPhase("node003rick");
      setCode("");
    }
    // Node #010 Johan (Runtime)
    else if (
      v === "runtime-check-passed" ||
      v === "kth-distributed" ||
      v === "no-hot-air"
    ) {
      saveUnlockedNode("node010");
      setPhase("node010");
      setCode("");
    }
    // Node #010 (Sanctuary / Calibration) direct entry
    else if (v === "exhale-to-evolve") {
      try {
        sessionStorage.setItem("node010_autounlock", "1");
        sessionStorage.setItem("node010_initial_mode", "calibration");
      } catch {
        /* ignore */
      }
      saveUnlockedNode("node010");
      setPhase("node010");
      setCode("");
    }
    // Node #011 Donnie
    else if (v === "construct-over-console") {
      saveUnlockedNode("node011");
      setPhase("node011");
      setCode("");
    }
    // DEBUG OVERRIDE for Node #011
    else if (v === "sudo-donnie") {
      try {
        localStorage.removeItem("node009_memory_unlocked");
      } catch {
        /* ignore */
      }
      saveUnlockedNode("node011");
      setPhase("node011");
      setCode("");
    }
    // Node #011 legacy aliases
    else if (v === "stability-protocol" || v === "donnie-moonshot") {
      saveUnlockedNode("node011");
      setPhase("node011");
      setCode("");
    } else {
      showErrorFlash();
    }
  };

  const handleTimelock = (e: React.FormEvent) => {
    e.preventDefault();
    const d = date.replace(/\D/g, "");
    if (d === "19710824") {
      setPhase("collapse");
      setTimeout(() => setPhase("revealed"), 2000);
    } else {
      showErrorFlash();
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/genesis/login");
  };

  // ── Phase: Gateway Terminal ──────────────────────────────
  if (phase === "gateway") {
    return (
      <div
        className="fixed inset-0 bg-black flex items-center justify-center font-mono overflow-y-auto"
        style={{ minHeight: "100dvh" }}
      >
        {/* Scanline overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)",
          }}
        />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="absolute top-4 right-4 text-slate-600 text-xs tracking-wider hover:text-slate-400 transition-colors z-20"
          style={{ fontFamily: "'Fira Code', monospace" }}
        >
          [ DISCONNECT ]
        </button>

        {/* Operator info */}
        <div
          className="absolute top-4 left-4 text-slate-600 text-xs tracking-wider z-20"
          style={{ fontFamily: "'Fira Code', monospace" }}
        >
          OPERATOR: {user?.email?.split("@")[0]?.toUpperCase()}
        </div>

        {/* CALIBRATING Glitch Overlay */}
        <AnimatePresence>
          {showDenied && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.9)" }}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{
                  scale: [0.8, 1.02, 1],
                  opacity: 1,
                  x: [0, -5, 5, -3, 3, 0],
                }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                <div
                  className="text-red-500 text-4xl md:text-6xl font-mono tracking-[0.3em] relative"
                  style={{
                    textShadow:
                      "0 0 10px rgba(255,0,0,0.8), 0 0 20px rgba(255,0,0,0.4), 0 0 40px rgba(255,0,0,0.2)",
                    animation: "glitch-text 0.3s infinite",
                  }}
                >
                  CALIBRATING TOOLS...
                </div>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="h-[1px] bg-red-500/50 mt-4 mx-auto"
                  style={{ maxWidth: "400px" }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Terminal */}
        <motion.form
          onSubmit={handleGateway}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center z-10 px-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: 0.3 }}
            className="text-slate-500 text-xs tracking-[0.5em] mb-8"
            style={{ fontFamily: "'Fira Code', monospace" }}
          >
            GENESIS_SYSTEM v1.0
          </motion.div>

          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-3 h-6 bg-slate-400 mx-auto mb-8"
          />

          <div className="relative pb-24 sm:pb-0">
            <input
              ref={inputRef}
              autoFocus
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onFocus={handleInputFocus}
              placeholder="> ENTER ACCESS CODE..."
              className="w-full max-w-md bg-transparent border border-slate-700 text-slate-300 px-6 py-4 text-center tracking-[0.1em] text-lg outline-none focus:border-slate-500 transition-colors placeholder:text-slate-600"
              style={{
                fontFamily: "'Fira Code', monospace",
                boxShadow: error
                  ? "0 0 20px rgba(255,0,0,0.3), inset 0 0 20px rgba(255,0,0,0.1)"
                  : "0 0 30px rgba(100,100,100,0.1)",
              }}
            />
            <motion.div
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -bottom-px left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-slate-500 to-transparent"
            />
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            transition={{ delay: 1 }}
            className="mt-12 text-slate-600 text-[10px] tracking-[0.3em]"
            style={{ fontFamily: "'Fira Code', monospace" }}
          >
            [ AUTHORIZED PERSONNEL ONLY ]
          </motion.div>
        </motion.form>

        <style>{`
          @keyframes glitch-text {
            0%, 100% { transform: translate(0); }
            20% { transform: translate(-2px, 2px); }
            40% { transform: translate(-2px, -2px); }
            60% { transform: translate(2px, 2px); }
            80% { transform: translate(2px, -2px); }
          }
        `}</style>
      </div>
    );
  }

  // ── Phase: Time-Lock (Node #009) ─────────────────────────
  if (phase === "timelock") {
    return (
      <div
        className="fixed inset-0 bg-black flex items-center justify-center font-mono overflow-y-auto"
        style={{ minHeight: "100dvh" }}
      >
        <AnimatePresence>
          {showDenied && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/90"
            >
              <motion.div
                animate={{ x: [0, -5, 5, -3, 3, 0] }}
                transition={{ duration: 0.3 }}
                className="text-red-500 text-4xl font-mono tracking-[0.3em]"
                style={{ textShadow: "0 0 20px rgba(255,0,0,0.5)" }}
              >
                ACCESS DENIED
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.form
          onSubmit={handleTimelock}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <div
            className="text-slate-500 text-xs tracking-[0.4em] mb-4"
            style={{ fontFamily: "'Fira Code', monospace" }}
          >
            TIME-LOCK SEQUENCE
          </div>
          <div
            className="text-slate-400 text-sm tracking-[0.2em] mb-8"
            style={{ fontFamily: "'Fira Code', monospace" }}
          >
            Enter the date of origin
          </div>
          <input
            autoFocus
            type="text"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            placeholder="YYYYMMDD"
            maxLength={8}
            className="w-full max-w-xs bg-transparent border border-slate-700 text-slate-300 px-6 py-4 text-center tracking-[0.2em] text-lg outline-none focus:border-slate-500 transition-colors placeholder:text-slate-600"
            style={{ fontFamily: "'Fira Code', monospace" }}
          />
        </motion.form>
      </div>
    );
  }

  // ── Phase: Gravity Collapse Animation ────────────────────
  if (phase === "collapse") {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="relative w-48 h-48">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 4, opacity: 0 }}
              transition={{ duration: 2, delay: i * 0.4, ease: "easeOut" }}
              className="absolute inset-0 border border-slate-500 rounded-full"
            />
          ))}
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="absolute inset-[40%] bg-slate-400 rounded-full"
          />
        </div>
      </div>
    );
  }

  // ── Phase: Direct node renders ───────────────────────────
  const nodeMap: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
    node003: RickardNode,
    node003rick: Node003Rick,
    node010: Node010,
    node011: DonnieNode,
  };

  const NodeComponent = nodeMap[phase];
  if (NodeComponent) {
    return (
      <Suspense fallback={<GatewayFallback />}>
        <NodeComponent />
      </Suspense>
    );
  }

  // Default: Node 009 Gallery (phase === "revealed")
  return (
    <Suspense fallback={<GatewayFallback />}>
      <Node009Gallery />
    </Suspense>
  );
};

export default GenesisGateway;
