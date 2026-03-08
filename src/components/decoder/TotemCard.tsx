import { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDecoderLanguage } from "@/contexts/DecoderLanguageContext";
import { getConceptByLanguage, getDescriptionByLanguage } from "@/lib/buoyancisDecoder";
import { getLocalizedPhilosophy } from "@/lib/conceptPhilosophy";
import type { DecodedLetter } from "@/lib/buoyancisDecoder";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronDown, ChevronUp, Lightbulb, Layers, Zap, Link2 } from "lucide-react";
import { useLongPress } from "@/hooks/useLongPress";
import { useIsMobile } from "@/hooks/use-mobile";

interface TotemCardProps {
  item: DecodedLetter;
  index: number;
  totalCount: number;
  inputWord: string;
  isFocused?: boolean;
  onFocus?: () => void;
  compactMode?: boolean; // For long words (10+ letters)
}

export interface TotemCardRef {
  focus: () => void;
  open: () => void;
  close: () => void;
}

// UI translations for TotemCard
const uiTranslations = {
  en: {
    totemCode: "Totem Code",
    position: "Position",
    role: "Role",
    origin: "Origin",
    terminus: "Terminus",
    core: "Core",
    closeHint: "Click elsewhere to close",
    showMore: "Philosophical Extension",
    showLess: "Collapse",
    principle: "Core Principle",
    structuralRole: "Structural Role",
    dynamics: "Dynamics",
    relatedConcepts: "Related Concepts",
  },
  zh: {
    totemCode: "圖騰代碼",
    position: "位置",
    role: "結構角色",
    origin: "起源",
    terminus: "終點",
    core: "核心",
    closeHint: "點擊其他位置關閉",
    showMore: "哲學延伸",
    showLess: "收起",
    principle: "核心原則",
    structuralRole: "結構角色",
    dynamics: "動態機制",
    relatedConcepts: "相關概念",
  },
  ja: {
    totemCode: "トーテムコード",
    position: "位置",
    role: "構造的役割",
    origin: "起源",
    terminus: "終点",
    core: "コア",
    closeHint: "他の場所をクリックして閉じる",
    showMore: "哲学的拡張",
    showLess: "折りたたむ",
    principle: "核心原則",
    structuralRole: "構造的役割",
    dynamics: "ダイナミクス",
    relatedConcepts: "関連概念",
  },
  ko: {
    totemCode: "토템 코드",
    position: "위치",
    role: "구조적 역할",
    origin: "기원",
    terminus: "종점",
    core: "코어",
    closeHint: "다른 곳을 클릭하여 닫기",
    showMore: "철학적 확장",
    showLess: "접기",
    principle: "핵심 원칙",
    structuralRole: "구조적 역할",
    dynamics: "역학",
    relatedConcepts: "관련 개념",
  },
};

