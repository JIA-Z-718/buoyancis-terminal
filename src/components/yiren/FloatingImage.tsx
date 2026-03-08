import { useState, useEffect } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";
import type { GalleryMemory, FloatingPosition } from "./galleryData";

interface FloatingImageProps {
  memory: GalleryMemory;
  position: FloatingPosition;
  index: number;
  onSelect: (id: number) => void;
  isSelected: boolean;
}

const FloatingImage = ({ memory, position, index, onSelect, isSelected }: FloatingImageProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const floatY = useMotionValue(0);
  const floatX = useMotionValue(0);
  const springY = useSpring(floatY, { stiffness: 20, damping: 10 });
  const springX = useSpring(floatX, { stiffness: 20, damping: 10 });

  useEffect(() => {
    const intervalY = setInterval(() => {
      floatY.set(Math.sin(Date.now() / 2000 + index) * 15);
    }, 50);
    const intervalX = setInterval(() => {
      floatX.set(Math.cos(Date.now() / 3000 + index * 0.5) * 8);
    }, 50);

    return () => {
      clearInterval(intervalY);
      clearInterval(intervalX);
    };
  }, [floatY, floatX, index]);

  return (
    <motion.div
      className="absolute cursor-pointer"
      style={{
        left: `${50 + position.x}%`,
        top: `${50 + position.y}%`,
        translateX: "-50%",
        translateY: "-50%",
        y: springY,
        x: springX,
        zIndex: isHovered || isSelected ? 50 : 10 + index,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: 1,
        scale: isSelected ? 0 : position.scale,
        rotate: position.rotation,
      }}
      transition={{
        delay: index * 0.3 + 0.5,
        duration: 1.2,
        type: "spring",
        stiffness: 100,
        damping: 15,
      }}
      whileHover={{
        scale: position.scale * 1.1,
        rotate: 0,
        transition: { type: "spring", stiffness: 300, damping: 20 },
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onSelect(memory.id)}
    >
      <div className="relative group">
        {/* Outer glow */}
        <div
          className="absolute -inset-4 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: "radial-gradient(circle, rgba(212,175,55,0.2) 0%, transparent 70%)",
          }}
        />

        {/* Frame */}
        <div className="relative border-2 border-[#d4af37]/30 bg-black/80 p-2 backdrop-blur-sm shadow-[0_0_30px_rgba(0,0,0,0.8)] group-hover:border-[#d4af37]/60 transition-all duration-500">
          <img
            src={memory.src}
            alt={memory.alt}
            className="w-48 h-48 md:w-56 md:h-56 object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-700"
            loading="lazy"
            decoding="async"
          />

          {/* Caption overlay */}
          <motion.div
            className="absolute bottom-2 left-2 right-2 bg-black/90 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            initial={{ y: 10 }}
            whileHover={{ y: 0 }}
          >
            <p className="text-[#d4af37] text-sm font-light">{memory.caption}</p>
            <p className="text-white/50 text-xs font-light mt-1">{memory.captionEn}</p>
          </motion.div>
        </div>

        {/* Floating particles around frame */}
        {isHovered && (
          <>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-[#d4af37]/60 rounded-full"
                initial={{ x: 0, y: 0, opacity: 0 }}
                animate={{
                  x: Math.cos(i * 60 * Math.PI / 180) * 80,
                  y: Math.sin(i * 60 * Math.PI / 180) * 80,
                  opacity: [0, 0.8, 0],
                }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                style={{ left: "50%", top: "50%" }}
              />
            ))}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default FloatingImage;
