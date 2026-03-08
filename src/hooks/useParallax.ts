import { useEffect, useState, useRef } from "react";

/**
 * Performant parallax hook — uses rAF debounce to avoid excess re-renders.
 */
export const useParallax = (speed: number = 0.1) => {
  const [offset, setOffset] = useState(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        rafRef.current = requestAnimationFrame(() => {
          setOffset(window.scrollY * speed);
          ticking = false;
        });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [speed]);

  return offset;
};
