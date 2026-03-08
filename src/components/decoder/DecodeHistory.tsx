import { useState, useMemo, useRef, useCallback } from "react";
import { History, X, Trash2, ChevronDown, ChevronUp, Search, Download, FileJson, FileSpreadsheet, ArrowUpDown, Clock, SortAsc, SortDesc, Upload, Tag, Plus, Cloud, CloudOff, RefreshCw, Loader2, Star, CheckSquare, Square, MinusSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
import { useToast } from "@/hooks/use-toast";
import { decodeWord, getTotemString } from "@/lib/buoyancisDecoder";
import { useDecoderLanguage } from "@/contexts/DecoderLanguageContext";
import type { DecodeHistoryItem } from "@/hooks/useDecodeHistory";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileActionSheet } from "./MobileActionSheet";
import { HistoryItemWrapper } from "./HistoryItemWrapper";
import { ImportPreviewDialog, type ImportMode } from "./ImportPreviewDialog";

// Translations for the history panel
const translations = {
  en: {
    title: "Decode History",
    export: "Export",
    exportAsJson: "Export as JSON",
    exportAsCsv: "Export as CSV",
    import: "Import",
    clear: "Clear",
    filterPlaceholder: "Filter history...",
    sortNew: "New",
    sortOld: "Old",
    all: "All",
    newTag: "New tag...",
    existingTags: "Existing tags",
    showLess: "Show Less",
    showMore: "Show {count} More",
    noTagMatches: 'No items with tag "{tag}"',
    noSearchMatches: 'No matches found for "{query}"',
    justNow: "just now",
    secondsAgo: "{n}s ago",
    minutesAgo: "{n}m ago",
    hoursAgo: "{n}h ago",
    daysAgo: "{n}d ago",
    weeksAgo: "{n}w ago",
    today: "Today",
    yesterday: "Yesterday",
    exported: "Exported",
    exportedItems: "{count} items saved as {format}",
    exportFailed: "Export Failed",
    exportFailedDesc: "Could not export history",
    imported: "Imported",
    importedItems: "{added} items added",
    importedSkipped: "{added} items added, {skipped} skipped (duplicates)",
    importedOverwritten: "{added} new, {overwritten} replaced",
    importFailed: "Import Failed",
    importFailedNoItems: "No valid history items found in file",
    importFailedSyntax: "JSON syntax error: The file contains invalid JSON. Check for missing quotes or brackets.",
    importFailedFormat: "Invalid format: File must contain an array of history items with 'word' field.",
    tagAdded: "Tag added",
    tagAddedDesc: '"{tag}" added to {word}',
    tagRemoved: "Tag removed",
    tagRemovedDesc: '"{tag}" removed from {word}',
    cloudSync: "Cloud Sync",
    cloudSyncOn: "Cloud sync enabled",
    cloudSyncOff: "Sign in to sync across devices",
    syncing: "Syncing...",
    syncNow: "Sync now",
    lastSync: "Last synced: {time}",
    syncToCloud: "Sync to cloud",
    syncComplete: "Sync complete",
    syncCompleteDesc: "History synced to cloud",
    favorites: "Favorites",
    addToFavorites: "Add to favorites",
    removeFromFavorites: "Remove from favorites",
    favoriteAdded: "Added to favorites",
    favoriteRemoved: "Removed from favorites",
    pinned: "Pinned to top",
    selectMode: "Select",
    selectAll: "Select all",
    deselectAll: "Deselect all",
    deleteSelected: "Delete selected",
    selectedCount: "{count} selected",
    confirmBulkDelete: "Delete {count} items?",
    bulkDeleted: "{count} items deleted",
    cancel: "Cancel",
  },
  zh: {
    title: "解碼歷史",
    export: "匯出",
    exportAsJson: "匯出為 JSON",
    exportAsCsv: "匯出為 CSV",
    import: "匯入",
    clear: "清除",
    filterPlaceholder: "過濾歷史記錄...",
    sortNew: "最新",
    sortOld: "最舊",
    all: "全部",
    newTag: "新標籤...",
    existingTags: "現有標籤",
    showLess: "收起",
    showMore: "顯示更多 {count} 項",
    noTagMatches: '沒有標籤為「{tag}」的項目',
    noSearchMatches: '找不到「{query}」的匹配結果',
    justNow: "剛才",
    secondsAgo: "{n} 秒前",
    minutesAgo: "{n} 分鐘前",
    hoursAgo: "{n} 小時前",
    daysAgo: "{n} 天前",
    weeksAgo: "{n} 週前",
    today: "今天",
    yesterday: "昨天",
    exported: "已匯出",
    exportedItems: "{count} 項已儲存為 {format}",
    exportFailed: "匯出失敗",
    exportFailedDesc: "無法匯出歷史記錄",
    imported: "已匯入",
    importedItems: "已添加 {added} 項",
    importedSkipped: "已添加 {added} 項，跳過 {skipped} 項（重複）",
    importedOverwritten: "新增 {added} 項，覆蓋 {overwritten} 項",
    importFailed: "匯入失敗",
    importFailedNoItems: "在檔案中找不到有效的歷史記錄",
    importFailedSyntax: "JSON 語法錯誤：檔案包含無效的 JSON。請檢查是否有缺少引號或括號。",
    importFailedFormat: "格式不符：檔案必須包含具有 'word' 欄位的歷史記錄陣列。",
    tagAdded: "已添加標籤",
    tagAddedDesc: '「{tag}」已添加到 {word}',
    tagRemoved: "已移除標籤",
    tagRemovedDesc: '「{tag}」已從 {word} 移除',
    cloudSync: "雲端同步",
    cloudSyncOn: "雲端同步已啟用",
    cloudSyncOff: "登入以跨裝置同步",
    syncing: "同步中...",
    syncNow: "立即同步",
    lastSync: "上次同步：{time}",
    syncToCloud: "同步到雲端",
    syncComplete: "同步完成",
    syncCompleteDesc: "歷史記錄已同步到雲端",
    favorites: "收藏",
    addToFavorites: "加入收藏",
    removeFromFavorites: "取消收藏",
    favoriteAdded: "已加入收藏",
    favoriteRemoved: "已取消收藏",
    pinned: "已置頂",
    selectMode: "選擇",
    selectAll: "全選",
    deselectAll: "取消全選",
    deleteSelected: "刪除所選",
    selectedCount: "已選擇 {count} 項",
    confirmBulkDelete: "確定刪除 {count} 項？",
    bulkDeleted: "已刪除 {count} 項",
    cancel: "取消",
  },
  ja: {
    title: "デコード履歴",
    export: "エクスポート",
    exportAsJson: "JSONでエクスポート",
    exportAsCsv: "CSVでエクスポート",
    import: "インポート",
    clear: "クリア",
    filterPlaceholder: "履歴を検索...",
    sortNew: "新しい",
    sortOld: "古い",
    all: "すべて",
    newTag: "新しいタグ...",
    existingTags: "既存のタグ",
    showLess: "折りたたむ",
    showMore: "さらに {count} 件表示",
    noTagMatches: 'タグ「{tag}」の項目はありません',
    noSearchMatches: '「{query}」に一致する結果がありません',
    justNow: "たった今",
    secondsAgo: "{n}秒前",
    minutesAgo: "{n}分前",
    hoursAgo: "{n}時間前",
    daysAgo: "{n}日前",
    weeksAgo: "{n}週間前",
    today: "今日",
    yesterday: "昨日",
    exported: "エクスポート完了",
    exportedItems: "{count} 件を {format} で保存しました",
    exportFailed: "エクスポート失敗",
    exportFailedDesc: "履歴をエクスポートできませんでした",
    imported: "インポート完了",
    importedItems: "{added} 件を追加しました",
    importedSkipped: "{added} 件追加、{skipped} 件スキップ（重複）",
    importedOverwritten: "{added} 件新規、{overwritten} 件置換",
    importFailed: "インポート失敗",
    importFailedNoItems: "ファイルに有効な履歴項目がありません",
    importFailedSyntax: "JSON構文エラー：ファイルに無効なJSONが含まれています。引用符や括弧が不足していないか確認してください。",
    importFailedFormat: "形式エラー：ファイルには「word」フィールドを持つ履歴項目の配列が必要です。",
    tagAdded: "タグを追加しました",
    tagAddedDesc: '「{tag}」を {word} に追加しました',
    tagRemoved: "タグを削除しました",
    tagRemovedDesc: '「{tag}」を {word} から削除しました',
    cloudSync: "クラウド同期",
    cloudSyncOn: "クラウド同期が有効です",
    cloudSyncOff: "サインインしてデバイス間で同期",
    syncing: "同期中...",
    syncNow: "今すぐ同期",
    lastSync: "最終同期: {time}",
    syncToCloud: "クラウドに同期",
    syncComplete: "同期完了",
    syncCompleteDesc: "履歴がクラウドに同期されました",
    favorites: "お気に入り",
    addToFavorites: "お気に入りに追加",
    removeFromFavorites: "お気に入りから削除",
    favoriteAdded: "お気に入りに追加しました",
    favoriteRemoved: "お気に入りから削除しました",
    pinned: "トップに固定",
    selectMode: "選択",
    selectAll: "すべて選択",
    deselectAll: "選択解除",
    deleteSelected: "選択を削除",
    selectedCount: "{count}件選択中",
    confirmBulkDelete: "{count}件を削除しますか？",
    bulkDeleted: "{count}件を削除しました",
    cancel: "キャンセル",
  },
  ko: {
    title: "디코드 기록",
    export: "내보내기",
    exportAsJson: "JSON으로 내보내기",
    exportAsCsv: "CSV로 내보내기",
    import: "가져오기",
    clear: "지우기",
    filterPlaceholder: "기록 검색...",
    sortNew: "최신",
    sortOld: "오래된",
    all: "전체",
    newTag: "새 태그...",
    existingTags: "기존 태그",
    showLess: "접기",
    showMore: "{count}개 더 보기",
    noTagMatches: '태그 "{tag}"가 있는 항목이 없습니다',
    noSearchMatches: '"{query}"에 대한 검색 결과가 없습니다',
    justNow: "방금",
    secondsAgo: "{n}초 전",
    minutesAgo: "{n}분 전",
    hoursAgo: "{n}시간 전",
    daysAgo: "{n}일 전",
    weeksAgo: "{n}주 전",
    today: "오늘",
    yesterday: "어제",
    exported: "내보내기 완료",
    exportedItems: "{count}개 항목을 {format}로 저장했습니다",
    exportFailed: "내보내기 실패",
    exportFailedDesc: "기록을 내보낼 수 없습니다",
    imported: "가져오기 완료",
    importedItems: "{added}개 항목 추가됨",
    importedSkipped: "{added}개 추가, {skipped}개 건너뜀 (중복)",
    importedOverwritten: "{added}개 신규, {overwritten}개 교체",
    importFailed: "가져오기 실패",
    importFailedNoItems: "파일에 유효한 기록 항목이 없습니다",
    importFailedSyntax: "JSON 구문 오류: 파일에 잘못된 JSON이 포함되어 있습니다. 따옴표나 괄호가 누락되지 않았는지 확인하세요.",
    importFailedFormat: "형식 오류: 파일에는 'word' 필드가 있는 기록 항목 배열이 포함되어야 합니다.",
    tagAdded: "태그 추가됨",
    tagAddedDesc: '"{tag}"가 {word}에 추가되었습니다',
    tagRemoved: "태그 삭제됨",
    tagRemovedDesc: '"{tag}"가 {word}에서 삭제되었습니다',
    cloudSync: "클라우드 동기화",
    cloudSyncOn: "클라우드 동기화 활성화됨",
    cloudSyncOff: "로그인하여 기기 간 동기화",
    syncing: "동기화 중...",
    syncNow: "지금 동기화",
    lastSync: "마지막 동기화: {time}",
    syncToCloud: "클라우드에 동기화",
    syncComplete: "동기화 완료",
    syncCompleteDesc: "기록이 클라우드에 동기화되었습니다",
    favorites: "즐겨찾기",
    addToFavorites: "즐겨찾기에 추가",
    removeFromFavorites: "즐겨찾기에서 삭제",
    favoriteAdded: "즐겨찾기에 추가됨",
    favoriteRemoved: "즐겨찾기에서 삭제됨",
    pinned: "상단에 고정됨",
    selectMode: "선택",
    selectAll: "모두 선택",
    deselectAll: "선택 해제",
    deleteSelected: "선택 삭제",
    selectedCount: "{count}개 선택됨",
    confirmBulkDelete: "{count}개를 삭제하시겠습니까?",
    bulkDeleted: "{count}개 삭제됨",
    cancel: "취소",
  },
};

