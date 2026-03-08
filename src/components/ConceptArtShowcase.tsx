import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Maximize2, Pause, Play, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { smoothScrollTo } from "@/lib/smoothScroll";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import displacedIdolGreen from "@/assets/displaced-idol-concept.jpg";
import displacedIdolRed from "@/assets/displaced-idol-red-glitch.jpg";
import displacedIdolDual from "@/assets/displaced-idol-dual-glitch.jpg";
import displacedIdolShattered from "@/assets/displaced-idol-shattered.jpg";
import displacedIdolExploded from "@/assets/displaced-idol-exploded.jpg";
import displacedIdolZigzag from "@/assets/displaced-idol-zigzag.jpg";
import displacedIdolGolden from "@/assets/displaced-idol-golden.jpg";
import displacedIdolIceBlue from "@/assets/displaced-idol-ice-blue.jpg";
import displacedIdolNeonPurple from "@/assets/displaced-idol-neon-purple.jpg";
import displacedIdolNoir from "@/assets/displaced-idol-noir.jpg";

interface ConceptImage {
  src: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
}

const conceptImages: ConceptImage[] = [
  {
    src: displacedIdolGreen,
    title: "錯位的偶像 — 綠色系統",
    titleEn: "The Displaced Idol — Green System",
    description: "經驗的外殼被切開，露出底層的代碼邏輯。螢光綠代表系統運行中的數據流。",
    descriptionEn: "The shell of experience is cut open, revealing the underlying code logic. Fluorescent green represents the data flow within the running system.",
  },
  {
    src: displacedIdolRed,
    title: "錯位的偶像 — 紅色警示",
    titleEn: "The Displaced Idol — Red Alert",
    description: "錯誤紅光效暗示系統崩潰的臨界狀態，經驗暴政正在瓦解。",
    descriptionEn: "The red error glow signals a critical state of system collapse—the tyranny of experience is crumbling.",
  },
  {
    src: displacedIdolDual,
    title: "錯位的偶像 — 雙色衝突",
    titleEn: "The Displaced Idol — Dual Conflict",
    description: "紅與綠的視覺衝突，象徵系統與錯誤、秩序與熵增之間的永恆張力。",
    descriptionEn: "The visual clash of red and green symbolizes the eternal tension between system and error, order and entropy.",
  },
  {
    src: displacedIdolShattered,
    title: "錯位的偶像 — 極端解構",
    titleEn: "The Displaced Idol — Extreme Deconstruction",
    description: "雕像被徹底切片解構，臉部特徵散落，內部電路板完全暴露。",
    descriptionEn: "The statue is thoroughly sliced and deconstructed—facial features scattered, internal circuit boards fully exposed.",
  },
  {
    src: displacedIdolExploded,
    title: "錯位的偶像 — 崩解",
    titleEn: "The Displaced Idol — Exploded",
    description: "碎片向外爆發擴散，形成粒子化的視覺效果，象徵舊權威的徹底瓦解。",
    descriptionEn: "Fragments burst outward in a particulate visual effect, symbolizing the complete dissolution of old authority.",
  },
  {
    src: displacedIdolZigzag,
    title: "錯位的偶像 — 水平切片",
    titleEn: "The Displaced Idol — Horizontal Slices",
    description: "正面視角多層掃描線切割，如同系統逐行讀取並解析經驗的結構。",
    descriptionEn: "Multi-layered scanline cuts from a frontal view, as if the system reads and parses the structure of experience line by line.",
  },
  {
    src: displacedIdolGolden,
    title: "錯位的偶像 — 金色暖光",
    titleEn: "The Displaced Idol — Golden Warmth",
    description: "溫暖的琥珀金光芒從裂縫中散發，象徵古典智慧的餘暉與數位時代的交融。",
    descriptionEn: "Warm amber-gold light emanates from the cracks, symbolizing the afterglow of classical wisdom merging with the digital age.",
  },
  {
    src: displacedIdolIceBlue,
    title: "錯位的偶像 — 冰藍冷光",
    titleEn: "The Displaced Idol — Ice Blue",
    description: "冰冷的青藍光芒與霜凍效果，象徵理性與冷酷的系統邏輯。",
    descriptionEn: "Icy cyan-blue glow with frost effects, symbolizing rationality and the cold logic of systems.",
  },
  {
    src: displacedIdolNeonPurple,
    title: "錯位的偶像 — 霓虹紫",
    titleEn: "The Displaced Idol — Neon Purple",
    description: "賽博朋克的霓虹紫光與電漿效果，象徵數位時代的虛擬幻象。",
    descriptionEn: "Cyberpunk neon purple light with plasma effects, symbolizing the virtual illusions of the digital age.",
  },
  {
    src: displacedIdolNoir,
    title: "錯位的偶像 — 黑白電影",
    titleEn: "The Displaced Idol — Film Noir",
    description: "經典黑白電影質感，高對比的光影呈現永恆的藝術張力。",
    descriptionEn: "Classic black-and-white film aesthetic with high-contrast lighting, presenting timeless artistic tension.",
  },
];

