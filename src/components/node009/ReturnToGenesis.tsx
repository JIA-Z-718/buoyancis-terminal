import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";

const ReturnToGenesis = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Show when mouse is in top-left corner (within 100px)
      const inCorner = e.clientX < 100 && e.clientY < 100;
      setIsVisible(inCorner);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleReturn = () => {
    window.location.href = "/gateway";
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          onClick={handleReturn}
          style={{
            position: "fixed",
            top: "24px",
            left: "24px",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 16px",
            background: "rgba(10,10,10,0.8)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "4px",
            color: "rgba(255,255,255,0.6)",
            fontSize: "11px",
            letterSpacing: "0.15em",
            fontFamily: "ui-monospace, SFMono-Regular, monospace",
            cursor: "pointer",
            backdropFilter: "blur(10px)",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(183,110,121,0.5)";
            e.currentTarget.style.color = "#B76E79";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
            e.currentTarget.style.color = "rgba(255,255,255,0.6)";
          }}
        >
          <ArrowLeft size={14} />
          RETURN TO GENESIS
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default ReturnToGenesis;
