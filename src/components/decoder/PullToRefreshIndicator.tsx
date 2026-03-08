import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Sparkles } from "lucide-react";
import { useDecoderLanguage } from "@/contexts/DecoderLanguageContext";

// UI translations for PullToRefreshIndicator
const translations = {
  en: {
    refreshing: "Refreshing...",
    release: "Release to refresh",
    pull: "Pull to refresh",
  },
  zh: {
    refreshing: "刷新中...",
    release: "鬆開以刷新",
    pull: "下拉刷新",
  },
  ja: {
    refreshing: "更新中...",
    release: "離すと更新",
    pull: "引っ張って更新",
  },
  ko: {
    refreshing: "새로고침 중...",
    release: "놓으면 새로고침",
    pull: "당겨서 새로고침",
  },
};

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  canRefresh: boolean;
  isRefreshing: boolean;
  isPulling: boolean;
  threshold?: number;
}

const PullToRefreshIndicator = ({
  pullDistance,
  canRefresh,
  isRefreshing,
  isPulling,
  threshold = 80,
}: PullToRefreshIndicatorProps) => {
  const { language } = useDecoderLanguage();
  const t = translations[language];
  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = progress * 180;

  return (
    <AnimatePresence>
      {(isPulling || isRefreshing) && pullDistance > 10 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            height: pullDistance,
          }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute top-0 left-0 right-0 flex items-center justify-center overflow-hidden z-20"
        >
          <motion.div
            className={`flex flex-col items-center gap-2 transition-colors duration-200 ${
              canRefresh ? "text-[#5a6f3c]" : "text-white/40"
            }`}
            animate={{ 
              scale: canRefresh ? 1.1 : 1,
            }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {isRefreshing ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <RefreshCw className="w-6 h-6" />
              </motion.div>
            ) : (
              <motion.div
                style={{ rotate: rotation }}
                transition={{ duration: 0.1 }}
              >
                {canRefresh ? (
                  <Sparkles className="w-6 h-6" />
                ) : (
                  <RefreshCw className="w-6 h-6" />
                )}
              </motion.div>
            )}
            
            <motion.span 
              className="text-[10px] font-mono uppercase tracking-wider"
              initial={{ opacity: 0 }}
              animate={{ opacity: progress > 0.3 ? 1 : 0 }}
            >
              {isRefreshing 
                ? t.refreshing 
                : canRefresh 
                  ? t.release 
                  : t.pull
              }
            </motion.span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PullToRefreshIndicator;
