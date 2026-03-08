import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface GlowingApertureProps {
  isShattered: boolean;
  onShatter: () => void;
}

const GlowingAperture = ({ isShattered, onShatter }: GlowingApertureProps) => {
  return (
    <AnimatePresence mode="wait">
      {!isShattered && (
        <motion.div
          key="aperture"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ 
            opacity: 0, 
            scale: 3,
            transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
          }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          onClick={onShatter}
          style={{
            position: "fixed",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            cursor: "pointer",
            zIndex: 20,
          }}
        >
          {/* Outer Glow Ring */}
          <motion.div
            animate={{ 
              boxShadow: [
                "0 0 60px rgba(255,255,255,0.1), 0 0 120px rgba(255,255,255,0.05)",
                "0 0 80px rgba(255,255,255,0.15), 0 0 150px rgba(255,255,255,0.08)",
                "0 0 60px rgba(255,255,255,0.1), 0 0 120px rgba(255,255,255,0.05)",
              ]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            style={{
              width: "300px",
              height: "300px",
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 70%)",
            }}
          >
            {/* Inner Ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              style={{
                width: "220px",
                height: "220px",
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Core Ring */}
              <div style={{
                width: "150px",
                height: "150px",
                borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 60%)",
              }}>
                {/* Date Text */}
                <motion.div
                  animate={{ 
                    textShadow: [
                      "0 0 20px rgba(255,255,255,0.3)",
                      "0 0 40px rgba(255,255,255,0.5)",
                      "0 0 20px rgba(255,255,255,0.3)",
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    fontFamily: "'Playfair Display', 'Times New Roman', Georgia, serif",
                    fontSize: "20px",
                    letterSpacing: "0.15em",
                    color: "rgba(255,255,255,0.9)",
                    fontWeight: 300,
                    textAlign: "center",
                  }}
                >
                  1971.08.24
                </motion.div>
              </div>
            </motion.div>
          </motion.div>

          {/* Hover hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: 2, duration: 1 }}
            style={{
              position: "absolute",
              bottom: "-50px",
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: "10px",
              letterSpacing: "0.3em",
              color: "#fff",
              fontFamily: "ui-monospace, SFMono-Regular, monospace",
              whiteSpace: "nowrap",
            }}
          >
            CLICK TO UNVEIL
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GlowingAperture;
