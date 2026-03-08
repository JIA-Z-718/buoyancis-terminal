import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileJson, AlertCircle, Check, RefreshCw, SkipForward, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDecoderLanguage } from "@/contexts/DecoderLanguageContext";
import type { DecodeHistoryItem } from "@/hooks/useDecodeHistory";

const translations = {
  en: {
    title: "Import Preview",
    subtitle: "Review items before importing",
    totalItems: "{count} items found",
    newItems: "{count} new",
    duplicates: "{count} duplicates",
    mergeOption: "How to handle duplicates?",
    skipDuplicates: "Skip Duplicates",
    skipDuplicatesDesc: "Keep existing items, only add new ones",
    overwriteDuplicates: "Overwrite",
    overwriteDuplicatesDesc: "Replace existing items with imported versions",
    cancel: "Cancel",
    import: "Import",
    previewNew: "New items",
    previewDuplicate: "Duplicates",
    noNewItems: "All items already exist in history",
    willBeSkipped: "will be skipped",
    willBeOverwritten: "will be replaced",
  },
  zh: {
    title: "匯入預覽",
    subtitle: "匯入前檢視項目",
    totalItems: "共 {count} 項",
    newItems: "{count} 項新增",
    duplicates: "{count} 項重複",
    mergeOption: "如何處理重複項目？",
    skipDuplicates: "跳過重複",
    skipDuplicatesDesc: "保留現有項目，只添加新項目",
    overwriteDuplicates: "覆蓋",
    overwriteDuplicatesDesc: "用匯入版本替換現有項目",
    cancel: "取消",
    import: "匯入",
    previewNew: "新項目",
    previewDuplicate: "重複項目",
    noNewItems: "所有項目已存在於歷史記錄中",
    willBeSkipped: "將被跳過",
    willBeOverwritten: "將被替換",
  },
  ja: {
    title: "インポートプレビュー",
    subtitle: "インポート前に項目を確認",
    totalItems: "{count} 件見つかりました",
    newItems: "{count} 件新規",
    duplicates: "{count} 件重複",
    mergeOption: "重複の処理方法を選択",
    skipDuplicates: "重複をスキップ",
    skipDuplicatesDesc: "既存の項目を保持し、新しい項目のみ追加",
    overwriteDuplicates: "上書き",
    overwriteDuplicatesDesc: "既存の項目をインポート版で置き換え",
    cancel: "キャンセル",
    import: "インポート",
    previewNew: "新規項目",
    previewDuplicate: "重複項目",
    noNewItems: "すべての項目が履歴に存在します",
    willBeSkipped: "スキップされます",
    willBeOverwritten: "置き換えられます",
  },
  ko: {
    title: "가져오기 미리보기",
    subtitle: "가져오기 전 항목 확인",
    totalItems: "{count}개 항목 발견",
    newItems: "{count}개 신규",
    duplicates: "{count}개 중복",
    mergeOption: "중복 처리 방법 선택",
    skipDuplicates: "중복 건너뛰기",
    skipDuplicatesDesc: "기존 항목 유지, 새 항목만 추가",
    overwriteDuplicates: "덮어쓰기",
    overwriteDuplicatesDesc: "기존 항목을 가져온 버전으로 교체",
    cancel: "취소",
    import: "가져오기",
    previewNew: "새 항목",
    previewDuplicate: "중복 항목",
    noNewItems: "모든 항목이 이미 기록에 있습니다",
    willBeSkipped: "건너뜁니다",
    willBeOverwritten: "교체됩니다",
  },
};

export type ImportMode = "skip" | "overwrite";

interface ImportPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (mode: ImportMode) => void;
  items: DecodeHistoryItem[];
  existingWords: Set<string>;
}

