import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { decodeWord, getTotemString, generateInterpretation, type DecodedLetter } from "@/lib/buoyancisDecoder";
import ShareTotem from "./ShareTotem";
import DecodeHistory from "./DecodeHistory";
import TotemCard, { type TotemCardRef } from "./TotemCard";
import PullToRefreshIndicator from "./PullToRefreshIndicator";
import { useDecodeHistory } from "@/hooks/useDecodeHistory";
import { useCloudDecodeHistory } from "@/hooks/useCloudDecodeHistory";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useDecoderLanguage } from "@/contexts/DecoderLanguageContext";
import { useDecoderKeyboard } from "@/hooks/useDecoderKeyboard";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight } from "lucide-react";

// UI translations for DecoderConsole
const consoleTranslations = {
  en: {
    structuralDna: "Structural DNA",
    elements: "Elements",
    unique: "Unique",
    origin: "Origin",
    terminus: "Terminus",
    placeholder: "Enter any word or name...",
    emptyHint: "Enter any word to decode its structural DNA",
    swipeHint: "← Swipe to browse history →",
    prev: "Prev",
    next: "Next",
  },
  zh: {
    structuralDna: "結構 DNA",
    elements: "元素",
    unique: "獨特",
    origin: "起源",
    terminus: "終點",
    placeholder: "輸入任何單詞或名稱...",
    emptyHint: "輸入任何單詞來解碼其結構 DNA",
    swipeHint: "← 滑動瀏覽歷史記錄 →",
    prev: "上一個",
    next: "下一個",
  },
  ja: {
    structuralDna: "構造DNA",
    elements: "要素",
    unique: "固有",
    origin: "起源",
    terminus: "終点",
    placeholder: "単語または名前を入力...",
    emptyHint: "単語を入力して構造DNAをデコード",
    swipeHint: "← スワイプで履歴を閲覧 →",
    prev: "前へ",
    next: "次へ",
  },
  ko: {
    structuralDna: "구조 DNA",
    elements: "요소",
    unique: "고유",
    origin: "기원",
    terminus: "종점",
    placeholder: "단어 또는 이름 입력...",
    emptyHint: "단어를 입력하여 구조 DNA 디코드",
    swipeHint: "← 스와이프하여 기록 탐색 →",
    prev: "이전",
    next: "다음",
  },
};

