import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Square, RectangleVertical, RectangleHorizontal, X, Sparkles, QrCode, Sun, Stamp, RotateCcw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useDecoderLanguage } from "@/contexts/DecoderLanguageContext";

type AspectRatio = "1:1" | "9:16" | "16:9";

export interface ImageExportOptions {
  includeQrCode: boolean;
  lightTheme: boolean;
  includeBranding: boolean;
}

// UI translations for ImagePreviewDialog
const translations = {
  en: {
    previewTitle: "Preview Image",
    generating: "Generating preview",
    failedToGenerate: "Failed to generate preview",
    retry: "Retry",
    download: "Download",
    square: "Square 1:1",
    portrait: "Portrait 9:16",
    landscape: "Landscape 16:9",
    qrCode: "QR Code",
    qrCodeDescription: "Add scannable QR code",
    lightTheme: "Light Theme",
    lightThemeDescription: "Use light background",
    branding: "Branding",
    brandingDescription: "Include Buoyancis watermark",
  },
  zh: {
    previewTitle: "預覽圖片",
    generating: "生成預覽中",
    failedToGenerate: "無法生成預覽",
    retry: "重試",
    download: "下載",
    square: "方形 1:1",
    portrait: "直式 9:16",
    landscape: "橫式 16:9",
    qrCode: "QR Code",
    qrCodeDescription: "添加可掃描的 QR Code",
    lightTheme: "亮色主題",
    lightThemeDescription: "使用淺色背景",
    branding: "品牌標誌",
    brandingDescription: "包含 Buoyancis 浮水印",
  },
  ja: {
    previewTitle: "画像プレビュー",
    generating: "プレビュー生成中",
    failedToGenerate: "プレビュー生成失敗",
    retry: "再試行",
    download: "ダウンロード",
    square: "正方形 1:1",
    portrait: "縦長 9:16",
    landscape: "横長 16:9",
    qrCode: "QRコード",
    qrCodeDescription: "スキャン可能なQRコードを追加",
    lightTheme: "ライトテーマ",
    lightThemeDescription: "明るい背景を使用",
    branding: "ブランディング",
    brandingDescription: "Buoyancis透かしを含める",
  },
  ko: {
    previewTitle: "이미지 미리보기",
    generating: "미리보기 생성 중",
    failedToGenerate: "미리보기 생성 실패",
    retry: "다시 시도",
    download: "다운로드",
    square: "정사각형 1:1",
    portrait: "세로 9:16",
    landscape: "가로 16:9",
    qrCode: "QR 코드",
    qrCodeDescription: "스캔 가능한 QR 코드 추가",
    lightTheme: "라이트 테마",
    lightThemeDescription: "밝은 배경 사용",
    branding: "브랜딩",
    brandingDescription: "Buoyancis 워터마크 포함",
  },
};

interface ImagePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRatio: AspectRatio;
  onRatioChange: (ratio: AspectRatio) => void;
  onDownload: (ratio: AspectRatio, options: ImageExportOptions) => Promise<void>;
  generatePreview: (ratio: AspectRatio, options: ImageExportOptions) => Promise<string | null>;
  isGenerating: boolean;
  shareUrl: string;
}

const getRatioConfig = (t: typeof translations.en): Record<AspectRatio, { label: string; icon: React.ReactNode; platform: string; previewClass: string }> => ({
  "1:1": { 
    label: t.square, 
    icon: <Square className="w-4 h-4" />, 
    platform: "Instagram",
    previewClass: "aspect-square max-w-[300px]"
  },
  "9:16": { 
    label: t.portrait, 
    icon: <RectangleVertical className="w-4 h-4" />, 
    platform: "Stories",
    previewClass: "aspect-[9/16] max-w-[200px]"
  },
  "16:9": { 
    label: t.landscape, 
    icon: <RectangleHorizontal className="w-4 h-4" />, 
    platform: "Twitter",
    previewClass: "aspect-video max-w-[400px]"
  },
});

