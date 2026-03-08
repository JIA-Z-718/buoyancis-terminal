import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import brutalistImage from "@/assets/node010-brutalist-architecture.png";

const terminalLines = [
  { text: "Starting Garbage Collection...", delay: 0 },
  { text: "[SUCCESS] 40MB of 'Hot Air' purged.", delay: 800 },
  { text: "[INFO] Logic flow verified. No memory leaks detected.", delay: 1600 },
  { text: "", delay: 2400 },
  { text: '"Johan,', delay: 3000 },
  { text: "In my life's source code, you are the Compiler.", delay: 3600 },
  { text: "You taught me to strip away the noise and focus on pure structure.", delay: 4200 },
  { text: "Because of your strict runtime checks, this system is now efficient and valid.", delay: 4800 },
  { text: "", delay: 5400 },
  { text: 'Thank you for the tough love and the algorithmic depth."', delay: 6000 },
];

const TypingLine = ({ text, startDelay }: { text: string; startDelay: number }) => {
  const [displayText, setDisplayText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const startTimer = setTimeout(() => {
      setHasStarted(true);
    }, startDelay);

    return () => clearTimeout(startTimer);
  }, [startDelay]);

  useEffect(() => {
    if (!hasStarted || text === "") {
      if (hasStarted && text === "") {
        setIsComplete(true);
      }
      return;
    }

    let index = 0;
    const typeInterval = setInterval(() => {
      if (index < text.length) {
        setDisplayText(text.slice(0, index + 1));
        index++;
      } else {
        setIsComplete(true);
        clearInterval(typeInterval);
      }
    }, 35);

    return () => clearInterval(typeInterval);
  }, [hasStarted, text]);

  if (!hasStarted) return null;

  const isSuccess = text.includes("[SUCCESS]");
  const isInfo = text.includes("[INFO]");
  const isQuote = text.startsWith('"') || text.endsWith('"') || (!text.startsWith("[") && text.length > 0 && !text.includes("..."));

  return (
    <div className="min-h-[1.5rem]">
      <span
        className={
          isSuccess
            ? "text-green-400"
            : isInfo
            ? "text-blue-400"
            : isQuote
            ? "text-white/90 italic"
            : "text-white/70"
        }
      >
        {displayText}
        {!isComplete && <span className="animate-pulse">█</span>}
      </span>
    </div>
  );
};

const MonteliusNode = () => {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    document.title = "Node #010 | Logic Compiler | Buoyancis Genesis";
    window.scrollTo(0, 0);

    // Update time every second
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toISOString().slice(0, 19).replace("T", " "));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black flex flex-col" style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace" }}>
      {/* Hero Image Section */}
      <div className="relative h-[40vh] md:h-[50vh] overflow-hidden">
        <img
          src={brutalistImage}
          alt="Brutalist Architecture"
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          style={{ 
            filter: "grayscale(100%) contrast(125%)",
          }}
        />
        {/* Dark overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black" />
        
        {/* Large 010 overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 0.15, scale: 1 }}
            transition={{ duration: 1 }}
            className="text-[20vw] md:text-[15vw] font-bold text-white tracking-tighter select-none"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            010
          </motion.span>
        </div>
      </div>

      {/* Status Panel */}
      <div className="border-b border-white/20 bg-black">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm"
          >
            <div className="flex gap-2">
              <span className="text-white/50">[NODE_ID:</span>
              <span className="text-green-400">010</span>
              <span className="text-white/50">]</span>
            </div>
            <div className="flex gap-2">
              <span className="text-white/50">[STATUS:</span>
              <span className="text-cyan-400">RUNTIME_OPTIMIZED</span>
              <span className="text-white/50">]</span>
            </div>
            <div className="flex gap-2">
              <span className="text-white/50">[ALGORITHM_COMPLEXITY:</span>
              <span className="text-yellow-400">O(1)</span>
              <span className="text-white/50">]</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Terminal Log Section */}
      <div className="flex-1 bg-black px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-black border border-white/10 rounded-none p-6"
          >
            {/* Terminal Header */}
            <div className="flex items-center gap-2 pb-4 border-b border-white/10 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="ml-4 text-white/40 text-xs">node010@buoyancis:~/genesis</span>
            </div>

            {/* Terminal Content */}
            <div className="space-y-1 text-sm md:text-base leading-relaxed">
              <div className="text-white/50 mb-4">$ ./compile --optimize --strip-noise</div>
              {terminalLines.map((line, index) => (
                <TypingLine key={index} text={line.text} startDelay={line.delay} />
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Vim-Style Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="sticky bottom-0 bg-[#1a1a1a] border-t border-white/10 px-4 py-2"
      >
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between text-xs text-white/70 gap-2">
          <div className="flex items-center gap-4">
            <span className="text-green-400 font-bold">-- NORMAL --</span>
            <span className="text-white/50">|</span>
            <span>Node010.tsx</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-white/40">unix</span>
            <span className="text-white/50">|</span>
            <span className="text-white/40">utf-8</span>
            <span className="text-white/50">|</span>
            <span className="text-cyan-400">100%</span>
            <span className="text-white/50">|</span>
            <span className="text-yellow-400">:wq</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MonteliusNode;
