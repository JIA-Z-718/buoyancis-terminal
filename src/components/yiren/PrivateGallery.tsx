import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { placeholderMemories, floatingPositions } from "./galleryData";
import FloatingImage from "./FloatingImage";
import ExpandedMemory from "./ExpandedMemory";

const PrivateGallery = () => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  const selectedMemory = placeholderMemories.find((m) => m.id === selectedId) || null;

  useEffect(() => {
    const timer = setTimeout(() => setIsRevealed(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="min-h-screen relative overflow-hidden bg-[#000000]">
      {/* Long exposure transition effect */}
      <AnimatePresence>
        {!isRevealed && (
          <motion.div
            className="absolute inset-0 z-50 bg-black"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3, ease: "easeOut" }}
          >
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-px bg-gradient-to-r from-transparent via-[#d4af37]/50 to-transparent"
                style={{ left: 0, right: 0, top: `${(i + 1) * 12}%` }}
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{
                  scaleX: [0, 1.5, 0],
                  opacity: [0, 0.8, 0],
                  x: ["-50%", "100%"],
                }}
                transition={{ duration: 2.5, delay: i * 0.15, ease: "easeInOut" }}
              />
            ))}
            <motion.div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(212,175,55,0.3) 0%, transparent 50%)",
              }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0, 0.6, 0], scale: [0.5, 2, 3] }}
              transition={{ duration: 2.5, ease: "easeOut" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section header */}
      <motion.div
        className="relative z-20 pt-24 pb-8 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: isRevealed ? 1 : 0, y: isRevealed ? 0 : -20 }}
        transition={{ delay: 2.8, duration: 1 }}
      >
        <span className="text-[#d4af37]/60 text-xs tracking-[0.3em] uppercase font-light">
          私人展廳 · Private Gallery
        </span>
        <h2 className="text-3xl md:text-4xl font-light text-white mt-4 tracking-tight">
          <span className="text-emerald-400">記憶</span>的重力場
        </h2>
        <p className="text-white/40 text-sm mt-2 font-light">
          The Gravity Well of Memories
        </p>
      </motion.div>

      {/* Zero-gravity floating gallery */}
      <div className="relative h-[70vh] md:h-[80vh]">
        {/* Ambient particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-0.5 h-0.5 bg-[#d4af37]/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{ y: [0, -30, 0], opacity: [0.1, 0.4, 0.1] }}
              transition={{
                duration: 4 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 4,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        {/* Floating images */}
        {placeholderMemories.map((memory, index) => (
          <FloatingImage
            key={memory.id}
            memory={memory}
            position={floatingPositions[index]}
            index={index}
            onSelect={setSelectedId}
            isSelected={selectedId === memory.id}
          />
        ))}

        {/* Central gravity well */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(52,211,153,0.1) 0%, transparent 70%)",
          }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Expanded view modal */}
      <AnimatePresence>
        {selectedId && (
          <ExpandedMemory memory={selectedMemory} onClose={() => setSelectedId(null)} />
        )}
      </AnimatePresence>

      {/* Bottom hint */}
      <motion.div
        className="relative z-20 pb-16 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: isRevealed ? 1 : 0 }}
        transition={{ delay: 4, duration: 1 }}
      >
        <p className="text-white/30 text-xs font-mono tracking-wider">
          // MEMORIES FLOAT IN ZERO-GRAVITY — CLICK TO EXPAND //
        </p>
      </motion.div>
    </section>
  );
};

export default PrivateGallery;