const ImagePreviewDialog = ({
  open,
  onOpenChange,
  selectedRatio,
  onRatioChange,
  onDownload,
  generatePreview,
  isGenerating,
  shareUrl,
}: ImagePreviewDialogProps) => {
  const { language } = useDecoderLanguage();
  const t = translations[language];
  const ratioConfig = getRatioConfig(t);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [includeQrCode, setIncludeQrCode] = useState(false);
  const [includeBranding, setIncludeBranding] = useState(true);
  const [lightTheme, setLightTheme] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const downloadProgressRef = useRef<NodeJS.Timeout | null>(null);

  // Simulate loading progress for better UX
  const startProgressSimulation = () => {
    setLoadingProgress(0);
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    let progress = 0;
    progressIntervalRef.current = setInterval(() => {
      // Easing function for more natural progress
      const remaining = 90 - progress;
      const increment = Math.max(0.5, remaining * 0.08);
      progress = Math.min(90, progress + increment);
      setLoadingProgress(progress);
    }, 50);
  };

  const completeProgress = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setLoadingProgress(100);
    setTimeout(() => setLoadingProgress(0), 300);
  };

  // Download progress simulation
  const startDownloadProgress = () => {
    setDownloadProgress(0);
    if (downloadProgressRef.current) {
      clearInterval(downloadProgressRef.current);
    }
    
    let progress = 0;
    downloadProgressRef.current = setInterval(() => {
      const remaining = 90 - progress;
      const increment = Math.max(1, remaining * 0.12);
      progress = Math.min(90, progress + increment);
      setDownloadProgress(progress);
    }, 40);
  };

  const completeDownloadProgress = () => {
    if (downloadProgressRef.current) {
      clearInterval(downloadProgressRef.current);
      downloadProgressRef.current = null;
    }
    setDownloadProgress(100);
    setTimeout(() => setDownloadProgress(0), 300);
  };

  const exportOptions: ImageExportOptions = { includeQrCode, lightTheme, includeBranding };

  // Generate preview function (extracted for reuse)
  const loadPreview = async () => {
    setIsLoadingPreview(true);
    setPreviewUrl(null);
    setHasError(false);
    startProgressSimulation();
    try {
      const url = await generatePreview(selectedRatio, { includeQrCode, lightTheme, includeBranding });
      if (url) {
        setPreviewUrl(url);
        setHasError(false);
      } else {
        setHasError(true);
      }
      completeProgress();
    } catch (error) {
      console.error("Failed to generate preview:", error);
      setHasError(true);
      completeProgress();
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Generate preview when ratio changes or dialog opens or options change
  useEffect(() => {
    if (open && selectedRatio) {
      loadPreview();
    }
  }, [open, selectedRatio, generatePreview, includeQrCode, lightTheme, includeBranding]);

  // Handle retry
  const handleRetry = () => {
    loadPreview();
  };

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (downloadProgressRef.current) {
        clearInterval(downloadProgressRef.current);
      }
    };
  }, []);

  // Clean up preview URL when dialog closes
  useEffect(() => {
    if (!open) {
      setPreviewUrl(null);
    }
  }, [open]);

  const handleDownload = async () => {
    setIsDownloading(true);
    startDownloadProgress();
    try {
      await onDownload(selectedRatio, exportOptions);
      completeDownloadProgress();
      onOpenChange(false);
    } catch (error) {
      console.error("Download failed:", error);
      completeDownloadProgress();
    } finally {
      setIsDownloading(false);
    }
  };

  const currentConfig = ratioConfig[selectedRatio];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black/95 border-white/20 backdrop-blur-xl max-w-[500px] p-0 overflow-hidden">
        {/* Custom close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none text-white/60 hover:text-white"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-white font-mono text-sm uppercase tracking-[0.2em] text-center">
            {t.previewTitle}
          </DialogTitle>
        </DialogHeader>

        {/* Ratio selector tabs */}
        <div className="flex justify-center gap-2 px-6 pb-4">
          {(Object.keys(ratioConfig) as AspectRatio[]).map((ratio) => {
            const r = ratioConfig[ratio];
            const isActive = ratio === selectedRatio;
            return (
              <button
                key={ratio}
                onClick={() => onRatioChange(ratio)}
                className={`
                  flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all duration-200
                  ${isActive 
                    ? "bg-white/15 border border-white/30 text-white" 
                    : "bg-white/5 border border-transparent text-white/50 hover:bg-white/10 hover:text-white/70"
                  }
                `}
              >
                {r.icon}
                <span className="text-[10px] font-mono uppercase tracking-wider">{r.platform}</span>
              </button>
            );
          })}
        </div>

        {/* Preview area */}
        <div className="flex flex-col items-center justify-center p-6 pt-2 min-h-[280px]">
          {isLoadingPreview ? (
            <div className="flex flex-col items-center gap-4 w-full max-w-[300px]">
              {/* Skeleton with shimmer effect - use explicit aspect ratio container */}
              <div 
                className={`w-full rounded-lg overflow-hidden border border-white/10 bg-white/5 relative ${
                  selectedRatio === "1:1" ? "aspect-square max-w-[200px]" :
                  selectedRatio === "9:16" ? "aspect-[9/16] max-w-[140px]" :
                  "aspect-video max-w-[280px]"
                }`}
              >
                {/* Animated shimmer overlay */}
                <div className="absolute inset-0 overflow-hidden">
                  <div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent"
                    style={{ animation: 'shimmer 1.5s infinite' }} 
                  />
                </div>
                
                {/* Center icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <Sparkles className="w-8 h-8 text-[#5a6f3c]/60 animate-pulse" />
                    <div className="absolute inset-0 blur-xl bg-[#5a6f3c]/20 animate-pulse" />
                  </div>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="w-full space-y-2">
                <Progress 
                  value={loadingProgress} 
                  className="h-1 bg-white/10 [&>div]:bg-[#5a6f3c]/70"
                />
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider">
                  <span className="text-white/40 flex items-center gap-1.5">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {t.generating}
                  </span>
                  <span className="text-white/30">
                    {Math.round(loadingProgress)}%
                  </span>
                </div>
              </div>
            </div>
          ) : previewUrl ? (
            <div 
              className={`${currentConfig.previewClass} w-full rounded-lg overflow-hidden border border-white/10 shadow-2xl shadow-black/50 transition-all duration-300 animate-scale-in`}
            >
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="w-full h-full object-cover"
              />
            </div>
          ) : hasError ? (
            <div className="flex flex-col items-center gap-4">
              <div className="text-white/30 text-sm font-mono text-center">
                {t.failedToGenerate}
              </div>
              <Button
                onClick={handleRetry}
                variant="outline"
                className="bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-white/20 font-mono text-xs uppercase tracking-wider gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                {t.retry}
              </Button>
            </div>
          ) : (
            <div className="text-white/30 text-sm font-mono">
              {t.failedToGenerate}
            </div>
          )}
        </div>

        {/* Footer with options and download button */}
        <div className="flex flex-col gap-3 px-6 py-4 border-t border-white/10 bg-white/5">
          {/* QR Code toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-white/50" />
              <Label htmlFor="qr-toggle" className="text-white/70 text-xs font-mono cursor-pointer">
                {t.qrCode}
              </Label>
            </div>
            <Switch
              id="qr-toggle"
              checked={includeQrCode}
              onCheckedChange={setIncludeQrCode}
              className="data-[state=checked]:bg-[#5a6f3c]"
            />
          </div>

          {/* Light Theme toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-white/50" />
              <Label htmlFor="theme-toggle" className="text-white/70 text-xs font-mono cursor-pointer">
                {t.lightTheme}
              </Label>
            </div>
            <Switch
              id="theme-toggle"
              checked={lightTheme}
              onCheckedChange={setLightTheme}
              className="data-[state=checked]:bg-[#5a6f3c]"
            />
          </div>

          {/* Branding toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Stamp className="w-4 h-4 text-white/50" />
              <Label htmlFor="branding-toggle" className="text-white/70 text-xs font-mono cursor-pointer">
                {t.branding}
              </Label>
            </div>
            <Switch
              id="branding-toggle"
              checked={includeBranding}
              onCheckedChange={setIncludeBranding}
              className="data-[state=checked]:bg-[#5a6f3c]"
            />
          </div>

          {/* Size info and download */}
          <div className="flex items-center justify-between">
            <div className="text-white/40 text-xs font-mono">
              <span className="text-white/60">{currentConfig.label}</span>
              <span className="mx-2">·</span>
              <span>{currentConfig.platform}</span>
            </div>
            <Button
              onClick={handleDownload}
              disabled={isGenerating || isLoadingPreview || isDownloading || !previewUrl}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-mono text-xs uppercase tracking-wider relative overflow-hidden min-w-[120px]"
            >
              {/* Download progress bar */}
              {isDownloading && (
                <div 
                  className="absolute inset-0 bg-[#5a6f3c]/30 transition-all duration-100"
                  style={{ width: `${downloadProgress}%` }}
                />
              )}
              <span className="relative z-10 flex items-center">
                {isGenerating || isDownloading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                {isDownloading ? `${Math.round(downloadProgress)}%` : t.download}
              </span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImagePreviewDialog;