interface DecodeHistoryProps {
  history: DecodeHistoryItem[];
  onSelect: (word: string) => void;
  onRemove: (word: string) => void;
  onClear: () => void;
  onImport: (items: DecodeHistoryItem[], mode?: "skip" | "overwrite") => { added: number; skipped: number; overwritten: number };
  availableTags: string[];
  onAddTagToItem: (word: string, tag: string) => void;
  onRemoveTagFromItem: (word: string, tag: string) => void;
  onToggleFavorite: (word: string) => void;
  // Cloud sync props
  isLoggedIn?: boolean;
  isSyncing?: boolean;
  lastSyncTime?: Date | null;
  onSyncToCloud?: () => Promise<void>;
}

type SortOption = "newest" | "oldest" | "a-z" | "z-a";
type FilterOption = "all" | "favorites";

const DecodeHistory = ({ 
  history, 
  onSelect, 
  onRemove, 
  onClear, 
  onImport,
  availableTags,
  onAddTagToItem,
  onRemoveTagFromItem,
  onToggleFavorite,
  isLoggedIn = false,
  isSyncing = false,
  lastSyncTime,
  onSyncToCloud,
}: DecodeHistoryProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [filterOption, setFilterOption] = useState<FilterOption>("all");
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const [newTagInput, setNewTagInput] = useState("");
  const [activeTagPopover, setActiveTagPopover] = useState<string | null>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionSheetItem, setActionSheetItem] = useState<DecodeHistoryItem | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [pendingImportItems, setPendingImportItems] = useState<DecodeHistoryItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { language } = useDecoderLanguage();
  const t = translations[language];
  const isMobile = useIsMobile();

  // Compute existing words set for import preview
  const existingWordsSet = useMemo(() => {
    return new Set(history.map(item => item.word.toUpperCase()));
  }, [history]);

  // Filter and sort history - must be before early return
  const filteredAndSortedHistory = useMemo(() => {
    let result = history;
    
    // Apply favorites filter
    if (filterOption === "favorites") {
      result = result.filter((item) => item.isFavorite);
    }
    
    // Apply tag filter
    if (selectedTagFilter) {
      result = result.filter((item) => 
        item.tags?.includes(selectedTagFilter)
      );
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((item) => 
        item.word.toLowerCase().includes(query) ||
        item.tags?.some(tag => tag.includes(query))
      );
    }
    
    // Apply sorting - favorites always come first (pinned to top)
    return [...result].sort((a, b) => {
      // Favorites are always pinned to top
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      
      // Then apply the selected sort option
      switch (sortOption) {
        case "newest":
          return b.timestamp - a.timestamp;
        case "oldest":
          return a.timestamp - b.timestamp;
        case "a-z":
          return a.word.toLowerCase().localeCompare(b.word.toLowerCase());
        case "z-a":
          return b.word.toLowerCase().localeCompare(a.word.toLowerCase());
        default:
          return 0;
      }
    });
  }, [history, searchQuery, sortOption, selectedTagFilter, filterOption]);

  const displayedHistory = isExpanded ? filteredAndSortedHistory : filteredAndSortedHistory.slice(0, 5);
  const hasMoreItems = filteredAndSortedHistory.length > 5;
  const favoriteCount = history.filter(item => item.isFavorite).length;

  // Selection helpers
  const displayedWords = useMemo(() => new Set(displayedHistory.map(item => item.word)), [displayedHistory]);
  const allDisplayedSelected = displayedHistory.length > 0 && displayedHistory.every(item => selectedItems.has(item.word));
  const someDisplayedSelected = displayedHistory.some(item => selectedItems.has(item.word));

  const toggleSelectItem = (word: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(word)) {
        next.delete(word);
      } else {
        next.add(word);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allDisplayedSelected) {
      // Deselect all displayed
      setSelectedItems(prev => {
        const next = new Set(prev);
        displayedHistory.forEach(item => next.delete(item.word));
        return next;
      });
    } else {
      // Select all displayed
      setSelectedItems(prev => {
        const next = new Set(prev);
        displayedHistory.forEach(item => next.add(item.word));
        return next;
      });
    }
  };

  const handleBulkDelete = () => {
    const count = selectedItems.size;
    selectedItems.forEach(word => onRemove(word));
    setSelectedItems(new Set());
    setIsSelectMode(false);
    setShowDeleteConfirm(false);
    toast({
      title: t.bulkDeleted.replace("{count}", String(count)),
    });
  };

  const exitSelectMode = () => {
    setIsSelectMode(false);
    setSelectedItems(new Set());
    setShowDeleteConfirm(false);
  };

  // Mobile action sheet handlers
  const handleLongPress = useCallback((item: DecodeHistoryItem) => {
    if (!isSelectMode) {
      setActionSheetItem(item);
      setShowActionSheet(true);
    }
  }, [isSelectMode]);

  const handleCloseActionSheet = useCallback(() => {
    setShowActionSheet(false);
    setActionSheetItem(null);
  }, []);

  const handleActionSheetAddTag = useCallback((word: string) => {
    // Open the tag popover for this word
    setActiveTagPopover(word);
  }, []);

  const handleActionSheetShare = useCallback((word: string) => {
    // Copy shareable link to clipboard
    const shareUrl = `${window.location.origin}/tools/decoder?word=${encodeURIComponent(word)}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: language === "zh" ? "已複製分享連結" : language === "ja" ? "共有リンクをコピーしました" : language === "ko" ? "공유 링크 복사됨" : "Share link copied",
    });
  }, [language, toast]);

  // Handle import confirmation from preview dialog
  const handleImportConfirm = useCallback((mode: ImportMode) => {
    const { added, skipped, overwritten } = onImport(pendingImportItems, mode);
    
    let description: string;
    if (mode === "overwrite" && overwritten > 0) {
      description = t.importedOverwritten
        .replace("{added}", String(added))
        .replace("{overwritten}", String(overwritten));
    } else if (skipped > 0) {
      description = t.importedSkipped
        .replace("{added}", String(added))
        .replace("{skipped}", String(skipped));
    } else {
      description = t.importedItems.replace("{added}", String(added));
    }
    
    toast({
      title: t.imported,
      description,
    });
    
    setPendingImportItems([]);
  }, [onImport, pendingImportItems, t, toast]);

  // Handle import from JSON file
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        
        // Step 1: Try to parse JSON - catch syntax errors
        let parsed: unknown;
        try {
          parsed = JSON.parse(content);
        } catch (jsonError) {
          toast({
            title: t.importFailed,
            description: t.importFailedSyntax,
            variant: "destructive",
          });
          return;
        }
        
        // Step 2: Validate the structure - must be an array
        if (!Array.isArray(parsed)) {
          toast({
            title: t.importFailed,
            description: t.importFailedFormat,
            variant: "destructive",
          });
          return;
        }
        
        // Step 3: Map and filter valid items
        const itemsToImport: DecodeHistoryItem[] = parsed
          .filter((item: unknown): item is Record<string, unknown> => 
            typeof item === 'object' && item !== null && 'word' in item
          )
          .map((item) => ({
            word: String(item.word || ''),
            timestamp: item.decodedAt 
              ? new Date(String(item.decodedAt)).getTime() 
              : (typeof item.timestamp === 'number' ? item.timestamp : Date.now()),
            isFavorite: Boolean(item.isFavorite),
            tags: Array.isArray(item.tags) ? item.tags.filter((t): t is string => typeof t === 'string') : undefined,
          }))
          .filter((item) => item.word.trim() !== '');

        // Step 4: Check if any valid items were found
        if (itemsToImport.length === 0) {
          toast({
            title: t.importFailed,
            description: parsed.length > 0 ? t.importFailedFormat : t.importFailedNoItems,
            variant: "destructive",
          });
          return;
        }

        // Step 5: Check for duplicates and proceed
        const hasDuplicates = itemsToImport.some(item => 
          existingWordsSet.has(item.word.trim().toUpperCase())
        );

        if (hasDuplicates) {
          setPendingImportItems(itemsToImport);
          setShowImportPreview(true);
        } else {
          const { added } = onImport(itemsToImport, "skip");
          toast({
            title: t.imported,
            description: t.importedItems.replace("{added}", String(added)),
          });
        }
      } catch (error) {
        // Unexpected error fallback
        toast({
          title: t.importFailed,
          description: t.importFailedFormat,
          variant: "destructive",
        });
      }
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    
    reader.readAsText(file);
  };

  // Early return after all hooks
  if (history.length === 0) return null;

  const getLocale = () => {
    switch (language) {
      case "zh": return "zh-TW";
      case "ja": return "ja-JP";
      case "ko": return "ko-KR";
      default: return "en-US";
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffDays / 7);

    // Check if same day
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (diffSecs < 10) return t.justNow;
    if (diffSecs < 60) return t.secondsAgo.replace("{n}", String(diffSecs));
    if (diffMins < 60) return t.minutesAgo.replace("{n}", String(diffMins));
    if (diffHours < 24 && isToday) return t.hoursAgo.replace("{n}", String(diffHours));
    if (isYesterday) return t.yesterday;
    if (diffDays < 7) return t.daysAgo.replace("{n}", String(diffDays));
    if (diffWeeks < 4) return t.weeksAgo.replace("{n}", String(diffWeeks));
    
    // For older dates, show formatted date
    return date.toLocaleDateString(getLocale(), { 
      month: "short", 
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined
    });
  };

  // Format full date and time for tooltip
  const formatFullDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString(getLocale(), {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toISOString();
  };

  // Highlight matching text in word
  const highlightMatch = (word: string) => {
    if (!searchQuery.trim()) return word;
    
    const query = searchQuery.toLowerCase().trim();
    const index = word.toLowerCase().indexOf(query);
    
    if (index === -1) return word;
    
    const before = word.slice(0, index);
    const match = word.slice(index, index + query.length);
    const after = word.slice(index + query.length);
    
    return (
      <>
        {before}
        <span className="text-[#5a6f3c] bg-[#5a6f3c]/20 px-0.5 rounded">{match}</span>
        {after}
      </>
    );
  };

  // Generate export data with decoded information
  const generateExportData = () => {
    return filteredAndSortedHistory.map((item) => {
      const decoded = decodeWord(item.word);
      const totemString = getTotemString(decoded);
      return {
        word: item.word,
        totem: totemString,
        letters: decoded.map((d) => ({
          letter: d.letter,
          concept: d.concept,
          code: d.code,
        })),
        tags: item.tags || [],
        decodedAt: formatTimestamp(item.timestamp),
      };
    });
  };

  // Export as JSON
  const handleExportJSON = () => {
    try {
      const data = generateExportData();
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `buoyancis-history-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: t.exported,
        description: t.exportedItems.replace("{count}", String(data.length)).replace("{format}", "JSON"),
      });
    } catch (error) {
      toast({
        title: t.exportFailed,
        description: t.exportFailedDesc,
        variant: "destructive",
      });
    }
  };

  // Export as CSV
  const handleExportCSV = () => {
    try {
      const data = generateExportData();
      
      // CSV header
      const headers = ["Word", "Totem", "Letters", "Concepts", "Tags", "Decoded At"];
      
      // CSV rows
      const rows = data.map((item) => [
        item.word,
        item.totem,
        item.letters.map((l) => l.letter).join(""),
        item.letters.map((l) => l.concept).join(" → "),
        item.tags.join("; "),
        item.decodedAt,
      ]);

      // Escape CSV values
      const escapeCSV = (value: string) => {
        if (value.includes(",") || value.includes('"') || value.includes("\n")) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      };

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map(escapeCSV).join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `buoyancis-history-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: t.exported,
        description: t.exportedItems.replace("{count}", String(data.length)).replace("{format}", "CSV"),
      });
    } catch (error) {
      toast({
        title: t.exportFailed,
        description: t.exportFailedDesc,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mt-12 border-t border-white/10 pt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-white/40">
          <History className="w-4 h-4" />
          <span className="text-xs font-mono uppercase tracking-widest">
            {t.title}
          </span>
          <span className="text-xs font-mono text-white/20">
            ({filteredAndSortedHistory.length}{searchQuery && ` / ${history.length}`})
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-white/30 hover:text-white/60 hover:bg-white/5 h-7 px-2"
              >
                <Download className="w-3 h-3 mr-1" />
                <span className="text-xs font-mono uppercase tracking-wider">{t.export}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="bg-black/95 border-white/20 backdrop-blur-sm"
            >
              <DropdownMenuItem 
                onClick={handleExportJSON}
                className="text-white/70 hover:text-white hover:bg-white/10 cursor-pointer font-mono text-xs uppercase tracking-wider"
              >
                <FileJson className="w-4 h-4 mr-2" />
                {t.exportAsJson}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleExportCSV}
                className="text-white/70 hover:text-white hover:bg-white/10 cursor-pointer font-mono text-xs uppercase tracking-wider"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                {t.exportAsCsv}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Import Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="text-white/30 hover:text-white/60 hover:bg-white/5 h-7 px-2"
          >
            <Upload className="w-3 h-3 mr-1" />
            <span className="text-xs font-mono uppercase tracking-wider">{t.import}</span>
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
            aria-label={t.import}
          />

          {/* Select Mode Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => isSelectMode ? exitSelectMode() : setIsSelectMode(true)}
            className={`h-7 px-2 ${
              isSelectMode 
                ? "text-red-400 hover:text-red-300 hover:bg-red-500/10" 
                : "text-white/30 hover:text-white/60 hover:bg-white/5"
            }`}
          >
            <CheckSquare className="w-3 h-3 mr-1" />
            <span className="text-xs font-mono uppercase tracking-wider">
              {isSelectMode ? t.cancel : t.selectMode}
            </span>
          </Button>

          {/* Clear Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-white/30 hover:text-white/60 hover:bg-white/5 h-7 px-2"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            <span className="text-xs font-mono uppercase tracking-wider">{t.clear}</span>
          </Button>

          {/* Cloud Sync Button */}
          {isLoggedIn ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSyncToCloud}
              disabled={isSyncing}
              className="text-[#5a6f3c]/70 hover:text-[#5a6f3c] hover:bg-[#5a6f3c]/10 h-7 px-2"
              title={lastSyncTime ? t.lastSync.replace("{time}", lastSyncTime.toLocaleTimeString()) : t.syncNow}
            >
              {isSyncing ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Cloud className="w-3 h-3 mr-1" />
              )}
              <span className="text-xs font-mono uppercase tracking-wider hidden sm:inline">
                {isSyncing ? t.syncing : t.syncToCloud}
              </span>
            </Button>
          ) : (
            <div 
              className="flex items-center gap-1 text-white/20 h-7 px-2"
              title={t.cloudSyncOff}
            >
              <CloudOff className="w-3 h-3" />
              <span className="text-xs font-mono uppercase tracking-wider hidden sm:inline">
                {t.cloudSync}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Search Filter and Sort Options */}
      {history.length > 3 && (
        <div className="flex flex-col gap-3 mb-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.filterPlaceholder}
              className="pl-10 bg-white/5 border-white/10 text-white/70 placeholder:text-white/20 font-mono text-sm h-9 focus:border-white/30 focus:ring-0"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Sort Options - Mobile optimized with horizontal scroll */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-1 -mb-1">
            <ArrowUpDown className="w-3 h-3 text-white/30 mr-1 flex-shrink-0" />
            <button
              onClick={() => setSortOption("newest")}
              className={`flex-shrink-0 px-2 py-1.5 text-[10px] sm:text-xs font-mono uppercase tracking-wider rounded transition-colors flex items-center gap-1 ${
                sortOption === "newest" 
                  ? "bg-[#5a6f3c]/30 text-[#5a6f3c] border border-[#5a6f3c]/50" 
                  : "text-white/30 hover:text-white/50 hover:bg-white/5"
              }`}
              aria-label="Sort by newest first"
            >
              <Clock className="w-3 h-3 hidden sm:inline" />
              {t.sortNew}
            </button>
            <button
              onClick={() => setSortOption("oldest")}
              className={`flex-shrink-0 px-2 py-1.5 text-[10px] sm:text-xs font-mono uppercase tracking-wider rounded transition-colors flex items-center gap-1 ${
                sortOption === "oldest" 
                  ? "bg-[#5a6f3c]/30 text-[#5a6f3c] border border-[#5a6f3c]/50" 
                  : "text-white/30 hover:text-white/50 hover:bg-white/5"
              }`}
              aria-label="Sort by oldest first"
            >
              <Clock className="w-3 h-3 hidden sm:inline" />
              {t.sortOld}
            </button>
            <button
              onClick={() => setSortOption("a-z")}
              className={`flex-shrink-0 px-2 py-1.5 text-[10px] sm:text-xs font-mono uppercase tracking-wider rounded transition-colors flex items-center gap-1 ${
                sortOption === "a-z" 
                  ? "bg-[#5a6f3c]/30 text-[#5a6f3c] border border-[#5a6f3c]/50" 
                  : "text-white/30 hover:text-white/50 hover:bg-white/5"
              }`}
              aria-label="Sort alphabetically A to Z"
            >
              <SortAsc className="w-3 h-3 hidden sm:inline" />
              A-Z
            </button>
            <button
              onClick={() => setSortOption("z-a")}
              className={`flex-shrink-0 px-2 py-1.5 text-[10px] sm:text-xs font-mono uppercase tracking-wider rounded transition-colors flex items-center gap-1 ${
                sortOption === "z-a" 
                  ? "bg-[#5a6f3c]/30 text-[#5a6f3c] border border-[#5a6f3c]/50" 
                  : "text-white/30 hover:text-white/50 hover:bg-white/5"
              }`}
              aria-label="Sort alphabetically Z to A"
            >
              <SortDesc className="w-3 h-3 hidden sm:inline" />
              Z-A
            </button>
          </div>
        </div>
      )}

      {/* Favorites Filter */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Star className="w-3 h-3 text-white/30" />
        <button
          onClick={() => setFilterOption("all")}
          className={`px-2 py-1 text-xs font-mono uppercase tracking-wider rounded transition-colors ${
            filterOption === "all"
              ? "bg-[#5a6f3c]/30 text-[#5a6f3c] border border-[#5a6f3c]/50"
              : "text-white/30 hover:text-white/50 hover:bg-white/5"
          }`}
        >
          {t.all}
        </button>
        <button
          onClick={() => setFilterOption("favorites")}
          className={`px-2 py-1 text-xs font-mono uppercase tracking-wider rounded transition-colors flex items-center gap-1 ${
            filterOption === "favorites"
              ? "bg-amber-500/30 text-amber-400 border border-amber-500/50"
              : "text-white/30 hover:text-white/50 hover:bg-white/5"
          }`}
        >
          <Star className="w-3 h-3" />
          {t.favorites} {favoriteCount > 0 && `(${favoriteCount})`}
        </button>
      </div>

      {/* Tag Filter */}
      {availableTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Tag className="w-3 h-3 text-white/30" />
          <button
            onClick={() => setSelectedTagFilter(null)}
            className={`px-2 py-1 text-xs font-mono uppercase tracking-wider rounded transition-colors ${
              selectedTagFilter === null
                ? "bg-[#5a6f3c]/30 text-[#5a6f3c] border border-[#5a6f3c]/50"
                : "text-white/30 hover:text-white/50 hover:bg-white/5"
            }`}
          >
            {t.all}
          </button>
          {availableTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTagFilter(tag === selectedTagFilter ? null : tag)}
              className={`px-2 py-1 text-xs font-mono uppercase tracking-wider rounded transition-colors ${
                selectedTagFilter === tag
                  ? "bg-[#5a6f3c]/30 text-[#5a6f3c] border border-[#5a6f3c]/50"
                  : "text-white/30 hover:text-white/50 hover:bg-white/5"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Bulk Selection Controls */}
      {isSelectMode && (
        <div className="flex items-center justify-between gap-2 mb-4 p-2 border border-white/10 rounded bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-white/50 hover:text-white/80 transition-colors"
            >
              {allDisplayedSelected ? (
                <CheckSquare className="w-4 h-4 text-[#5a6f3c]" />
              ) : someDisplayedSelected ? (
                <MinusSquare className="w-4 h-4 text-[#5a6f3c]" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {allDisplayedSelected ? t.deselectAll : t.selectAll}
            </button>
            {selectedItems.size > 0 && (
              <span className="text-xs font-mono text-[#5a6f3c]">
                {t.selectedCount.replace("{count}", String(selectedItems.size))}
              </span>
            )}
          </div>
          {selectedItems.size > 0 && (
            <div className="flex items-center gap-2">
              {showDeleteConfirm ? (
                <>
                  <span className="text-xs font-mono text-red-400">
                    {t.confirmBulkDelete.replace("{count}", String(selectedItems.size))}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="h-6 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    <span className="text-xs font-mono uppercase">{t.deleteSelected}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="h-6 px-2 text-white/40 hover:text-white/60"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="h-6 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  <span className="text-xs font-mono uppercase">{t.deleteSelected}</span>
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* History Items */}
      <div className="space-y-1.5 sm:space-y-2">
        {displayedHistory.length > 0 ? (
          displayedHistory.map((item) => (
            <HistoryItemWrapper
              key={`${item.word}-${item.timestamp}`}
              item={item}
              onLongPress={handleLongPress}
              isMobile={isMobile}
              disabled={isSelectMode}
              className={`group flex flex-col gap-1.5 sm:gap-2 p-2.5 sm:p-3 border rounded-sm transition-all duration-200 ${
                selectedItems.has(item.word)
                  ? "border-[#5a6f3c]/50 bg-[#5a6f3c]/10"
                  : item.isFavorite 
                    ? "border-amber-500/20 bg-amber-500/[0.03] hover:border-amber-500/40 hover:bg-amber-500/[0.06]" 
                    : "border-white/5 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.05]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div 
                  className="flex items-center gap-1.5 sm:gap-3 cursor-pointer flex-1 min-w-0"
                  onClick={() => isSelectMode ? toggleSelectItem(item.word) : onSelect(item.word)}
                >
                  {/* Checkbox for select mode */}
                  {isSelectMode && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectItem(item.word);
                      }}
                      className="flex-shrink-0 text-white/50 hover:text-white/80 transition-colors"
                    >
                      {selectedItems.has(item.word) ? (
                        <CheckSquare className="w-4 h-4 text-[#5a6f3c]" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  {/* Pinned indicator for favorites */}
                  {item.isFavorite && filterOption !== "favorites" && !isSelectMode && (
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex-shrink-0 text-amber-400">
                            <Star className="w-3 h-3 fill-current" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent 
                          side="top" 
                          className="bg-black/90 border-white/20 text-white/80 font-mono text-xs"
                        >
                          {t.pinned}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  <span className={`font-mono text-base sm:text-lg truncate transition-colors ${
                    item.isFavorite 
                      ? "text-amber-200/80 group-hover:text-amber-100" 
                      : "text-white/70 group-hover:text-white"
                  }`}>
                    {highlightMatch(item.word)}
                  </span>
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-[10px] sm:text-xs font-mono text-white/20 hover:text-white/40 transition-colors cursor-default flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                          <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          <span className="hidden xs:inline">{formatTime(item.timestamp)}</span>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent 
                        side="top" 
                        className="bg-black/90 border-white/20 text-white/80 font-mono text-xs"
                      >
                        {formatFullDateTime(item.timestamp)}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                  {/* Favorite Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(item.word);
                      toast({
                        title: item.isFavorite ? t.favoriteRemoved : t.favoriteAdded,
                      });
                    }}
                    className={`p-1.5 sm:p-1 transition-all ${
                      item.isFavorite 
                        ? "text-amber-400 hover:text-amber-300" 
                        : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-white/30 hover:text-amber-400"
                    }`}
                    aria-label={item.isFavorite ? t.removeFromFavorites : t.addToFavorites}
                  >
                    <Star className={`w-4 h-4 sm:w-4 sm:h-4 ${item.isFavorite ? "fill-current" : ""}`} />
                  </button>

                  {/* Add Tag Button */}
                  <Popover 
                    open={activeTagPopover === item.word} 
                    onOpenChange={(open) => {
                      setActiveTagPopover(open ? item.word : null);
                      if (!open) setNewTagInput("");
                    }}
                  >
                    <PopoverTrigger asChild>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="hidden sm:block opacity-0 group-hover:opacity-100 text-white/30 hover:text-white/60 transition-opacity p-1"
                        aria-label={`Add tag to ${item.word}`}
                      >
                        <Tag className="w-4 h-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-56 p-2 bg-black/95 border-white/20 backdrop-blur-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="space-y-2">
                        <div className="flex gap-1">
                          <Input
                            value={newTagInput}
                            onChange={(e) => setNewTagInput(e.target.value)}
                            placeholder={t.newTag}
                            className="h-7 text-xs bg-white/5 border-white/10 text-white placeholder:text-white/30"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && newTagInput.trim()) {
                                onAddTagToItem(item.word, newTagInput);
                                setNewTagInput("");
                                toast({ 
                                  title: t.tagAdded, 
                                  description: t.tagAddedDesc.replace("{tag}", newTagInput).replace("{word}", item.word)
                                });
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-white/50 hover:text-white hover:bg-white/10"
                            onClick={() => {
                              if (newTagInput.trim()) {
                                onAddTagToItem(item.word, newTagInput);
                                setNewTagInput("");
                                toast({ 
                                  title: t.tagAdded, 
                                  description: t.tagAddedDesc.replace("{tag}", newTagInput).replace("{word}", item.word)
                                });
                              }
                            }}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        {availableTags.length > 0 && (
                          <>
                            <div className="text-xs text-white/30 font-mono uppercase">{t.existingTags}</div>
                            <div className="flex flex-wrap gap-1">
                              {availableTags
                                .filter(tag => !item.tags?.includes(tag))
                                .map((tag) => (
                                  <button
                                    key={tag}
                                    onClick={() => {
                                      onAddTagToItem(item.word, tag);
                                      toast({ 
                                        title: t.tagAdded, 
                                        description: t.tagAddedDesc.replace("{tag}", tag).replace("{word}", item.word)
                                      });
                                    }}
                                    className="px-2 py-0.5 text-xs font-mono text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded transition-colors"
                                  >
                                    {tag}
                                  </button>
                                ))}
                            </div>
                          </>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Remove Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(item.word);
                    }}
                    className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-white/30 hover:text-white/60 transition-opacity p-1.5 sm:p-1"
                    aria-label={`Remove ${item.word} from history`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Tags Display */}
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pl-0 sm:pl-1">
                  {item.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-[10px] font-mono uppercase tracking-wider bg-[#5a6f3c]/10 text-[#5a6f3c] border-[#5a6f3c]/30 hover:bg-[#5a6f3c]/20 cursor-pointer group/tag"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTagFilter(tag);
                      }}
                    >
                      {tag}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveTagFromItem(item.word, tag);
                          toast({ 
                            title: t.tagRemoved, 
                            description: t.tagRemovedDesc.replace("{tag}", tag).replace("{word}", item.word)
                          });
                        }}
                        className="ml-1 opacity-0 group-hover/tag:opacity-100 hover:text-white transition-opacity"
                        aria-label={`Remove tag ${tag}`}
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </HistoryItemWrapper>
          ))
        ) : (
          <div className="text-center py-6 text-white/20 font-mono text-sm">
            {selectedTagFilter 
              ? t.noTagMatches.replace("{tag}", selectedTagFilter)
              : t.noSearchMatches.replace("{query}", searchQuery)}
          </div>
        )}
      </div>

      {/* Show More/Less */}
      {hasMoreItems && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mt-4 py-2 flex items-center justify-center gap-2 text-white/30 hover:text-white/50 transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              <span className="text-xs font-mono uppercase tracking-wider">{t.showLess}</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              <span className="text-xs font-mono uppercase tracking-wider">
                {t.showMore.replace("{count}", String(filteredAndSortedHistory.length - 5))}
              </span>
            </>
          )}
        </button>
      )}

      {/* Mobile Action Sheet */}
      {isMobile && (
        <MobileActionSheet
          item={actionSheetItem}
          isOpen={showActionSheet}
          onClose={handleCloseActionSheet}
          onDecode={(word) => onSelect(word)}
          onToggleFavorite={(word) => {
            onToggleFavorite(word);
            toast({
              title: actionSheetItem?.isFavorite ? t.favoriteRemoved : t.favoriteAdded,
            });
          }}
          onAddTag={handleActionSheetAddTag}
          onShare={handleActionSheetShare}
          onDelete={(word) => {
            onRemove(word);
            toast({
              title: language === "zh" ? "已刪除" : language === "ja" ? "削除しました" : language === "ko" ? "삭제됨" : "Deleted",
            });
          }}
        />
      )}

      {/* Import Preview Dialog */}
      <ImportPreviewDialog
        isOpen={showImportPreview}
        onClose={() => {
          setShowImportPreview(false);
          setPendingImportItems([]);
        }}
        onConfirm={handleImportConfirm}
        items={pendingImportItems}
        existingWords={existingWordsSet}
      />
    </div>
  );
};

export default DecodeHistory;
