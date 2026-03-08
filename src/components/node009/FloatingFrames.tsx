import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Frame {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  delay: number;
}

const frames: Frame[] = [
  { id: 1, x: -25, y: -20, rotation: -8, scale: 0.9, delay: 0 },
  { id: 2, x: 25, y: -15, rotation: 5, scale: 0.85, delay: 0.1 },
  { id: 3, x: -30, y: 18, rotation: -3, scale: 0.8, delay: 0.2 },
  { id: 4, x: 28, y: 22, rotation: 7, scale: 0.75, delay: 0.3 },
  { id: 5, x: 0, y: 30, rotation: 0, scale: 0.7, delay: 0.4 },
];

interface FloatingFramesProps {
  isVisible: boolean;
}

const FloatingFrames = ({ isVisible }: FloatingFramesProps) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Overlay when expanded */}
          <AnimatePresence>
            {expandedId !== null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setExpandedId(null)}
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(5,5,5,0.85)",
                  zIndex: 40,
                }}
              />
            )}
          </AnimatePresence>

          {frames.map((frame) => {
            const isExpanded = expandedId === frame.id;
            
            return (
              <motion.div
                key={frame.id}
                initial={{ 
                  opacity: 0, 
                  scale: 0,
                  x: 0,
                  y: 0,
                }}
                animate={{ 
                  opacity: 1, 
                  scale: isExpanded ? 1.5 : frame.scale,
                  x: isExpanded ? 0 : `${frame.x}vw`,
                  y: isExpanded ? 0 : `${frame.y}vh`,
                  rotate: isExpanded ? 0 : frame.rotation,
                  zIndex: isExpanded ? 50 : 30,
                }}
                transition={{ 
                  delay: isExpanded ? 0 : frame.delay + 0.3,
                  duration: 0.8, 
                  type: "spring",
                  stiffness: 100,
                  damping: 15,
                }}
                onClick={() => setExpandedId(isExpanded ? null : frame.id)}
                style={{
                  position: "fixed",
                  left: "50%",
                  top: "50%",
                  cursor: "pointer",
                  transformOrigin: "center center",
                }}
              >
                {/* Shatter particle effect on appear */}
                <motion.div
                  initial={{ opacity: 1, scale: 1 }}
                  animate={{ opacity: 0, scale: 2 }}
                  transition={{ delay: frame.delay + 0.3, duration: 0.5 }}
                  style={{
                    position: "absolute",
                    inset: "-20px",
                    border: "1px solid rgba(255,255,255,0.3)",
                    borderRadius: "4px",
                    pointerEvents: "none",
                  }}
                />

                {/* Frame container */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  style={{
                    width: "180px",
                    height: "240px",
                    background: "linear-gradient(145deg, rgba(20,20,20,0.9) 0%, rgba(10,10,10,0.95) 100%)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "4px",
                    padding: "12px",
                    boxShadow: isExpanded
                      ? "0 40px 80px rgba(0,0,0,0.8), 0 0 60px rgba(255,255,255,0.05)"
                      : "0 20px 40px rgba(0,0,0,0.5)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {/* Placeholder image area */}
                  <div style={{
                    width: "100%",
                    height: "160px",
                    background: "linear-gradient(180deg, rgba(183,110,121,0.1) 0%, rgba(40,40,40,0.5) 100%)",
                    borderRadius: "2px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "12px",
                    overflow: "hidden",
                  }}>
                    <motion.div
                      animate={{ 
                        opacity: [0.3, 0.5, 0.3],
                      }}
                      transition={{ duration: 4, repeat: Infinity }}
                      style={{
                        width: "60px",
                        height: "60px",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: "50%",
                      }}
                    />
                  </div>

                  {/* Caption */}
                  <div style={{
                    textAlign: "center",
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: "11px",
                    color: "rgba(255,255,255,0.5)",
                    letterSpacing: "0.1em",
                  }}>
                    MEMORY #{frame.id}
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </>
      )}
    </AnimatePresence>
  );
};

export default FloatingFrames;
