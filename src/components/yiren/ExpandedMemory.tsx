import { motion } from "framer-motion";
import type { GalleryMemory } from "./galleryData";

interface ExpandedMemoryProps {
  memory: GalleryMemory | null;
  onClose: () => void;
}

const ExpandedMemory = ({ memory, onClose }: ExpandedMemoryProps) => {
  if (!memory) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/95"
        initial={{ backdropFilter: "blur(0px)" }}
        animate={{ backdropFilter: "blur(20px)" }}
        transition={{ duration: 0.8 }}
      />

      {/* Expanded image */}
      <motion.div
        className="relative z-10"
        initial={{ scale: 0.3, opacity: 0, rotateY: -30 }}
        animate={{ scale: 1, opacity: 1, rotateY: 0 }}
        exit={{ scale: 0.3, opacity: 0, rotateY: 30 }}
        transition={{ type: "spring", stiffness: 100, damping: 15, mass: 1.5 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gravitational lens effect */}
        <motion.div
          className="absolute -inset-20 rounded-full opacity-30"
          style={{
            background:
              "radial-gradient(circle, rgba(212,175,55,0.3) 0%, rgba(52,211,153,0.1) 30%, transparent 60%)",
          }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Frame */}
        <div className="border-4 border-[#d4af37]/50 bg-black p-4 shadow-[0_0_100px_rgba(212,175,55,0.3)]">
          <img
            src={memory.src}
            alt={memory.alt}
            className="w-[70vw] max-w-2xl h-auto object-contain"
          />
        </div>

        {/* Caption */}
        <motion.div
          className="text-center mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-[#d4af37] text-2xl font-light">{memory.caption}</p>
          <p className="text-white/50 text-lg font-light mt-2">{memory.captionEn}</p>
        </motion.div>

        {/* Close hint */}
        <motion.p
          className="text-white/30 text-sm text-center mt-8 font-mono"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          [ click anywhere to close ]
        </motion.p>
      </motion.div>
    </motion.div>
  );
};

export default ExpandedMemory;