const TotemCard = forwardRef<TotemCardRef, TotemCardProps>(
  ({ item, index, totalCount, inputWord, isFocused = false, onFocus, compactMode = false }, ref) => {
  const { language } = useDecoderLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [showPhilosophy, setShowPhilosophy] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const t = uiTranslations[language];
  const isMobile = useIsMobile();
  
  const philosophy = getLocalizedPhilosophy(item.letter, language);

  // Long press handlers for mobile preview
  const handleLongPress = useCallback(() => {
    setShowPreview(true);
  }, []);

  const handlePress = useCallback(() => {
    if (!showPreview) {
      setIsOpen(true);
    }
    setShowPreview(false);
  }, [showPreview]);

  const handleCancel = useCallback(() => {
    setShowPreview(false);
  }, []);

  const { isPressed, isLongPressed, handlers } = useLongPress({
    onLongPress: handleLongPress,
    onPress: handlePress,
    onCancel: handleCancel,
    delay: 400,
    hapticFeedback: true,
  });

  // Close preview when touch ends after long press
  useEffect(() => {
    if (!isPressed && showPreview) {
      const timer = setTimeout(() => setShowPreview(false), 150);
      return () => clearTimeout(timer);
    }
  }, [isPressed, showPreview]);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    focus: () => cardRef.current?.focus(),
    open: () => setIsOpen(true),
    close: () => {
      setIsOpen(false);
      setShowPhilosophy(false);
      setShowPreview(false);
    },
  }));

  // Handle keyboard navigation within the card
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
    if (e.key === "Escape" && isOpen) {
      e.preventDefault();
      setIsOpen(false);
      setShowPhilosophy(false);
    }
  };

  // Focus card when isFocused changes
  useEffect(() => {
    if (isFocused && cardRef.current) {
      cardRef.current.focus();
    }
  }, [isFocused]);

  // Preview tooltip content
  const PreviewContent = () => (
    <div className="p-3 max-w-[200px]">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl font-mono text-white/90">{item.letter}</span>
        <span className="text-xs font-mono text-[#5a6f3c]/80 uppercase tracking-wider">
          {item.code}
        </span>
      </div>
      <p className="text-sm font-medium text-white/80 mb-1">
        {getConceptByLanguage(item, language)}
      </p>
      <p className="text-xs text-white/50 line-clamp-2">
        {getDescriptionByLanguage(item, language)}
      </p>
      <p className="text-[10px] text-[#5a6f3c]/50 mt-2 text-center">
        {language === "zh" ? "鬆開查看詳情" : 
         language === "ja" ? "離すと詳細を表示" :
         language === "ko" ? "놓으면 자세히 보기" :
         "Release for details"}
      </p>
    </div>
  );

  return (
    <motion.div
      className="group relative"
      initial={{ opacity: 0, y: 30, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: 0.3 + index * 0.08,
        type: "spring",
        stiffness: 300,
        damping: 20,
      }}
    >
      <TooltipProvider delayDuration={0}>
        <Tooltip open={showPreview && isMobile}>
          <Popover open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) setShowPhilosophy(false);
          }}>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <motion.div
                  ref={cardRef}
                  tabIndex={0}
                  role="button"
                  aria-label={`${item.letter}: ${getConceptByLanguage(item, language)}`}
                  aria-expanded={isOpen}
                  onKeyDown={handleKeyDown}
                  onFocus={onFocus}
                  {...(isMobile ? handlers : {})}
                  className={`flex flex-col items-center border rounded-sm relative overflow-hidden cursor-pointer outline-none transition-all ${
                    compactMode 
                      ? "p-2.5 sm:p-3 md:p-5 min-w-[52px] sm:min-w-[60px] md:min-w-[72px]"
                      : "p-4 sm:p-5 md:p-6 min-w-[64px] sm:min-w-[72px] md:min-w-[80px]"
                  } ${
                    isFocused
                      ? "border-[#5a6f3c]/60 ring-2 ring-[#5a6f3c]/30 bg-white/5" 
                      : "border-white/10"
                  } ${isPressed ? "scale-95" : ""} ${isLongPressed ? "ring-2 ring-[#5a6f3c]/50" : ""}`}
                  whileHover={!isMobile ? {
                    scale: 1.05,
                    y: -5,
                    borderColor: "rgba(90, 111, 60, 0.4)",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                  } : undefined}
                  whileTap={!isMobile ? { scale: 0.98 } : undefined}
                  transition={{ duration: 0.2 }}
                >
                  {/* Long press progress indicator */}
                  {isPressed && isMobile && (
                    <motion.div
                      className="absolute inset-0 bg-[#5a6f3c]/10 rounded-sm"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.1 }}
                    />
                  )}

                  {/* Glow effect on hover/focus */}
                  <motion.div
                    className={`absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#5a6f3c]/20 via-transparent to-transparent ${isFocused || isLongPressed ? 'opacity-100' : 'opacity-0'}`}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />

                  <motion.span
                    className={`font-mono text-white/90 relative z-10 ${
                      compactMode 
                        ? "text-xl sm:text-2xl md:text-3xl mb-1 sm:mb-1.5"
                        : "text-2xl sm:text-3xl md:text-4xl mb-1.5 sm:mb-2"
                    }`}
                    initial={{ rotateY: 90 }}
                    animate={{ rotateY: 0 }}
                    transition={{ delay: 0.3 + index * 0.05, duration: 0.4 }}
                  >
                    {item.letter}
                  </motion.span>
                  <motion.span
                    className={`font-mono uppercase text-[#5a6f3c]/70 relative z-10 text-center leading-tight ${
                      compactMode
                        ? "text-[8px] sm:text-[9px] md:text-xs tracking-wide sm:tracking-wider"
                        : "text-[10px] sm:text-xs md:text-sm tracking-wider md:tracking-widest"
                    }`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                  >
                    {getConceptByLanguage(item, language)}
                  </motion.span>

                  {/* Click indicator */}
                  <motion.div
                    className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-[#5a6f3c]/30"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2, delay: index * 0.2 }}
                  />
                </motion.div>
              </PopoverTrigger>
            </TooltipTrigger>

            <TooltipContent
              side="top"
              className="bg-black/95 border-[#5a6f3c]/30 backdrop-blur-xl p-0"
              sideOffset={8}
            >
              <PreviewContent />
            </TooltipContent>

        <PopoverContent
          className="w-80 md:w-96 bg-black/95 border-[#5a6f3c]/30 backdrop-blur-xl p-0 overflow-hidden max-h-[80vh] overflow-y-auto"
          sideOffset={8}
        >
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* Header */}
                <div className="p-4 border-b border-white/10 bg-gradient-to-r from-[#5a6f3c]/20 to-transparent">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl md:text-4xl font-mono text-white/90">
                      {item.letter}
                    </span>
                    <div>
                      <h4 className="text-base md:text-lg font-medium text-white/90 tracking-wide">
                        {getConceptByLanguage(item, language)}
                      </h4>
                      <span className="text-[10px] md:text-xs font-mono text-[#5a6f3c]/60 uppercase tracking-widest">
                        {t.totemCode}: {item.code}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Basic Description */}
                <div className="p-4 space-y-3">
                  <p className="text-sm md:text-base text-white/70 leading-relaxed">
                    {getDescriptionByLanguage(item, language)}
                  </p>

                  {/* Position in word */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="text-[10px] md:text-xs font-mono text-white/30 uppercase tracking-wider">
                      {t.position}
                    </span>
                    <span className="text-xs md:text-sm font-mono text-[#5a6f3c]/70">
                      {index + 1} / {totalCount}
                    </span>
                  </div>

                  {/* Structural role */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] md:text-xs font-mono text-white/30 uppercase tracking-wider">
                      {t.role}
                    </span>
                    <span className="text-xs md:text-sm font-mono text-white/50">
                      {index === 0
                        ? t.origin
                        : index === totalCount - 1
                        ? t.terminus
                        : t.core}
                    </span>
                  </div>
                </div>

                {/* Philosophy Toggle */}
                {philosophy && (
                  <>
                    <button
                      onClick={() => setShowPhilosophy(!showPhilosophy)}
                      className="w-full px-4 py-3 flex items-center justify-between bg-[#5a6f3c]/10 hover:bg-[#5a6f3c]/20 border-t border-b border-white/5 transition-colors"
                    >
                      <span className="text-xs font-mono uppercase tracking-wider text-[#5a6f3c]/80 flex items-center gap-2">
                        <Lightbulb className="w-3.5 h-3.5" />
                        {t.showMore}
                      </span>
                      {showPhilosophy ? (
                        <ChevronUp className="w-4 h-4 text-[#5a6f3c]/60" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#5a6f3c]/60" />
                      )}
                    </button>

                    <AnimatePresence>
                      {showPhilosophy && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 space-y-4 bg-black/30">
                            {/* Core Principle */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-[#5a6f3c]/70">
                                <Lightbulb className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-mono uppercase tracking-wider">
                                  {t.principle}
                                </span>
                              </div>
                              <p className="text-sm text-white/60 leading-relaxed pl-5">
                                {philosophy.principle}
                              </p>
                            </div>

                            {/* Structural Role */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-[#5a6f3c]/70">
                                <Layers className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-mono uppercase tracking-wider">
                                  {t.structuralRole}
                                </span>
                              </div>
                              <p className="text-sm text-white/60 leading-relaxed pl-5">
                                {philosophy.structuralRole}
                              </p>
                            </div>

                            {/* Dynamics */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-[#5a6f3c]/70">
                                <Zap className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-mono uppercase tracking-wider">
                                  {t.dynamics}
                                </span>
                              </div>
                              <p className="text-sm text-white/60 leading-relaxed pl-5">
                                {philosophy.dynamics}
                              </p>
                            </div>

                            {/* Related Concepts */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-[#5a6f3c]/70">
                                <Link2 className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-mono uppercase tracking-wider">
                                  {t.relatedConcepts}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2 pl-5">
                                {philosophy.relatedConcepts.map((concept) => (
                                  <span
                                    key={concept}
                                    className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider bg-[#5a6f3c]/10 text-[#5a6f3c]/60 rounded-sm border border-[#5a6f3c]/20"
                                  >
                                    {concept}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}

                {/* Footer hint */}
                <div className="px-4 py-2 bg-white/[0.02] border-t border-white/5">
                  <p className="text-[10px] text-white/20 text-center font-mono uppercase tracking-wider">
                    {t.closeHint}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </PopoverContent>
        </Popover>
      </Tooltip>
    </TooltipProvider>

      {/* Connector line with animation */}
      {index < totalCount - 1 && (
        <motion.div
          className="hidden md:block absolute -right-4 top-1/2 w-4 h-px bg-gradient-to-r from-white/20 to-transparent"
          initial={{ scaleX: 0, originX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.6 + index * 0.08, duration: 0.3 }}
        />
      )}
    </motion.div>
  );
});

TotemCard.displayName = "TotemCard";

export default TotemCard;