const DecoderConsole = () => {
  const [searchParams] = useSearchParams();
  const [input, setInput] = useState("");
  const [decoded, setDecoded] = useState<DecodedLetter[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const [focusedCardIndex, setFocusedCardIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(TotemCardRef | null)[]>([]);
  const { history, addToHistory, removeFromHistory, clearHistory, importHistory, availableTags, addTagToItem, removeTagFromItem, toggleFavorite } = useDecodeHistory();
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    cloudHistory,
    isSyncing,
    lastSyncTime,
    addToCloud,
    removeFromCloud,
    clearCloud,
    addTagToCloudItem,
    removeTagFromCloudItem,
    toggleCloudFavorite,
    syncLocalToCloud,
  } = useCloudDecodeHistory();
  const { language } = useDecoderLanguage();
  const t = consoleTranslations[language];

  // Use the appropriate history based on login status
  const effectiveHistory = user ? cloudHistory : history;

  // Navigate to previous word in history
  const goToPreviousWord = useCallback(() => {
    if (effectiveHistory.length === 0) return;
    
    const newIndex = historyIndex < effectiveHistory.length - 1 ? historyIndex + 1 : 0;
    setHistoryIndex(newIndex);
    setSwipeDirection("right");
    setInput(effectiveHistory[newIndex].word);
    
    // Reset animation
    setTimeout(() => setSwipeDirection(null), 300);
  }, [effectiveHistory, historyIndex]);

  // Navigate to next word in history
  const goToNextWord = useCallback(() => {
    if (effectiveHistory.length === 0) return;
    
    const newIndex = historyIndex > 0 ? historyIndex - 1 : effectiveHistory.length - 1;
    setHistoryIndex(newIndex);
    setSwipeDirection("left");
    setInput(effectiveHistory[newIndex].word);
    
    // Reset animation
    setTimeout(() => setSwipeDirection(null), 300);
  }, [effectiveHistory, historyIndex]);

  // Setup swipe gestures
  useSwipeGesture(containerRef, {
    onSwipeLeft: goToNextWord,
    onSwipeRight: goToPreviousWord,
    threshold: 50,
  });

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    // Clear input and reset state
    setInput("");
    setDecoded([]);
    setShowResult(false);
    setHistoryIndex(-1);
    
    // Small delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Focus input
    inputRef.current?.focus();
  }, []);

  const pullToRefreshState = usePullToRefresh(containerRef, {
    onRefresh: handleRefresh,
    threshold: 70,
    maxPull: 100,
  });

  // Handle URL parameter for shared links
  useEffect(() => {
    const wordParam = searchParams.get("word");
    if (wordParam) {
      setInput(wordParam);
    }
  }, [searchParams]);

  // Debounced save to history
  const saveToHistoryDebounced = useCallback((word: string) => {
    if (word.trim().length >= 2) {
      addToHistory(word);
      // Also add to cloud if user is logged in
      if (user) {
        addToCloud(word);
      }
    }
  }, [addToHistory, addToCloud, user]);

  useEffect(() => {
    if (input.length > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setDecoded(decodeWord(input));
        setIsAnimating(false);
        setShowResult(true);
      }, 300);
      
      // Save to history after user stops typing
      const historyTimer = setTimeout(() => {
        saveToHistoryDebounced(input);
      }, 1500);
      
      return () => {
        clearTimeout(timer);
        clearTimeout(historyTimer);
      };
    } else {
      setDecoded([]);
      setShowResult(false);
    }
  }, [input, saveToHistoryDebounced]);

  const handleSelectFromHistory = (word: string) => {
    const index = effectiveHistory.findIndex((item) => item.word === word);
    if (index !== -1) {
      setHistoryIndex(index);
    }
    setInput(word);
    inputRef.current?.focus();
  };

  // Focus card helper function
  const focusCard = useCallback((index: number) => {
    cardRefs.current[index]?.focus();
  }, []);

  // Use the keyboard navigation hook
  const { handleInputKeyDown } = useDecoderKeyboard({
    inputRef,
    decoded,
    focusedCardIndex,
    historyLength: effectiveHistory.length,
    setFocusedCardIndex,
    setInput,
    goToPreviousWord,
    goToNextWord,
    focusCard,
  });

  // Reset history index when input changes manually
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    setHistoryIndex(-1);
  }, []);

  // Check if we can navigate (using effectiveHistory instead of history)
  const canNavigate = effectiveHistory.length > 1;

  return (
    <div ref={containerRef} className="w-full max-w-4xl mx-auto touch-pan-y relative">
      {/* Pull to refresh indicator */}
      <PullToRefreshIndicator
        pullDistance={pullToRefreshState.pullDistance}
        canRefresh={pullToRefreshState.canRefresh}
        isRefreshing={pullToRefreshState.isRefreshing}
        isPulling={pullToRefreshState.isPulling}
        threshold={70}
      />
      
      {/* Content wrapper with pull offset */}
      <motion.div
        animate={{ 
          y: pullToRefreshState.isPulling || pullToRefreshState.isRefreshing 
            ? pullToRefreshState.pullDistance * 0.5 
            : 0 
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Terminal header */}
        <div className="flex items-center gap-2 mb-4 opacity-40">
          <div className="w-3 h-3 rounded-full bg-red-500/60" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
          <div className="w-3 h-3 rounded-full bg-green-500/60" />
          <span className="ml-4 text-xs font-mono tracking-widest text-white/40">
            BUOYANCIS_DECODER_v2046
          </span>
        </div>

      {/* Swipe navigation indicator - only show when history exists */}
      {canNavigate && showResult && (
        <div className="flex items-center justify-center gap-4 mb-4 animate-fade-in">
          <button
            onClick={goToPreviousWord}
            className="flex items-center gap-1 text-white/30 hover:text-white/60 transition-colors p-2 -m-2"
            aria-label="Previous word"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-[10px] font-mono uppercase tracking-wider hidden md:inline">{t.prev}</span>
          </button>
          
          <div className="flex items-center gap-1.5">
            {history.slice(0, 5).map((_, idx) => (
              <div
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  idx === historyIndex 
                    ? "bg-[#5a6f3c] scale-125" 
                    : "bg-white/20"
                }`}
              />
            ))}
            {history.length > 5 && (
              <span className="text-white/20 text-[10px] font-mono ml-1">
                +{history.length - 5}
              </span>
            )}
          </div>
          
          <button
            onClick={goToNextWord}
            className="flex items-center gap-1 text-white/30 hover:text-white/60 transition-colors p-2 -m-2"
            aria-label="Next word"
          >
            <span className="text-[10px] font-mono uppercase tracking-wider hidden md:inline">{t.next}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Swipe hint for mobile - show once */}
      {canNavigate && showResult && (
        <p className="text-center text-white/20 text-[10px] font-mono uppercase tracking-wider mb-4 md:hidden">
          {t.swipeHint}
        </p>
      )}

      {/* Main input area - touch optimized */}
      <div className="relative group">
        {/* Touch-friendly background area */}
        <div 
          className="absolute inset-0 -m-2 rounded-lg bg-white/0 group-focus-within:bg-white/[0.02] transition-colors duration-300 md:hidden"
          onClick={() => inputRef.current?.focus()}
        />
        
        {/* Prompt symbol */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 text-white/30 font-mono text-xl sm:text-2xl select-none pointer-events-none">
          &gt;_
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onFocus={() => {
            // Haptic feedback on focus (mobile)
            if ('vibrate' in navigator) {
              navigator.vibrate(10);
            }
          }}
          placeholder={t.placeholder}
          className="w-full bg-transparent border-none text-white text-2xl sm:text-3xl md:text-5xl font-light tracking-wide pl-10 sm:pl-12 py-4 sm:py-5 md:py-4 focus:outline-none placeholder:text-white/20 placeholder:text-base sm:placeholder:text-lg md:placeholder:text-2xl font-mono min-h-[56px] sm:min-h-[64px] touch-manipulation"
          autoFocus
          spellCheck={false}
          autoComplete="off"
          enterKeyHint="go"
          inputMode="text"
        />
        
        {/* Blinking cursor effect */}
        {input.length === 0 && (
          <span className="absolute left-10 sm:left-12 top-1/2 -translate-y-1/2 w-0.5 h-7 sm:h-9 md:h-12 bg-white/60 animate-pulse pointer-events-none" />
        )}
        
        {/* Touch feedback underline */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent group-focus-within:via-[#5a6f3c]/40 transition-colors duration-300" />
      </div>

      {/* Decode result - wrapped in ref for image capture */}
      <AnimatePresence mode="wait">
        {showResult && decoded.length > 0 && (
          <motion.div 
            ref={resultRef} 
            key={input}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="mt-8 md:mt-12 bg-black -mx-4 md:-mx-8 relative overflow-hidden"
          >
            {/* Subtle gradient background for visual interest */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-b from-white/[0.02] via-transparent to-white/[0.02]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            />
            <motion.div 
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#5a6f3c]/5 via-transparent to-transparent"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            />
            
            {/* Decorative corner accents - smaller on mobile */}
            <motion.div 
              className="absolute top-0 left-0 w-8 md:w-16 h-8 md:h-16 border-l border-t border-white/10"
              initial={{ opacity: 0, x: -10, y: -10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: 0.4 }}
            />
            <motion.div 
              className="absolute top-0 right-0 w-8 md:w-16 h-8 md:h-16 border-r border-t border-white/10"
              initial={{ opacity: 0, x: 10, y: -10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: 0.4 }}
            />
            <motion.div 
              className="absolute bottom-0 left-0 w-8 md:w-16 h-8 md:h-16 border-l border-b border-white/10"
              initial={{ opacity: 0, x: -10, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: 0.4 }}
            />
            <motion.div 
              className="absolute bottom-0 right-0 w-8 md:w-16 h-8 md:h-16 border-r border-b border-white/10"
              initial={{ opacity: 0, x: 10, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: 0.4 }}
            />
            
            <div className="relative z-10 px-5 py-8 md:p-12 space-y-6 md:space-y-8">
              {/* Header with decoded word */}
              <motion.div 
                className="text-center space-y-2 md:space-y-3"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <span className="text-[#5a6f3c]/60 text-[10px] md:text-xs font-mono uppercase tracking-[0.2em] md:tracking-[0.3em]">
                  {t.structuralDna}
                </span>
                <motion.h2 
                  className="text-2xl md:text-5xl font-light tracking-wide md:tracking-wider text-white/90"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  {input.toUpperCase()}
                </motion.h2>
              </motion.div>

              {/* Totem visualization - adaptive grid for long words */}
              <div 
                className={`flex flex-wrap justify-center pt-3 sm:pt-4 md:pt-6 px-2 ${
                  decoded.length >= 10 
                    ? "gap-2 sm:gap-3 md:gap-4" 
                    : decoded.length >= 7 
                      ? "gap-2.5 sm:gap-3.5 md:gap-5"
                      : "gap-3 sm:gap-4 md:gap-5"
                }`}
                role="group"
                aria-label="Decoded letters"
              >
                {decoded.map((item, index) => (
                  <TotemCard
                    key={`${input}-${index}`}
                    ref={(el) => { cardRefs.current[index] = el; }}
                    item={item}
                    index={index}
                    totalCount={decoded.length}
                    inputWord={input}
                    isFocused={focusedCardIndex === index}
                    onFocus={() => setFocusedCardIndex(index)}
                    compactMode={decoded.length >= 10}
                  />
                ))}
              </div>

            {/* Totem string */}
            <motion.div 
              className="text-center pt-2 md:pt-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 + decoded.length * 0.08 }}
            >
              <p className="font-mono text-xs md:text-base text-white/40 tracking-wide md:tracking-wider leading-relaxed px-2">
                {getTotemString(decoded, language)}
              </p>
            </motion.div>

            {/* Interpretation */}
            <motion.div 
              className="max-w-2xl mx-auto text-center pt-5 md:pt-8 border-t border-white/5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + decoded.length * 0.08 }}
            >
              <p className="text-white/50 text-sm md:text-base leading-relaxed md:leading-loose italic px-2">
                "{generateInterpretation(decoded, language)}"
              </p>
            </motion.div>

            {/* Structural analysis */}
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 pt-5 md:pt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 + decoded.length * 0.08 }}
            >
              {[
                { value: decoded.length, label: t.elements },
                { value: new Set(decoded.map(d => d.concept)).size, label: t.unique },
                { value: decoded[0]?.code || "—", label: t.origin },
                { value: decoded[decoded.length - 1]?.code || "—", label: t.terminus },
              ].map((stat, idx) => (
                <motion.div 
                  key={idx}
                  className="text-center p-3 md:p-4 border border-white/5 bg-white/[0.01] rounded-sm"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.1 + decoded.length * 0.08 + idx * 0.1 }}
                  whileHover={{ 
                    borderColor: "rgba(255, 255, 255, 0.1)",
                    backgroundColor: "rgba(255, 255, 255, 0.02)"
                  }}
                >
                  <motion.span 
                    className="block text-xl md:text-3xl font-mono text-white/80"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 + decoded.length * 0.08 + idx * 0.1 }}
                  >
                    {stat.value}
                  </motion.span>
                  <span className="text-[10px] md:text-xs uppercase tracking-wider md:tracking-widest text-white/30 mt-1 block">
                    {stat.label}
                  </span>
                </motion.div>
              ))}
            </motion.div>

            {/* Enhanced branding watermark */}
            <motion.div 
              className="pt-6 md:pt-8 flex flex-col items-center gap-2 md:gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 + decoded.length * 0.08 }}
            >
              <div className="flex items-center gap-2 md:gap-3">
                <motion.div 
                  className="w-6 md:w-8 h-px bg-gradient-to-r from-transparent via-[#5a6f3c]/40 to-transparent"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 1.6 + decoded.length * 0.08, duration: 0.4 }}
                />
                <motion.span 
                  className="text-[#5a6f3c]/50 text-[10px] md:text-xs font-mono tracking-[0.2em] md:tracking-[0.25em]"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.7 + decoded.length * 0.08, type: "spring" }}
                >
                  ◆
                </motion.span>
                <motion.div 
                  className="w-6 md:w-8 h-px bg-gradient-to-r from-transparent via-[#5a6f3c]/40 to-transparent"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 1.6 + decoded.length * 0.08, duration: 0.4 }}
                />
              </div>
              <div className="flex flex-col items-center gap-0.5 md:gap-1">
                <span className="text-white/40 text-xs md:text-sm font-light tracking-[0.15em] md:tracking-[0.2em]">
                  BUOYANCIS
                </span>
                <span className="text-white/20 text-[8px] md:text-[10px] font-mono tracking-[0.1em] md:tracking-[0.15em]">
                  STRUCTURAL DECODER • buoyancis.com
                </span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Share buttons - outside the capture area */}
      {showResult && decoded.length > 0 && (
        <ShareTotem 
          decoded={decoded} 
          inputWord={input} 
          containerRef={resultRef} 
        />
      )}

      {/* Decode History */}
      <DecodeHistory
        history={user ? cloudHistory : history}
        onSelect={handleSelectFromHistory}
        onRemove={user ? removeFromCloud : removeFromHistory}
        onClear={user ? clearCloud : clearHistory}
        onImport={importHistory}
        availableTags={availableTags}
        onAddTagToItem={user ? addTagToCloudItem : addTagToItem}
        onRemoveTagFromItem={user ? removeTagFromCloudItem : removeTagFromItem}
        onToggleFavorite={user ? toggleCloudFavorite : toggleFavorite}
        isLoggedIn={!!user}
        isSyncing={isSyncing}
        lastSyncTime={lastSyncTime}
        onSyncToCloud={async () => {
          await syncLocalToCloud(history);
          toast({
            title: language === "zh" ? "同步完成" : language === "ja" ? "同期完了" : language === "ko" ? "동기화 완료" : "Sync complete",
            description: language === "zh" ? "歷史記錄已同步到雲端" : language === "ja" ? "履歴がクラウドに同期されました" : language === "ko" ? "기록이 클라우드에 동기화되었습니다" : "History synced to cloud",
          });
        }}
      />

      {/* Instructions when empty */}
      {input.length === 0 && effectiveHistory.length === 0 && (
        <div className="mt-16 text-center animate-fade-in">
          <p className="text-white/20 text-sm font-mono uppercase tracking-widest">
            {t.emptyHint}
          </p>
        </div>
      )}

      <style>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      </motion.div>
    </div>
  );
};

export default DecoderConsole;
