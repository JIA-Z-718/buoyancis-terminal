import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Tag, Share2, Trash2, Eye, X } from "lucide-react";
import { useDecoderLanguage } from "@/contexts/DecoderLanguageContext";
import type { DecodeHistoryItem } from "@/hooks/useDecodeHistory";

const translations = {
  en: {
    decode: "Decode",
    favorite: "Add to Favorites",
    unfavorite: "Remove from Favorites",
    addTag: "Add Tag",
    share: "Share",
    delete: "Delete",
    cancel: "Cancel",
  },
  zh: {
    decode: "解碼",
    favorite: "加入收藏",
    unfavorite: "取消收藏",
    addTag: "添加標籤",
    share: "分享",
    delete: "刪除",
    cancel: "取消",
  },
  ja: {
    decode: "デコード",
    favorite: "お気に入りに追加",
    unfavorite: "お気に入りから削除",
    addTag: "タグを追加",
    share: "共有",
    delete: "削除",
    cancel: "キャンセル",
  },
  ko: {
    decode: "디코드",
    favorite: "즐겨찾기에 추가",
    unfavorite: "즐겨찾기에서 삭제",
    addTag: "태그 추가",
    share: "공유",
    delete: "삭제",
    cancel: "취소",
  },
};

interface MobileActionSheetProps {
  item: DecodeHistoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDecode: (word: string) => void;
  onToggleFavorite: (word: string) => void;
  onAddTag: (word: string) => void;
  onShare: (word: string) => void;
  onDelete: (word: string) => void;
}

export const MobileActionSheet = ({
  item,
  isOpen,
  onClose,
  onDecode,
  onToggleFavorite,
  onAddTag,
  onShare,
  onDelete,
}: MobileActionSheetProps) => {
  const { language } = useDecoderLanguage();
  const t = translations[language];
  const sheetRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      // Prevent body scroll when sheet is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!item) return null;

  const actions = [
    {
      icon: Eye,
      label: t.decode,
      onClick: () => {
        onDecode(item.word);
        onClose();
      },
      variant: "default" as const,
    },
    {
      icon: Star,
      label: item.isFavorite ? t.unfavorite : t.favorite,
      onClick: () => {
        onToggleFavorite(item.word);
        onClose();
      },
      variant: "default" as const,
      highlight: item.isFavorite,
    },
    {
      icon: Tag,
      label: t.addTag,
      onClick: () => {
        onAddTag(item.word);
        onClose();
      },
      variant: "default" as const,
    },
    {
      icon: Share2,
      label: t.share,
      onClick: () => {
        onShare(item.word);
        onClose();
      },
      variant: "default" as const,
    },
    {
      icon: Trash2,
      label: t.delete,
      onClick: () => {
        onDelete(item.word);
        onClose();
      },
      variant: "destructive" as const,
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Action Sheet */}
          <motion.div
            ref={sheetRef}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-8"
          >
            {/* Header with word */}
            <div className="bg-white/5 border border-white/10 rounded-t-2xl px-4 py-3 flex items-center justify-between">
              <span className="font-mono text-lg text-white/90 tracking-wider">
                {item.word}
              </span>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-white/50" />
              </button>
            </div>

            {/* Actions */}
            <div className="bg-white/5 border-x border-white/10 divide-y divide-white/5">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`w-full flex items-center gap-4 px-4 py-4 transition-colors active:bg-white/10 ${
                    action.variant === "destructive"
                      ? "text-red-400 hover:bg-red-500/10"
                      : action.highlight
                      ? "text-amber-400 hover:bg-amber-500/10"
                      : "text-white/80 hover:bg-white/5"
                  }`}
                >
                  <action.icon
                    className={`w-5 h-5 ${
                      action.highlight ? "fill-current" : ""
                    }`}
                  />
                  <span className="text-base font-medium">{action.label}</span>
                </button>
              ))}
            </div>

            {/* Cancel button */}
            <button
              onClick={onClose}
              className="mt-2 w-full bg-white/10 border border-white/10 rounded-2xl py-4 text-white/70 font-medium text-base hover:bg-white/15 transition-colors active:bg-white/20"
            >
              {t.cancel}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
