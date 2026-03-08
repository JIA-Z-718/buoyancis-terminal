import { useEffect, useRef } from "react";

const ScrollProgressBar = () => {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let rafId: number;
    const handleScroll = () => {
      // Use rAF to avoid excessive style recalcs — no React state needed
      rafId = requestAnimationFrame(() => {
        if (!barRef.current) return;
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        barRef.current.style.width = `${scrollPercent}%`;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="fixed top-16 left-0 right-0 z-50 h-1 bg-border/20">
      <div
        ref={barRef}
        className="h-full bg-gradient-to-r from-primary to-primary/70 shadow-sm"
        style={{ width: "0%", willChange: "width" }}
      />
    </div>
  );
};

export default ScrollProgressBar;