// Glitch text animation component
const GlitchText = ({ text, className }: { text: string; className?: string }) => {
  const [glitchActive, setGlitchActive] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 150);
    }, 4000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className={`relative inline-block ${className}`}>
      <span className={glitchActive ? "animate-glitch-text" : ""}>{text}</span>
      {glitchActive && (
        <>
          <span className="absolute top-0 left-0 text-red-500/70 animate-glitch-1" aria-hidden>
            {text}
          </span>
          <span className="absolute top-0 left-0 text-cyan-500/70 animate-glitch-2" aria-hidden>
            {text}
          </span>
        </>
      )}
    </span>
  );
};

// Scanline overlay effect - simplified with CSS only
const ScanlineOverlay = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    <div 
      className="absolute inset-0 opacity-30"
      style={{
        background: 'linear-gradient(transparent 50%, rgba(0,0,0,0.02) 50%)',
        backgroundSize: '100% 4px',
      }}
    />
  </div>
);

// Floating particles - reduced count and using CSS animations
const FloatingParticles = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {[...Array(6)].map((_, i) => (
      <div
        key={i}
        className="absolute w-1 h-1 bg-primary/30 rounded-full"
        style={{
          left: `${15 + i * 15}%`,
          animation: `floatUp ${8 + i * 2}s linear infinite`,
          animationDelay: `${i * 1.5}s`,
        }}
      />
    ))}
    <style>{`
      @keyframes floatUp {
        0% { bottom: -5%; opacity: 0; }
        10% { opacity: 0.6; }
        90% { opacity: 0.6; }
        100% { bottom: 105%; opacity: 0; }
      }
    `}</style>
  </div>
);

