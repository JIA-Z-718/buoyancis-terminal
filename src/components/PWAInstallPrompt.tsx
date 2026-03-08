import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share, X, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export function PWAInstallPrompt() {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user previously dismissed the prompt
    const wasDismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (wasDismissed) {
      const dismissedAt = new Date(wasDismissed);
      const now = new Date();
      // Show again after 7 days
      if (now.getTime() - dismissedAt.getTime() < 7 * 24 * 60 * 60 * 1000) {
        setDismissed(true);
        return;
      }
    }

    // Show prompt after 5 seconds if installable
    const timer = setTimeout(() => {
      if ((isInstallable || isIOS) && !isInstalled && !dismissed) {
        setShowPrompt(true);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [isInstallable, isInstalled, isIOS, dismissed]);

  const handleInstall = async () => {
    const success = await promptInstall();
    if (success) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-prompt-dismissed', new Date().toISOString());
  };

  if (isInstalled || dismissed) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm"
        >
          <div className="relative rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl p-4 shadow-2xl">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute right-2 top-2 p-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="關閉"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Smartphone className="h-6 w-6 text-primary" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pr-4">
                <h3 className="font-semibold text-foreground text-sm">
                  安裝 Buoyancis
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  將應用程式安裝到主畫面，享受更流暢的使用體驗
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex gap-2">
              {isIOS ? (
                <div className="flex-1 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Share className="h-4 w-4" />
                    <span className="font-medium">iOS 安裝指南：</span>
                  </div>
                  <p>點擊分享按鈕 → 滑動選擇「加入主畫面」</p>
                </div>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    className="flex-1"
                  >
                    稍後再說
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleInstall}
                    className="flex-1 gap-2"
                  >
                    <Download className="h-4 w-4" />
                    立即安裝
                  </Button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