export const ImportPreviewDialog = ({
  isOpen,
  onClose,
  onConfirm,
  items,
  existingWords,
}: ImportPreviewDialogProps) => {
  const { language } = useDecoderLanguage();
  const t = translations[language];
  const [selectedMode, setSelectedMode] = useState<ImportMode>("skip");

  // Categorize items
  const newItems = items.filter(
    (item) => !existingWords.has(item.word.trim().toUpperCase())
  );
  const duplicateItems = items.filter((item) =>
    existingWords.has(item.word.trim().toUpperCase())
  );

  const handleConfirm = () => {
    onConfirm(selectedMode);
    onClose();
  };

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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-md"
          >
            <div className="bg-black/95 border border-white/10 rounded-lg shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#5a6f3c]/20 rounded-lg">
                    <FileJson className="w-5 h-5 text-[#5a6f3c]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-white">{t.title}</h2>
                    <p className="text-xs text-white/50">{t.subtitle}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/50" />
                </button>
              </div>

              {/* Stats */}
              <div className="p-4 border-b border-white/5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">
                    {t.totalItems.replace("{count}", String(items.length))}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-[#5a6f3c] flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      {t.newItems.replace("{count}", String(newItems.length))}
                    </span>
                    {duplicateItems.length > 0 && (
                      <span className="text-amber-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {t.duplicates.replace("{count}", String(duplicateItems.length))}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Preview lists */}
              <div className="max-h-48 overflow-y-auto">
                {/* New items */}
                {newItems.length > 0 && (
                  <div className="p-3 border-b border-white/5">
                    <div className="text-xs text-white/40 uppercase tracking-wider mb-2">
                      {t.previewNew}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {newItems.slice(0, 10).map((item, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-[#5a6f3c]/20 text-[#a8c66c] text-xs font-mono rounded"
                        >
                          {item.word}
                        </span>
                      ))}
                      {newItems.length > 10 && (
                        <span className="px-2 py-0.5 text-white/40 text-xs">
                          +{newItems.length - 10}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Duplicate items */}
                {duplicateItems.length > 0 && (
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-white/40 uppercase tracking-wider">
                        {t.previewDuplicate}
                      </span>
                      <span className="text-xs text-amber-400/70">
                        {selectedMode === "skip" ? t.willBeSkipped : t.willBeOverwritten}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {duplicateItems.slice(0, 10).map((item, i) => (
                        <span
                          key={i}
                          className={`px-2 py-0.5 text-xs font-mono rounded ${
                            selectedMode === "skip"
                              ? "bg-white/5 text-white/40 line-through"
                              : "bg-amber-500/20 text-amber-400"
                          }`}
                        >
                          {item.word}
                        </span>
                      ))}
                      {duplicateItems.length > 10 && (
                        <span className="px-2 py-0.5 text-white/40 text-xs">
                          +{duplicateItems.length - 10}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* No new items warning */}
                {newItems.length === 0 && duplicateItems.length > 0 && (
                  <div className="p-4 text-center">
                    <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                    <p className="text-sm text-white/60">{t.noNewItems}</p>
                  </div>
                )}
              </div>

              {/* Merge options - only show if there are duplicates */}
              {duplicateItems.length > 0 && (
                <div className="p-4 border-t border-white/5">
                  <p className="text-xs text-white/50 mb-3">{t.mergeOption}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSelectedMode("skip")}
                      className={`p-3 rounded-lg border transition-all text-left ${
                        selectedMode === "skip"
                          ? "border-[#5a6f3c] bg-[#5a6f3c]/10"
                          : "border-white/10 hover:border-white/20 bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <SkipForward
                          className={`w-4 h-4 ${
                            selectedMode === "skip" ? "text-[#5a6f3c]" : "text-white/50"
                          }`}
                        />
                        <span
                          className={`text-sm font-medium ${
                            selectedMode === "skip" ? "text-white" : "text-white/70"
                          }`}
                        >
                          {t.skipDuplicates}
                        </span>
                      </div>
                      <p className="text-xs text-white/40 pl-6">{t.skipDuplicatesDesc}</p>
                    </button>

                    <button
                      onClick={() => setSelectedMode("overwrite")}
                      className={`p-3 rounded-lg border transition-all text-left ${
                        selectedMode === "overwrite"
                          ? "border-amber-500 bg-amber-500/10"
                          : "border-white/10 hover:border-white/20 bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <RefreshCw
                          className={`w-4 h-4 ${
                            selectedMode === "overwrite" ? "text-amber-400" : "text-white/50"
                          }`}
                        />
                        <span
                          className={`text-sm font-medium ${
                            selectedMode === "overwrite" ? "text-white" : "text-white/70"
                          }`}
                        >
                          {t.overwriteDuplicates}
                        </span>
                      </div>
                      <p className="text-xs text-white/40 pl-6">{t.overwriteDuplicatesDesc}</p>
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 p-4 border-t border-white/10">
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="flex-1 text-white/60 hover:text-white hover:bg-white/10"
                >
                  {t.cancel}
                </Button>
                <Button
                  onClick={handleConfirm}
                  className="flex-1 bg-[#5a6f3c] hover:bg-[#6b8046] text-white"
                >
                  {t.import} ({selectedMode === "skip" ? newItems.length : items.length})
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