const ConceptArtShowcase = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [direction, setDirection] = useState(1); // 1 for next, -1 for prev
  const [isSwiping, setIsSwiping] = useState(false);
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);

  // Haptic feedback for mobile swipes
  const triggerHaptic = useCallback(() => {
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, []);

  const nextImage = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % conceptImages.length);
    if (isMobile) {
      setIsAutoPlaying(false);
      triggerHaptic();
    }
  }, [isMobile, triggerHaptic]);

  const prevImage = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + conceptImages.length) % conceptImages.length);
    if (isMobile) {
      setIsAutoPlaying(false);
      triggerHaptic();
    }
  }, [isMobile, triggerHaptic]);

  // Use swipe gesture hook for better touch experience
  useSwipeGesture(containerRef, {
    onSwipeLeft: nextImage,
    onSwipeRight: prevImage,
    threshold: 50,
    preventScroll: true,
  });

  // Auto-play functionality - 8 second interval for slower Ken Burns
  useEffect(() => {
    if (!isAutoPlaying || isHovering || isSwiping) return;
    
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % conceptImages.length);
    }, 8000);

    return () => clearInterval(timer);
  }, [isAutoPlaying, isHovering, isSwiping]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if this section is in view and no dialog/modal is open
      const section = document.querySelector('[data-concept-showcase]');
      if (!section) return;
      
      const rect = section.getBoundingClientRect();
      const isInView = rect.top < window.innerHeight && rect.bottom > 0;
      
      // Check if a modal or dialog is open
      const hasOpenModal = document.querySelector('[role="dialog"]');
      if (hasOpenModal) return;
      
      if (!isInView) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevImage();
        setIsAutoPlaying(false);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextImage();
        setIsAutoPlaying(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextImage, prevImage]);

  const goToImage = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
    if (isMobile) {
      setIsAutoPlaying(false);
      triggerHaptic();
    }
  };

  const currentImage = conceptImages[currentIndex];

  // Simplified slide variants - removed expensive filter animations
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 60 : -60,
      opacity: 0,
      scale: 1.02,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -60 : 60,
      opacity: 0,
      scale: 0.98,
    }),
  };

  // Text stagger animation variants
  const textContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.2,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1,
      },
    },
  };

  const textItemVariants = {
    hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
    visible: { 
      opacity: 1, 
      y: 0, 
      filter: "blur(0px)",
      transition: { duration: 0.5, ease: "easeOut" as const }
    },
    exit: { 
      opacity: 0, 
      y: -10, 
      filter: "blur(4px)",
      transition: { duration: 0.3, ease: "easeIn" as const }
    },
  };

  const scrollToHero = () => {
    const heroSection = document.querySelector('#hero-section');
    if (heroSection) {
      heroSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <motion.section 
      data-concept-showcase
      className="min-h-screen flex flex-col justify-center bg-background relative overflow-hidden pt-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
    >
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          background: [
            "radial-gradient(ellipse at 20% 50%, hsl(var(--primary) / 0.05) 0%, transparent 50%)",
            "radial-gradient(ellipse at 80% 50%, hsl(var(--primary) / 0.05) 0%, transparent 50%)",
            "radial-gradient(ellipse at 20% 50%, hsl(var(--primary) / 0.05) 0%, transparent 50%)",
          ],
        }}
        transition={{ opacity: { duration: 1.5, delay: 0.3 }, background: { duration: 10, repeat: Infinity, ease: "easeInOut" } }}
      />
      
      <FloatingParticles />
      
      <div className="container mx-auto px-4 relative z-10 flex-1 flex flex-col justify-center">
        {/* Section header with glitch effect - more compact */}
        <motion.div
          initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center mb-6 md:mb-8"
        >
          <motion.span 
            className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-2 block font-sans"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ opacity: { duration: 3, repeat: Infinity, delay: 1 } }}
          >
            Visual Concept
          </motion.span>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif text-foreground mb-2">
            <GlitchText text="錯位的偶像" />
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto font-sans">
            The Displaced Idol
          </p>
        </motion.div>

        {/* Image carousel - larger and more prominent */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative max-w-6xl mx-auto w-full"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {/* Main image container - optimized for mobile with swipe gestures */}
          <div 
            ref={containerRef}
            className="relative aspect-[4/5] sm:aspect-[16/10] md:aspect-[21/9] rounded-lg overflow-hidden bg-muted/30 border border-border/50 shadow-2xl group cursor-grab active:cursor-grabbing"
            onTouchStart={() => setIsSwiping(true)}
            onTouchEnd={() => setIsSwiping(false)}
          >
            <motion.div
              className="absolute inset-0"
              whileHover={{ scale: isMobile ? 1 : 1.005 }}
              transition={{ duration: 0.3 }}
            >
              <ScanlineOverlay />
              
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentIndex}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ 
                    duration: 0.5, 
                    ease: [0.4, 0, 0.2, 1],
                  }}
                  className="w-full h-full"
                >
                  {/* Ken Burns effect using CSS animation for better performance */}
                  <img
                    src={currentImage.src}
                    alt={currentImage.title}
                    className="w-full h-full object-cover pointer-events-none"
                    loading="lazy"
                    decoding="async"
                    style={{
                      animation: 'kenBurns 8s ease-out forwards',
                    }}
                  />
                  <style>{`
                    @keyframes kenBurns {
                      from { transform: scale(1.04) translate(-0.5%, -0.25%); }
                      to { transform: scale(1) translate(0.25%, 0.125%); }
                    }
                  `}</style>
                </motion.div>
              </AnimatePresence>

              {/* Hover glow effect */}
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500"
                style={{
                  background: "radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), hsl(var(--primary) / 0.15) 0%, transparent 50%)",
                }}
              />
            </motion.div>

            {/* Image overlay with animated title - optimized for mobile */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-4 sm:p-6 md:p-8 z-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  variants={textContainerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-2"
                >
                  {/* Chinese title */}
                  <motion.h3 
                    variants={textItemVariants}
                    className="text-white text-base sm:text-lg md:text-xl font-serif line-clamp-1"
                  >
                    {currentImage.title}
                  </motion.h3>
                  {/* Chinese description */}
                  <motion.p 
                    variants={textItemVariants}
                    className="text-white/80 text-xs sm:text-sm font-sans line-clamp-2"
                  >
                    {currentImage.description}
                  </motion.p>
                  {/* Separator with animation */}
                  <motion.div 
                    variants={textItemVariants}
                    className="h-px bg-white/30 my-1 origin-left"
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1, width: "4rem" }}
                    transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                  />
                  {/* English description */}
                  <motion.p 
                    variants={textItemVariants}
                    className="text-white/60 text-xs sm:text-sm font-sans italic line-clamp-2"
                  >
                    {currentImage.descriptionEn}
                  </motion.p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Control buttons - visible on mobile */}
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex gap-2 z-10">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                className={`bg-black/50 hover:bg-black/70 text-white h-8 w-8 sm:h-10 sm:w-10 ${isMobile ? 'opacity-80' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
              >
                {isAutoPlaying ? <Pause className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`bg-black/50 hover:bg-black/70 text-white h-8 w-8 sm:h-10 sm:w-10 ${isMobile ? 'opacity-80' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
                  >
                    <Maximize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black border-none">
                  <img
                    src={currentImage.src}
                    alt={currentImage.title}
                    className="w-full h-full object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </DialogContent>
              </Dialog>
            </div>

            {/* Navigation arrows - always visible on mobile */}
            {!isMobile && (
              <>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: isHovering ? 1 : 0, x: isHovering ? 0 : -20 }}
                  transition={{ duration: 0.3 }}
                  className="z-10"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 hover:scale-110 text-white transition-transform"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: isHovering ? 1 : 0, x: isHovering ? 0 : 20 }}
                  transition={{ duration: 0.3 }}
                  className="z-10"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 hover:scale-110 text-white transition-transform"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </motion.div>
              </>
            )}

            {/* Mobile swipe hint - show briefly */}
            {isMobile && (
              <motion.div
                className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 text-white/60 text-xs font-sans pointer-events-none z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1, 0] }}
                transition={{ duration: 3, times: [0, 0.1, 0.8, 1], delay: 1.5 }}
              >
                <ChevronLeft className="h-3 w-3" />
                <span>滑動切換</span>
                <ChevronRight className="h-3 w-3" />
              </motion.div>
            )}

            {/* Progress bar for auto-play */}
            {isAutoPlaying && !isHovering && !isSwiping && (
              <motion.div
                className="absolute bottom-0 left-0 h-1 bg-primary/80 z-20"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 5, ease: "linear" }}
                key={currentIndex}
              />
            )}
          </div>

          {/* Dot indicators for mobile, thumbnails for desktop */}
          {isMobile ? (
            <div className="flex justify-center gap-2 mt-4">
              {conceptImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToImage(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? "bg-primary w-6"
                      : "bg-muted-foreground/30"
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          ) : (
            <div className="flex justify-center gap-3 mt-6">
              {conceptImages.map((img, index) => (
                <motion.button
                  key={index}
                  onClick={() => goToImage(index)}
                  className={`relative overflow-hidden rounded-md transition-all duration-300 ${
                    index === currentIndex
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                      : "opacity-50 hover:opacity-80"
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={`View ${img.title}`}
                >
                  <img
                    src={img.src}
                    alt={img.title}
                    className="w-16 h-10 md:w-20 md:h-12 object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  {index === currentIndex && (
                    <motion.div
                      className="absolute inset-0 border-2 border-primary rounded-md"
                      layoutId="activeThumb"
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </motion.button>
              ))}
            </div>
          )}

          {/* Compact terminal-style annotation - hidden on mobile */}
          {!isMobile && (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-4 text-center"
            >
              <motion.code 
                className="text-xs text-muted-foreground/50 font-mono inline-flex items-center gap-2"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="inline-block w-1.5 h-1.5 bg-primary/50 rounded-full animate-pulse" />
                System: Buyanxis v1.0 | Status: Entropy Critical
              </motion.code>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Scroll down indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
      >
        <motion.button
          onClick={scrollToHero}
          className="flex flex-col items-center gap-2 text-muted-foreground/60 hover:text-muted-foreground transition-colors group"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-xs uppercase tracking-widest font-sans">Explore</span>
          <ChevronDown className="w-5 h-5 group-hover:text-primary transition-colors" />
        </motion.button>
      </motion.div>
    </motion.section>
  );
};

export default ConceptArtShowcase;
