import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Download, Twitter, Link2, Check, Loader2, Linkedin, Facebook, Share2, Square, RectangleVertical, RectangleHorizontal, MessageCircle, Send, QrCode, Eye } from "lucide-react";
import html2canvas from "html2canvas";
import { useToast } from "@/hooks/use-toast";
import type { DecodedLetter } from "@/lib/buoyancisDecoder";
import { getTotemString } from "@/lib/buoyancisDecoder";
import { useDecoderLanguage } from "@/contexts/DecoderLanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import QRCodeDialog from "@/components/QRCodeDialog";
import ImagePreviewDialog, { ImageExportOptions } from "./ImagePreviewDialog";

// UI translations for ShareTotem
const shareTranslations = {
  en: {
    preview: "Preview",
    save: "Save",
    saved: "Saved",
    share: "Share",
    shared: "Shared",
    link: "Link",
    selectSize: "Select Size",
    originalSize: "Original Size",
    more: "More...",
    downloaded: "Downloaded",
    imageSaved: "image saved",
    totemSaved: "Totem image saved",
    copied: "Copied",
    linkCopied: "Link copied to clipboard",
    error: "Error",
    failedCopy: "Failed to copy link",
    failedGenerate: "Failed to generate image",
    qrTitle: "Share via QR Code",
    qrDescription: "Scan this QR code to share the decode result",
    square: "Square 1:1",
    portrait: "Portrait 9:16",
    landscape: "Landscape 16:9",
    platformSquare: "Instagram / Profile",
    platformPortrait: "Stories / Reels / TikTok",
    platformLandscape: "Twitter / LinkedIn / YouTube",
    decodeAnyWord: "Decode any word at",
  },
  zh: {
    preview: "預覽",
    save: "儲存",
    saved: "已儲存",
    share: "分享",
    shared: "已分享",
    link: "連結",
    selectSize: "選擇尺寸",
    originalSize: "原始尺寸",
    more: "更多...",
    downloaded: "已下載",
    imageSaved: "圖片已儲存",
    totemSaved: "圖騰圖片已儲存",
    copied: "已複製",
    linkCopied: "連結已複製到剪貼簿",
    error: "錯誤",
    failedCopy: "複製連結失敗",
    failedGenerate: "生成圖片失敗",
    qrTitle: "透過 QR Code 分享",
    qrDescription: "掃描此 QR Code 分享解碼結果",
    square: "方形 1:1",
    portrait: "直式 9:16",
    landscape: "橫式 16:9",
    platformSquare: "Instagram / 大頭貼",
    platformPortrait: "Stories / Reels / TikTok",
    platformLandscape: "Twitter / LinkedIn / YouTube",
    decodeAnyWord: "在此解碼任何單詞",
  },
  ja: {
    preview: "プレビュー",
    save: "保存",
    saved: "保存完了",
    share: "共有",
    shared: "共有完了",
    link: "リンク",
    selectSize: "サイズを選択",
    originalSize: "オリジナルサイズ",
    more: "もっと...",
    downloaded: "ダウンロード完了",
    imageSaved: "画像を保存しました",
    totemSaved: "トーテム画像を保存しました",
    copied: "コピーしました",
    linkCopied: "リンクをクリップボードにコピーしました",
    error: "エラー",
    failedCopy: "リンクのコピーに失敗しました",
    failedGenerate: "画像の生成に失敗しました",
    qrTitle: "QRコードで共有",
    qrDescription: "このQRコードをスキャンしてデコード結果を共有",
    square: "正方形 1:1",
    portrait: "縦長 9:16",
    landscape: "横長 16:9",
    platformSquare: "Instagram / プロフィール",
    platformPortrait: "ストーリー / リール / TikTok",
    platformLandscape: "Twitter / LinkedIn / YouTube",
    decodeAnyWord: "任意の単語をデコード",
  },
  ko: {
    preview: "미리보기",
    save: "저장",
    saved: "저장됨",
    share: "공유",
    shared: "공유됨",
    link: "링크",
    selectSize: "크기 선택",
    originalSize: "원본 크기",
    more: "더보기...",
    downloaded: "다운로드 완료",
    imageSaved: "이미지 저장됨",
    totemSaved: "토템 이미지 저장됨",
    copied: "복사됨",
    linkCopied: "링크가 클립보드에 복사되었습니다",
    error: "오류",
    failedCopy: "링크 복사 실패",
    failedGenerate: "이미지 생성 실패",
    qrTitle: "QR 코드로 공유",
    qrDescription: "이 QR 코드를 스캔하여 디코드 결과 공유",
    square: "정사각형 1:1",
    portrait: "세로 9:16",
    landscape: "가로 16:9",
    platformSquare: "Instagram / 프로필",
    platformPortrait: "스토리 / 릴스 / TikTok",
    platformLandscape: "Twitter / LinkedIn / YouTube",
    decodeAnyWord: "모든 단어 디코드",
  },
};

interface ShareTotemProps {
  decoded: DecodedLetter[];
  inputWord: string;
  containerRef: React.RefObject<HTMLDivElement>;
}

type AspectRatio = "1:1" | "9:16" | "16:9";

const getAspectRatioConfig = (t: typeof shareTranslations.en): Record<AspectRatio, { width: number; height: number; label: string; icon: React.ReactNode; platform: string }> => ({
  "1:1": { width: 2160, height: 2160, label: t.square, icon: <Square className="w-4 h-4" />, platform: t.platformSquare },
  "9:16": { width: 1080, height: 1920, label: t.portrait, icon: <RectangleVertical className="w-4 h-4" />, platform: t.platformPortrait },
  "16:9": { width: 2560, height: 1440, label: t.landscape, icon: <RectangleHorizontal className="w-4 h-4" />, platform: t.platformLandscape },
});

const ShareTotem = ({ decoded, inputWord, containerRef }: ShareTotemProps) => {
  const { language } = useDecoderLanguage();
  const t = shareTranslations[language];
  const aspectRatioConfig = getAspectRatioConfig(t);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [shared, setShared] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewRatio, setPreviewRatio] = useState<AspectRatio>("1:1");
  const { toast } = useToast();

  // Generate a unique color based on the concept
  const getConceptColor = (concept: string): string => {
    const colorMap: Record<string, string> = {
      Asset: "rgba(212, 175, 55, 0.15)",      // Gold
      Birth: "rgba(255, 182, 193, 0.12)",     // Pink
      Care: "rgba(144, 238, 144, 0.12)",      // Green
      Depth: "rgba(70, 130, 180, 0.15)",      // Steel Blue
      Energy: "rgba(255, 165, 0, 0.15)",      // Orange
      Flow: "rgba(135, 206, 235, 0.12)",      // Sky Blue
      Growth: "rgba(34, 139, 34, 0.15)",      // Forest Green
      Harmony: "rgba(218, 165, 32, 0.12)",    // Goldenrod
      Integration: "rgba(147, 112, 219, 0.12)", // Purple
      Journey: "rgba(255, 140, 0, 0.12)",     // Dark Orange
      Knowledge: "rgba(255, 215, 0, 0.15)",   // Gold
      Light: "rgba(255, 255, 224, 0.15)",     // Light Yellow
      Motion: "rgba(100, 149, 237, 0.12)",    // Cornflower
      Network: "rgba(0, 191, 255, 0.12)",     // Deep Sky Blue
      Order: "rgba(192, 192, 192, 0.15)",     // Silver
      Power: "rgba(220, 20, 60, 0.12)",       // Crimson
      Quest: "rgba(186, 85, 211, 0.12)",      // Medium Orchid
      Rhythm: "rgba(255, 99, 71, 0.12)",      // Tomato
      Service: "rgba(60, 179, 113, 0.12)",    // Medium Sea Green
      Trust: "rgba(65, 105, 225, 0.15)",      // Royal Blue
      Unity: "rgba(255, 255, 255, 0.12)",     // White
      Vision: "rgba(138, 43, 226, 0.15)",     // Blue Violet
      Wisdom: "rgba(218, 165, 32, 0.15)",     // Goldenrod
      Exchange: "rgba(0, 206, 209, 0.12)",    // Dark Turquoise
      Yield: "rgba(154, 205, 50, 0.12)",      // Yellow Green
      Zenith: "rgba(255, 250, 205, 0.15)",    // Lemon Chiffon
    };
    return colorMap[concept] || "rgba(255, 255, 255, 0.08)";
  };

  // Draw ratio-specific premium backgrounds
  const drawBackgroundTexture = (ctx: CanvasRenderingContext2D, width: number, height: number, ratio?: AspectRatio, lightTheme: boolean = false) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) * 0.35;

    // Ratio-specific background styles
    if (ratio === "1:1") {
      // Square: Radial mandala-style pattern
      drawSquareBackground(ctx, width, height, centerX, centerY, baseRadius, lightTheme);
    } else if (ratio === "9:16") {
      // Portrait: Vertical flowing lines
      drawPortraitBackground(ctx, width, height, centerX, centerY, lightTheme);
    } else if (ratio === "16:9") {
      // Landscape: Horizontal wave pattern
      drawLandscapeBackground(ctx, width, height, centerX, centerY, lightTheme);
    } else {
      // Default: Original premium background
      drawDefaultBackground(ctx, width, height, centerX, centerY, baseRadius, lightTheme);
    }
  };

  // 1:1 Square - Mandala/circular pattern (Instagram-style)
  const drawSquareBackground = (ctx: CanvasRenderingContext2D, width: number, height: number, centerX: number, centerY: number, baseRadius: number, lightTheme: boolean = false) => {
    // Rich multi-color radial gradient
    const baseGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, width * 0.8);
    if (lightTheme) {
      baseGradient.addColorStop(0, "#fefefe");
      baseGradient.addColorStop(0.25, "#f8f9fa");
      baseGradient.addColorStop(0.5, "#f1f3f4");
      baseGradient.addColorStop(0.75, "#e8eaed");
      baseGradient.addColorStop(1, "#e0e2e5");
    } else {
      baseGradient.addColorStop(0, "#1a1a2e");
      baseGradient.addColorStop(0.25, "#16213e");
      baseGradient.addColorStop(0.5, "#0f0f23");
      baseGradient.addColorStop(0.75, "#0a0a15");
      baseGradient.addColorStop(1, "#000000");
    }
    ctx.fillStyle = baseGradient;
    ctx.fillRect(0, 0, width, height);

    // Ambient color overlay based on decoded concepts
    if (decoded.length > 0) {
      const primaryColor = getConceptColor(decoded[0].concept);
      const ambientGradient = ctx.createRadialGradient(centerX, centerY * 0.8, 0, centerX, centerY, width * 0.6);
      const ambientAlpha = lightTheme ? 0.25 : 0.15;
      ambientGradient.addColorStop(0, primaryColor.replace(/[\d.]+\)$/, `${ambientAlpha})`));
      ambientGradient.addColorStop(0.5, primaryColor.replace(/[\d.]+\)$/, `${ambientAlpha * 0.3})`));
      ambientGradient.addColorStop(1, "transparent");
      ctx.fillStyle = ambientGradient;
      ctx.fillRect(0, 0, width, height);
    }

    // Concentric circles with gradient stroke
    const accentColor = lightTheme ? "70, 91, 40" : "90, 111, 60";
    for (let i = 1; i <= 8; i++) {
      const radius = baseRadius * (0.2 + i * 0.2);
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      const alpha = lightTheme ? 0.2 - i * 0.02 : 0.12 - i * 0.012;
      ctx.strokeStyle = `rgba(${accentColor}, ${alpha})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Radial lines from center with gradient
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const gradient = ctx.createLinearGradient(
        centerX, centerY,
        centerX + Math.cos(angle) * baseRadius * 2,
        centerY + Math.sin(angle) * baseRadius * 2
      );
      const lineAlpha = lightTheme ? 0.25 : 0.15;
      gradient.addColorStop(0, `rgba(${accentColor}, ${lineAlpha})`);
      gradient.addColorStop(0.5, `rgba(${accentColor}, ${lineAlpha * 0.3})`);
      gradient.addColorStop(1, "transparent");
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(angle) * baseRadius * 2,
        centerY + Math.sin(angle) * baseRadius * 2
      );
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Concept orbital points with enhanced glow
    decoded.forEach((letter, index) => {
      const color = getConceptColor(letter.concept);
      const angle = (index / decoded.length) * Math.PI * 2 - Math.PI / 2;
      const ringRadius = baseRadius * 0.9;
      const pointX = centerX + Math.cos(angle) * ringRadius;
      const pointY = centerY + Math.sin(angle) * ringRadius;

      // Multi-layer glow effect
      for (let layer = 3; layer >= 0; layer--) {
        const glowRadius = 30 + layer * 25;
        const glow = ctx.createRadialGradient(pointX, pointY, 0, pointX, pointY, glowRadius);
        const alpha = (lightTheme ? 0.5 : 0.4) - layer * 0.1;
        glow.addColorStop(0, color.replace(/[\d.]+\)$/, `${alpha})`));
        glow.addColorStop(0.6, color.replace(/[\d.]+\)$/, `${alpha * 0.3})`));
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(pointX, pointY, glowRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Connecting lines between points
      if (index > 0) {
        const prevAngle = ((index - 1) / decoded.length) * Math.PI * 2 - Math.PI / 2;
        const prevX = centerX + Math.cos(prevAngle) * ringRadius;
        const prevY = centerY + Math.sin(prevAngle) * ringRadius;
        
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(pointX, pointY);
        ctx.strokeStyle = `rgba(${accentColor}, ${lightTheme ? 0.25 : 0.15})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });

    // Corner diamond accents with glow
    const cornerSize = width * 0.07;
    const corners = [
      { x: cornerSize, y: cornerSize },
      { x: width - cornerSize, y: cornerSize },
      { x: cornerSize, y: height - cornerSize },
      { x: width - cornerSize, y: height - cornerSize },
    ];
    corners.forEach(corner => {
      // Corner glow
      const cornerGlow = ctx.createRadialGradient(corner.x, corner.y, 0, corner.x, corner.y, cornerSize);
      cornerGlow.addColorStop(0, `rgba(${accentColor}, ${lightTheme ? 0.15 : 0.1})`);
      cornerGlow.addColorStop(1, "transparent");
      ctx.fillStyle = cornerGlow;
      ctx.beginPath();
      ctx.arc(corner.x, corner.y, cornerSize, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(corner.x, corner.y);
      ctx.rotate(Math.PI / 4);
      ctx.strokeStyle = `rgba(${accentColor}, ${lightTheme ? 0.45 : 0.35})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(-cornerSize / 3, -cornerSize / 3, cornerSize / 1.5, cornerSize / 1.5);
      ctx.restore();
    });

    addNoiseTexture(ctx, width, height, lightTheme);
    addBottomAccentLine(ctx, width, height, lightTheme);
  };

  // 9:16 Portrait - Vertical flowing lines (Stories-style)
  const drawPortraitBackground = (ctx: CanvasRenderingContext2D, width: number, height: number, centerX: number, centerY: number, lightTheme: boolean = false) => {
    // Rich vertical gradient with color hints
    const baseGradient = ctx.createLinearGradient(0, 0, 0, height);
    if (lightTheme) {
      baseGradient.addColorStop(0, "#fefefe");
      baseGradient.addColorStop(0.2, "#f8f9fa");
      baseGradient.addColorStop(0.4, "#f1f3f4");
      baseGradient.addColorStop(0.6, "#eaecee");
      baseGradient.addColorStop(0.8, "#e3e5e8");
      baseGradient.addColorStop(1, "#dcdfe2");
    } else {
      baseGradient.addColorStop(0, "#1a1a2e");
      baseGradient.addColorStop(0.2, "#16213e");
      baseGradient.addColorStop(0.4, "#0f0f23");
      baseGradient.addColorStop(0.6, "#0a0a15");
      baseGradient.addColorStop(0.8, "#050510");
      baseGradient.addColorStop(1, "#000000");
    }
    ctx.fillStyle = baseGradient;
    ctx.fillRect(0, 0, width, height);

    const accentColor = lightTheme ? "70, 91, 40" : "90, 111, 60";

    // Diagonal color gradient overlay
    if (decoded.length > 0) {
      const diagonalGradient = ctx.createLinearGradient(0, 0, width, height);
      const diagAlpha = lightTheme ? 0.12 : 0.08;
      diagonalGradient.addColorStop(0, getConceptColor(decoded[0].concept).replace(/[\d.]+\)$/, `${diagAlpha})`));
      if (decoded.length > 1) {
        diagonalGradient.addColorStop(1, getConceptColor(decoded[decoded.length - 1].concept).replace(/[\d.]+\)$/, `${diagAlpha})`));
      }
      ctx.fillStyle = diagonalGradient;
      ctx.fillRect(0, 0, width, height);
    }

    // Flowing vertical lines with bezier curves
    for (let i = 0; i < 10; i++) {
      const x = width * (0.05 + i * 0.1);
      const amplitude = 40 + Math.random() * 30;
      const frequency = 0.002 + Math.random() * 0.002;
      
      ctx.beginPath();
      ctx.moveTo(x, 0);
      for (let y = 0; y < height; y += 3) {
        const offsetX = Math.sin(y * frequency + i * 0.5) * amplitude;
        ctx.lineTo(x + offsetX, y);
      }
      
      const lineGradient = ctx.createLinearGradient(0, 0, 0, height);
      const lineBase = lightTheme ? 0.03 : 0.02;
      const lineMid = lightTheme ? 0.15 : 0.1;
      lineGradient.addColorStop(0, `rgba(${accentColor}, ${lineBase + i * 0.01})`);
      lineGradient.addColorStop(0.5, `rgba(${accentColor}, ${lineMid - i * 0.008})`);
      lineGradient.addColorStop(1, `rgba(${accentColor}, ${lineBase + i * 0.01})`);
      ctx.strokeStyle = lineGradient;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Concept dots along center vertical with enhanced effects
    decoded.forEach((letter, index) => {
      const color = getConceptColor(letter.concept);
      const y = height * (0.15 + (index / decoded.length) * 0.6);
      const x = centerX + Math.sin(index * 0.8) * 80;

      // Large ambient glow
      const ambientGlow = ctx.createRadialGradient(x, y, 0, x, y, 150);
      const glowAlpha = lightTheme ? 0.3 : 0.2;
      ambientGlow.addColorStop(0, color.replace(/[\d.]+\)$/, `${glowAlpha})`));
      ambientGlow.addColorStop(0.5, color.replace(/[\d.]+\)$/, `${glowAlpha * 0.25})`));
      ambientGlow.addColorStop(1, "transparent");
      ctx.fillStyle = ambientGlow;
      ctx.beginPath();
      ctx.arc(x, y, 150, 0, Math.PI * 2);
      ctx.fill();

      // Horizontal glow line
      const glowGradient = ctx.createLinearGradient(x - 150, y, x + 150, y);
      glowGradient.addColorStop(0, "transparent");
      glowGradient.addColorStop(0.3, color.replace(/[\d.]+\)$/, `${lightTheme ? 0.2 : 0.15})`));
      glowGradient.addColorStop(0.5, color.replace(/[\d.]+\)$/, `${lightTheme ? 0.5 : 0.4})`));
      glowGradient.addColorStop(0.7, color.replace(/[\d.]+\)$/, `${lightTheme ? 0.2 : 0.15})`));
      glowGradient.addColorStop(1, "transparent");
      ctx.fillStyle = glowGradient;
      ctx.fillRect(x - 150, y - 3, 300, 6);

      // Center dot with glow
      const dotGlow = ctx.createRadialGradient(x, y, 0, x, y, 20);
      dotGlow.addColorStop(0, color.replace(/[\d.]+\)$/, "0.9)"));
      dotGlow.addColorStop(0.5, color.replace(/[\d.]+\)$/, "0.4)"));
      dotGlow.addColorStop(1, "transparent");
      ctx.fillStyle = dotGlow;
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = lightTheme ? "rgba(50, 50, 50, 0.9)" : "rgba(255, 255, 255, 0.9)";
      ctx.fill();
    });

    // Top and bottom fade bars with gradient
    const fadeHeight = height * 0.1;
    const topFade = ctx.createLinearGradient(0, 0, 0, fadeHeight);
    topFade.addColorStop(0, `rgba(${accentColor}, ${lightTheme ? 0.25 : 0.2})`);
    topFade.addColorStop(0.5, `rgba(${accentColor}, ${lightTheme ? 0.08 : 0.05})`);
    topFade.addColorStop(1, "transparent");
    ctx.fillStyle = topFade;
    ctx.fillRect(0, 0, width, fadeHeight);

    const bottomFade = ctx.createLinearGradient(0, height - fadeHeight, 0, height);
    bottomFade.addColorStop(0, "transparent");
    bottomFade.addColorStop(0.5, `rgba(${accentColor}, ${lightTheme ? 0.08 : 0.05})`);
    bottomFade.addColorStop(1, `rgba(${accentColor}, ${lightTheme ? 0.25 : 0.2})`);
    ctx.fillStyle = bottomFade;
    ctx.fillRect(0, height - fadeHeight, width, fadeHeight);

    // Side accent lines
    const sideLineGradient = ctx.createLinearGradient(0, height * 0.2, 0, height * 0.8);
    sideLineGradient.addColorStop(0, "transparent");
    sideLineGradient.addColorStop(0.5, `rgba(${accentColor}, ${lightTheme ? 0.4 : 0.3})`);
    sideLineGradient.addColorStop(1, "transparent");
    ctx.strokeStyle = sideLineGradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(30, height * 0.2);
    ctx.lineTo(30, height * 0.8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(width - 30, height * 0.2);
    ctx.lineTo(width - 30, height * 0.8);
    ctx.stroke();

    addNoiseTexture(ctx, width, height, lightTheme);
  };

  // 16:9 Landscape - Horizontal wave pattern (Twitter/YouTube-style)
  const drawLandscapeBackground = (ctx: CanvasRenderingContext2D, width: number, height: number, centerX: number, centerY: number, lightTheme: boolean = false) => {
    // Rich horizontal gradient with color depth
    const baseGradient = ctx.createLinearGradient(0, 0, width, 0);
    if (lightTheme) {
      baseGradient.addColorStop(0, "#e8eaed");
      baseGradient.addColorStop(0.15, "#f1f3f4");
      baseGradient.addColorStop(0.3, "#f8f9fa");
      baseGradient.addColorStop(0.5, "#fefefe");
      baseGradient.addColorStop(0.7, "#f8f9fa");
      baseGradient.addColorStop(0.85, "#f1f3f4");
      baseGradient.addColorStop(1, "#e8eaed");
    } else {
      baseGradient.addColorStop(0, "#0a0a15");
      baseGradient.addColorStop(0.15, "#0f0f23");
      baseGradient.addColorStop(0.3, "#16213e");
      baseGradient.addColorStop(0.5, "#1a1a2e");
      baseGradient.addColorStop(0.7, "#16213e");
      baseGradient.addColorStop(0.85, "#0f0f23");
      baseGradient.addColorStop(1, "#0a0a15");
    }
    ctx.fillStyle = baseGradient;
    ctx.fillRect(0, 0, width, height);

    const accentColor = lightTheme ? "70, 91, 40" : "90, 111, 60";

    // Vertical color gradient overlay
    const verticalGradient = ctx.createLinearGradient(0, 0, 0, height);
    const vertAlpha = lightTheme ? 0.08 : 0.05;
    verticalGradient.addColorStop(0, `rgba(${accentColor}, ${vertAlpha})`);
    verticalGradient.addColorStop(0.5, "transparent");
    verticalGradient.addColorStop(1, `rgba(${accentColor}, ${vertAlpha})`);
    ctx.fillStyle = verticalGradient;
    ctx.fillRect(0, 0, width, height);

    // Horizontal wave layers with gradient strokes
    for (let layer = 0; layer < 7; layer++) {
      const y = height * (0.25 + layer * 0.1);
      const amplitude = 15 + layer * 10;
      
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= width; x += 8) {
        const offsetY = Math.sin(x * 0.006 + layer * 0.7) * amplitude + 
                        Math.sin(x * 0.003 + layer * 0.3) * (amplitude * 0.5);
        ctx.lineTo(x, y + offsetY);
      }
      
      const waveGradient = ctx.createLinearGradient(0, y - amplitude, 0, y + amplitude);
      const waveBase = lightTheme ? 0.03 : 0.02;
      const waveMid = lightTheme ? 0.18 : 0.12;
      waveGradient.addColorStop(0, `rgba(${accentColor}, ${waveBase + layer * 0.01})`);
      waveGradient.addColorStop(0.5, `rgba(${accentColor}, ${waveMid - layer * 0.015})`);
      waveGradient.addColorStop(1, `rgba(${accentColor}, ${waveBase + layer * 0.01})`);
      ctx.strokeStyle = waveGradient;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Concept blocks along horizontal with enhanced glow
    const blockWidth = width / (decoded.length + 1);
    decoded.forEach((letter, index) => {
      const color = getConceptColor(letter.concept);
      const x = blockWidth * (index + 1);
      const blockHeight = 100 + (index % 2) * 50;

      // Large ambient glow
      const ambientGlow = ctx.createRadialGradient(x, centerY, 0, x, centerY, 200);
      const ambAlpha = lightTheme ? 0.2 : 0.15;
      ambientGlow.addColorStop(0, color.replace(/[\d.]+\)$/, `${ambAlpha})`));
      ambientGlow.addColorStop(0.5, color.replace(/[\d.]+\)$/, `${ambAlpha * 0.33})`));
      ambientGlow.addColorStop(1, "transparent");
      ctx.fillStyle = ambientGlow;
      ctx.beginPath();
      ctx.arc(x, centerY, 200, 0, Math.PI * 2);
      ctx.fill();

      // Vertical glow bar
      const glowGradient = ctx.createLinearGradient(x, centerY - blockHeight, x, centerY + blockHeight);
      glowGradient.addColorStop(0, "transparent");
      glowGradient.addColorStop(0.2, color.replace(/[\d.]+\)$/, `${lightTheme ? 0.25 : 0.2})`));
      glowGradient.addColorStop(0.5, color.replace(/[\d.]+\)$/, `${lightTheme ? 0.6 : 0.5})`));
      glowGradient.addColorStop(0.8, color.replace(/[\d.]+\)$/, `${lightTheme ? 0.25 : 0.2})`));
      glowGradient.addColorStop(1, "transparent");
      ctx.fillStyle = glowGradient;
      ctx.fillRect(x - 4, centerY - blockHeight, 8, blockHeight * 2);

      // Center dot
      ctx.beginPath();
      ctx.arc(x, centerY, 6, 0, Math.PI * 2);
      ctx.fillStyle = lightTheme ? "rgba(50, 50, 50, 0.8)" : "rgba(255, 255, 255, 0.8)";
      ctx.fill();
    });

    // Left and right edge accents with gradient
    const edgeWidth = width * 0.04;
    const edgeAlpha = lightTheme ? 0.3 : 0.25;
    const edgeAlphaMid = lightTheme ? 0.15 : 0.1;
    const leftEdge = ctx.createLinearGradient(0, 0, edgeWidth * 2, 0);
    leftEdge.addColorStop(0, `rgba(${accentColor}, ${edgeAlpha})`);
    leftEdge.addColorStop(0.5, `rgba(${accentColor}, ${edgeAlphaMid})`);
    leftEdge.addColorStop(1, "transparent");
    ctx.fillStyle = leftEdge;
    ctx.fillRect(0, 0, edgeWidth * 2, height);

    const rightEdge = ctx.createLinearGradient(width - edgeWidth * 2, 0, width, 0);
    rightEdge.addColorStop(0, "transparent");
    rightEdge.addColorStop(0.5, `rgba(${accentColor}, ${edgeAlphaMid})`);
    rightEdge.addColorStop(1, `rgba(${accentColor}, ${edgeAlpha})`);
    ctx.fillStyle = rightEdge;
    ctx.fillRect(width - edgeWidth * 2, 0, edgeWidth * 2, height);

    // Horizontal connecting line with gradient
    const lineAlpha = lightTheme ? 0.4 : 0.3;
    const lineAlphaMid = lightTheme ? 0.5 : 0.4;
    const lineGradient = ctx.createLinearGradient(width * 0.1, 0, width * 0.9, 0);
    lineGradient.addColorStop(0, "transparent");
    lineGradient.addColorStop(0.2, `rgba(${accentColor}, ${lineAlpha})`);
    lineGradient.addColorStop(0.5, `rgba(${accentColor}, ${lineAlphaMid})`);
    lineGradient.addColorStop(0.8, `rgba(${accentColor}, ${lineAlpha})`);
    lineGradient.addColorStop(1, "transparent");
    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width * 0.1, height - 80);
    ctx.lineTo(width * 0.9, height - 80);
    ctx.stroke();

    // Top and bottom subtle bars
    const barHeight = 3;
    ctx.fillStyle = `rgba(${accentColor}, ${lightTheme ? 0.2 : 0.15})`;
    ctx.fillRect(width * 0.2, 40, width * 0.6, barHeight);
    ctx.fillRect(width * 0.2, height - 40 - barHeight, width * 0.6, barHeight);

    addNoiseTexture(ctx, width, height, lightTheme);
  };

  // Default background (for original size)
  const drawDefaultBackground = (ctx: CanvasRenderingContext2D, width: number, height: number, centerX: number, centerY: number, baseRadius: number, lightTheme: boolean = false) => {
    // Multi-layer gradient for depth
    const baseGradient = ctx.createRadialGradient(
      centerX, height * 0.4, 0,
      centerX, centerY, Math.max(width, height) * 0.8
    );
    if (lightTheme) {
      baseGradient.addColorStop(0, "#fefefe");
      baseGradient.addColorStop(0.4, "#f8f9fa");
      baseGradient.addColorStop(0.7, "#f1f3f4");
      baseGradient.addColorStop(1, "#e8eaed");
    } else {
      baseGradient.addColorStop(0, "#111111");
      baseGradient.addColorStop(0.4, "#0a0a0a");
      baseGradient.addColorStop(0.7, "#050505");
      baseGradient.addColorStop(1, "#000000");
    }
    ctx.fillStyle = baseGradient;
    ctx.fillRect(0, 0, width, height);

    addNoiseTexture(ctx, width, height, lightTheme);

    const accentColor = lightTheme ? "70, 91, 40" : "90, 111, 60";

    // Outer glow ring
    const glowGradient = ctx.createRadialGradient(
      centerX, centerY, baseRadius * 0.8,
      centerX, centerY, baseRadius * 1.5
    );
    const glowAlpha = lightTheme ? 0.12 : 0.08;
    glowGradient.addColorStop(0, `rgba(${accentColor}, ${glowAlpha})`);
    glowGradient.addColorStop(0.5, `rgba(${accentColor}, ${glowAlpha * 0.375})`);
    glowGradient.addColorStop(1, "transparent");
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, width, height);

    // Elegant orbital rings
    decoded.forEach((letter, index) => {
      const color = getConceptColor(letter.concept);
      const angle = (index / decoded.length) * Math.PI * 2 - Math.PI / 2;
      const ringRadius = baseRadius * (0.5 + index * 0.12);

      ctx.beginPath();
      ctx.arc(centerX, centerY, ringRadius, angle - 0.3, angle + 0.3);
      ctx.strokeStyle = color.replace("0.12", lightTheme ? "0.35" : "0.25").replace("0.15", lightTheme ? "0.4" : "0.3");
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.stroke();

      const pointX = centerX + Math.cos(angle) * ringRadius;
      const pointY = centerY + Math.sin(angle) * ringRadius;
      
      const pointGlow = ctx.createRadialGradient(pointX, pointY, 0, pointX, pointY, 20);
      pointGlow.addColorStop(0, color.replace("0.12", lightTheme ? "0.7" : "0.6").replace("0.15", lightTheme ? "0.8" : "0.7"));
      pointGlow.addColorStop(0.5, color.replace("0.12", lightTheme ? "0.3" : "0.2").replace("0.15", lightTheme ? "0.35" : "0.25"));
      pointGlow.addColorStop(1, "transparent");
      ctx.fillStyle = pointGlow;
      ctx.beginPath();
      ctx.arc(pointX, pointY, 20, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(pointX, pointY, 4, 0, Math.PI * 2);
      ctx.fillStyle = lightTheme ? "rgba(50, 50, 50, 0.8)" : "rgba(255, 255, 255, 0.8)";
      ctx.fill();
    });

    // Corner L-brackets
    const cornerSize = Math.min(width, height) * 0.08;
    const cornerOffset = cornerSize * 0.6;
    const corners = [
      { x: cornerOffset, y: cornerOffset, isLeft: true, isTop: true },
      { x: width - cornerOffset, y: cornerOffset, isLeft: false, isTop: true },
      { x: cornerOffset, y: height - cornerOffset, isLeft: true, isTop: false },
      { x: width - cornerOffset, y: height - cornerOffset, isLeft: false, isTop: false },
    ];

    corners.forEach((corner) => {
      ctx.strokeStyle = `rgba(${accentColor}, ${lightTheme ? 0.4 : 0.3})`;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      
      const length = cornerSize * 0.5;
      ctx.beginPath();
      ctx.moveTo(corner.x, corner.y + (corner.isTop ? length : -length));
      ctx.lineTo(corner.x, corner.y);
      ctx.lineTo(corner.x + (corner.isLeft ? length : -length), corner.y);
      ctx.stroke();
    });

    addBottomAccentLine(ctx, width, height, lightTheme);
  };

  // Helper: Add noise texture
  const addNoiseTexture = (ctx: CanvasRenderingContext2D, width: number, height: number, lightTheme: boolean = false) => {
    const noiseSize = 3;
    ctx.globalAlpha = lightTheme ? 0.015 : 0.025;
    for (let x = 0; x < width; x += noiseSize) {
      for (let y = 0; y < height; y += noiseSize) {
        const brightness = Math.random() * 255;
        ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
        ctx.fillRect(x, y, noiseSize, noiseSize);
      }
    }
    ctx.globalAlpha = 1;
  };

  // Helper: Add bottom accent gradient line
  const addBottomAccentLine = (ctx: CanvasRenderingContext2D, width: number, height: number, lightTheme: boolean = false) => {
    const accentHeight = 4;
    const accentY = height - 60;
    const accentWidth = width * 0.6;
    const accentX = (width - accentWidth) / 2;

    const accentGradient = ctx.createLinearGradient(accentX, accentY, accentX + accentWidth, accentY);
    accentGradient.addColorStop(0, "transparent");
    decoded.forEach((letter, i) => {
      const stop = 0.1 + (i / (decoded.length - 1 || 1)) * 0.8;
      const alphaReplace = lightTheme ? "0.6" : "0.5";
      const alphaReplace2 = lightTheme ? "0.7" : "0.6";
      accentGradient.addColorStop(stop, getConceptColor(letter.concept).replace("0.12", alphaReplace).replace("0.15", alphaReplace2));
    });
    accentGradient.addColorStop(1, "transparent");
    
    ctx.fillStyle = accentGradient;
    ctx.beginPath();
    ctx.roundRect(accentX, accentY, accentWidth, accentHeight, 2);
    ctx.fill();
  };

  const generateImage = async (ratio?: AspectRatio, options?: ImageExportOptions): Promise<string | null> => {
    if (!containerRef.current) return null;
    
    setIsGenerating(true);
    try {
      // Higher scale for better quality
      const scale = ratio ? 3 : 2;
      
      const originalCanvas = await html2canvas(containerRef.current, {
        backgroundColor: "transparent",
        scale: scale,
        logging: false,
        useCORS: true,
      });
      
      if (!ratio) {
        // For original size with enhanced background
        const simpleCanvas = document.createElement("canvas");
        simpleCanvas.width = originalCanvas.width;
        simpleCanvas.height = originalCanvas.height;
        const simpleCtx = simpleCanvas.getContext("2d");
        if (simpleCtx) {
          drawBackgroundTexture(simpleCtx, originalCanvas.width, originalCanvas.height, undefined, options?.lightTheme);
          simpleCtx.drawImage(originalCanvas, 0, 0);
        }
        return simpleCanvas.toDataURL("image/png", 1.0);
      }

      // Create a new canvas with the desired aspect ratio
      const config = aspectRatioConfig[ratio];
      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = config.width;
      finalCanvas.height = config.height;
      const ctx = finalCanvas.getContext("2d");
      
      if (!ctx) return null;

      // Enable image smoothing for better quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Draw ratio-specific background texture
      drawBackgroundTexture(ctx, config.width, config.height, ratio, options?.lightTheme);

      // Calculate scaling and positioning to center the content
      const sourceAspect = originalCanvas.width / originalCanvas.height;
      const targetAspect = config.width / config.height;
      
      let drawWidth, drawHeight, offsetX, offsetY;
      
      if (sourceAspect > targetAspect) {
        drawWidth = config.width * 0.75;
        drawHeight = drawWidth / sourceAspect;
        offsetX = (config.width - drawWidth) / 2;
        offsetY = (config.height - drawHeight) / 2;
      } else {
        drawHeight = config.height * 0.6;
        drawWidth = drawHeight * sourceAspect;
        offsetX = (config.width - drawWidth) / 2;
        offsetY = (config.height - drawHeight) / 2 - config.height * 0.02;
      }

      // Draw subtle shadow behind content
      ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 10;
      ctx.fillStyle = "rgba(0, 0, 0, 0.01)";
      ctx.fillRect(offsetX, offsetY, drawWidth, drawHeight);
      ctx.shadowColor = "transparent";

      ctx.drawImage(originalCanvas, offsetX, offsetY, drawWidth, drawHeight);

      // QR Code watermark (if enabled)
      if (options?.includeQrCode) {
        await drawQrCodeWatermark(ctx, config.width, config.height, ratio, options?.includeBranding !== false);
      }

      // Premium branding watermark (if enabled)
      if (options?.includeBranding !== false) {
        const brandingY = config.height - 50;
        
        // Subtle line above branding
        const lineColor = options?.lightTheme ? "rgba(70, 91, 40, 0.4)" : "rgba(90, 111, 60, 0.3)";
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(config.width * 0.35, brandingY - 20);
        ctx.lineTo(config.width * 0.65, brandingY - 20);
        ctx.stroke();

        // Main branding text
        const textColor = options?.lightTheme ? "rgba(0, 0, 0, 0.45)" : "rgba(255, 255, 255, 0.5)";
        ctx.fillStyle = textColor;
        ctx.font = "600 28px 'Inter', system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.letterSpacing = "0.15em";
        ctx.fillText("BUOYANCIS", config.width / 2, brandingY);
        
        // Tagline
        const taglineColor = options?.lightTheme ? "rgba(70, 91, 40, 0.7)" : "rgba(90, 111, 60, 0.6)";
        ctx.fillStyle = taglineColor;
        ctx.font = "400 14px 'Inter', system-ui, sans-serif";
        ctx.fillText("Structure in Motion", config.width / 2, brandingY + 22);
      }

      return finalCanvas.toDataURL("image/png", 1.0);
    } catch (error) {
      console.error("Error generating image:", error);
      toast({
        title: t.error,
        description: t.failedGenerate,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  // Draw QR code watermark on canvas
  const drawQrCodeWatermark = async (ctx: CanvasRenderingContext2D, width: number, height: number, ratio: AspectRatio, hasBranding: boolean = true): Promise<void> => {
    const shareUrl = getShareUrl();
    const qrSize = ratio === "9:16" ? 120 : ratio === "1:1" ? 140 : 120;
    const padding = ratio === "9:16" ? 30 : 40;
    
    // Position in bottom-right corner
    const qrX = width - qrSize - padding;
    // Adjust Y position based on whether branding is shown
    const brandingOffset = hasBranding ? 60 : 20;
    const qrY = height - qrSize - padding - brandingOffset;
    
    // Fetch QR code from API
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(shareUrl)}&format=png&margin=0`;
    
    return new Promise((resolve) => {
      const qrImage = new Image();
      qrImage.crossOrigin = "anonymous";
      
      qrImage.onload = () => {
        // Draw background for QR code
        const bgPadding = 10;
        ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
        ctx.beginPath();
        ctx.roundRect(
          qrX - bgPadding,
          qrY - bgPadding,
          qrSize + bgPadding * 2,
          qrSize + bgPadding * 2,
          8
        );
        ctx.fill();
        
        // Draw subtle border
        ctx.strokeStyle = "rgba(90, 111, 60, 0.3)";
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Draw QR code
        ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
        
        // Draw "SCAN" label below QR code
        ctx.fillStyle = "rgba(90, 111, 60, 0.8)";
        ctx.font = "500 10px 'Inter', system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("SCAN", qrX + qrSize / 2, qrY + qrSize + bgPadding + 12);
        
        resolve();
      };
      
      qrImage.onerror = () => {
        console.warn("Failed to load QR code");
        resolve();
      };
      
      qrImage.src = qrApiUrl;
    });
  };

  const getShareUrl = () => {
    // Use og-decoder edge function URL for social sharing to ensure proper OG tag rendering
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://hilhvunhhhexhuneefmy.supabase.co";
    return `${supabaseUrl}/functions/v1/og-decoder?word=${encodeURIComponent(inputWord)}`;
  };

  // Generate preview image (lower resolution for faster preview)
  const generatePreviewImage = useCallback(async (ratio: AspectRatio, options?: ImageExportOptions): Promise<string | null> => {
    if (!containerRef.current) return null;
    
    try {
      const config = aspectRatioConfig[ratio];
      // Use lower scale for preview (1.5 instead of 3)
      const scale = 1.5;
      
      const originalCanvas = await html2canvas(containerRef.current, {
        backgroundColor: "transparent",
        scale: scale,
        logging: false,
        useCORS: true,
      });
      
      // Calculate preview dimensions (scaled down for faster rendering)
      const previewScale = 0.25;
      const width = config.width * previewScale;
      const height = config.height * previewScale;
      
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      
      if (!ctx) return null;
      
      // Draw ratio-specific background
      drawBackgroundTexture(ctx, width, height, ratio, options?.lightTheme);
      
      // Calculate scaling and positioning
      const sourceAspect = originalCanvas.width / originalCanvas.height;
      const targetAspect = width / height;
      
      let drawWidth, drawHeight, offsetX, offsetY;
      
      if (sourceAspect > targetAspect) {
        drawWidth = width * 0.75;
        drawHeight = drawWidth / sourceAspect;
        offsetX = (width - drawWidth) / 2;
        offsetY = (height - drawHeight) / 2;
      } else {
        drawHeight = height * 0.6;
        drawWidth = drawHeight * sourceAspect;
        offsetX = (width - drawWidth) / 2;
        offsetY = (height - drawHeight) / 2 - height * 0.02;
      }
      
      ctx.drawImage(originalCanvas, offsetX, offsetY, drawWidth, drawHeight);

      // QR indicator for preview (smaller, just a placeholder)
      if (options?.includeQrCode) {
        const qrPreviewSize = ratio === "9:16" ? 20 : 25;
        const qrX = width - qrPreviewSize - 8;
        const qrY = height - qrPreviewSize - 25;
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.fillRect(qrX - 2, qrY - 2, qrPreviewSize + 4, qrPreviewSize + 4);
        ctx.fillStyle = "rgba(90, 111, 60, 0.4)";
        ctx.font = "bold 8px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("QR", qrX + qrPreviewSize / 2, qrY + qrPreviewSize / 2 + 3);
      }
      
      // Simple watermark for preview
      const brandingY = height - 15;
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "600 8px 'Inter', system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("BUOYANCIS", width / 2, brandingY);
      
      return canvas.toDataURL("image/png", 0.8);
    } catch (error) {
      console.error("Preview generation error:", error);
      return null;
    }
  }, [containerRef, decoded, inputWord]);

  // Open preview dialog
  const handlePreview = (ratio: AspectRatio) => {
    setPreviewRatio(ratio);
    setPreviewOpen(true);
  };

  const handleDownload = async (ratio?: AspectRatio, options?: ImageExportOptions) => {
    const dataUrl = await generateImage(ratio, options);
    if (!dataUrl) return;

    const ratioSuffix = ratio ? `-${ratio.replace(":", "x")}` : "";
    const qrSuffix = options?.includeQrCode ? "-qr" : "";
    const link = document.createElement("a");
    link.download = `buoyancis-${inputWord.toLowerCase()}${ratioSuffix}${qrSuffix}.png`;
    link.href = dataUrl;
    link.click();

    // Trigger success feedback animation
    setSaved(true);
    const config = ratio ? aspectRatioConfig[ratio] : null;
    toast({
      title: t.downloaded,
      description: config ? `${config.label} ${t.imageSaved} (${config.width}×${config.height})` : t.totemSaved,
    });
    setTimeout(() => setSaved(false), 2000);
  };

  const getShareText = () => {
    const totemString = getTotemString(decoded);
    const conceptList = decoded.map(d => d.concept).join(" → ");
    return `${inputWord.toUpperCase()} → ${totemString}\n\n${conceptList}`;
  };

  // Trigger share success feedback
  const triggerShareSuccess = () => {
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  const handleTwitterShare = () => {
    const text = `${getShareText()}\n\n${t.decodeAnyWord}`;
    const url = getShareUrl();
    const hashtags = "Buoyancis,StructureInMotion";
    
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=${encodeURIComponent(hashtags)}`,
      "_blank",
      "width=550,height=420"
    );
    triggerShareSuccess();
  };

  const handleLinkedInShare = () => {
    const url = getShareUrl();
    
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      "_blank",
      "width=550,height=420"
    );
    triggerShareSuccess();
  };

  const handleFacebookShare = () => {
    const url = getShareUrl();
    
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank",
      "width=550,height=420"
    );
    triggerShareSuccess();
  };

  const handleWhatsAppShare = () => {
    const text = `${getShareText()}\n\n${t.decodeAnyWord} ${getShareUrl()}`;
    
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank"
    );
    triggerShareSuccess();
  };

  const handleTelegramShare = () => {
    const text = getShareText();
    const url = getShareUrl();
    
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      "_blank"
    );
    triggerShareSuccess();
  };

  const handleNativeShare = async () => {
    const url = getShareUrl();
    const text = getShareText();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${inputWord.toUpperCase()} - Buoyancis Decoder`,
          text: text,
          url: url,
        });
        triggerShareSuccess();
      } catch (error) {
        // User cancelled or error
        if ((error as Error).name !== "AbortError") {
          console.error("Share failed:", error);
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    const url = getShareUrl();
    
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: t.copied,
        description: t.linkCopied,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: t.error,
        description: t.failedCopy,
        variant: "destructive",
      });
    }
  };

  if (decoded.length === 0) return null;

  const buttonClass = "bg-white/5 border-white/20 text-white/60 hover:bg-white/10 hover:text-white hover:border-white/40 font-mono text-xs uppercase tracking-wider transition-all duration-200 active:scale-95 active:bg-white/15";

  // Separator component for toolbar
  const ToolbarSeparator = () => (
    <div className="h-6 w-px bg-white/10 mx-1" />
  );

  return (
    <>
      <div className="flex items-center justify-center gap-2 pt-8 mt-4 flex-wrap">
        {/* Preview Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePreview("1:1")}
          className={buttonClass}
        >
          <Eye className="w-4 h-4 mr-2" />
          {t.preview}
        </Button>

        {/* Download Dropdown with Size Options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={isGenerating}
              className={`${buttonClass} relative overflow-hidden transition-all duration-300 ${
                saved 
                  ? "bg-[#5a6f3c]/20 border-[#5a6f3c]/50 text-[#a8c686]" 
                  : ""
              }`}
            >
              <span className={`flex items-center transition-all duration-300 ${saved ? "scale-110" : ""}`}>
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : saved ? (
                  <Check className="w-4 h-4 mr-2 animate-scale-in" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                {saved ? t.saved : t.save}
              </span>
              {/* Success ripple effect */}
              {saved && (
                <span 
                  className="absolute inset-0 bg-[#5a6f3c]/30 animate-[ping_0.5s_ease-out]" 
                  style={{ borderRadius: 'inherit' }}
                />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="center" 
            className="bg-black/95 border-white/20 backdrop-blur-sm min-w-[200px]"
          >
            <DropdownMenuLabel className="text-white/50 font-mono text-xs uppercase tracking-wider">
              {t.selectSize}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            {(Object.keys(aspectRatioConfig) as AspectRatio[]).map((ratio) => {
              const config = aspectRatioConfig[ratio];
              return (
                <DropdownMenuItem 
                  key={ratio}
                  onClick={() => handleDownload(ratio)}
                  className="text-white/70 hover:text-white hover:bg-white/10 cursor-pointer font-mono text-xs flex flex-col items-start gap-0.5 py-2"
                >
                  <div className="flex items-center gap-2">
                    {config.icon}
                    <span className="uppercase tracking-wider">{config.label}</span>
                  </div>
                  <span className="text-white/40 text-[10px] ml-6">{config.platform}</span>
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem 
              onClick={() => handleDownload()}
              className="text-white/70 hover:text-white hover:bg-white/10 cursor-pointer font-mono text-xs uppercase tracking-wider"
            >
              <Download className="w-4 h-4 mr-2" />
              {t.originalSize}
            </DropdownMenuItem>
        </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Separator between tools and social */}
        <ToolbarSeparator />
        
        {/* Share Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`${buttonClass} relative overflow-hidden transition-all duration-300 ${
                shared 
                  ? "bg-[#5a6f3c]/20 border-[#5a6f3c]/50 text-[#a8c686]" 
                  : ""
              }`}
            >
              <span className={`flex items-center transition-all duration-300 ${shared ? "scale-110" : ""}`}>
                {shared ? (
                  <Check className="w-4 h-4 mr-2 animate-scale-in" />
                ) : (
                  <Share2 className="w-4 h-4 mr-2" />
                )}
                {shared ? t.shared : t.share}
              </span>
              {/* Success ripple effect */}
              {shared && (
                <span 
                  className="absolute inset-0 bg-[#5a6f3c]/30 animate-[ping_0.5s_ease-out]" 
                  style={{ borderRadius: 'inherit' }}
                />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="center" 
            className="bg-black/95 border-white/20 backdrop-blur-sm"
          >
            <DropdownMenuItem 
              onClick={handleTwitterShare}
              className="text-white/70 hover:text-white hover:bg-white/10 cursor-pointer font-mono text-xs uppercase tracking-wider transition-all duration-150 active:scale-95 active:bg-white/20"
            >
              <Twitter className="w-4 h-4 mr-2 transition-transform group-active:scale-110" />
              Twitter / X
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleLinkedInShare}
              className="text-white/70 hover:text-white hover:bg-white/10 cursor-pointer font-mono text-xs uppercase tracking-wider transition-all duration-150 active:scale-95 active:bg-white/20"
            >
              <Linkedin className="w-4 h-4 mr-2 transition-transform group-active:scale-110" />
              LinkedIn
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleFacebookShare}
              className="text-white/70 hover:text-white hover:bg-white/10 cursor-pointer font-mono text-xs uppercase tracking-wider transition-all duration-150 active:scale-95 active:bg-white/20"
            >
              <Facebook className="w-4 h-4 mr-2 transition-transform group-active:scale-110" />
              Facebook
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem 
              onClick={handleWhatsAppShare}
              className="text-white/70 hover:text-white hover:bg-white/10 cursor-pointer font-mono text-xs uppercase tracking-wider transition-all duration-150 active:scale-95 active:bg-white/20"
            >
              <MessageCircle className="w-4 h-4 mr-2 transition-transform group-active:scale-110" />
              WhatsApp
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleTelegramShare}
              className="text-white/70 hover:text-white hover:bg-white/10 cursor-pointer font-mono text-xs uppercase tracking-wider transition-all duration-150 active:scale-95 active:bg-white/20"
            >
              <Send className="w-4 h-4 mr-2 transition-transform group-active:scale-110" />
              Telegram
            </DropdownMenuItem>
            {typeof navigator !== "undefined" && navigator.share && (
              <>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem 
                  onClick={handleNativeShare}
                  className="text-white/70 hover:text-white hover:bg-white/10 cursor-pointer font-mono text-xs uppercase tracking-wider transition-all duration-150 active:scale-95 active:bg-white/20"
                >
                  <Share2 className="w-4 h-4 mr-2 transition-transform group-active:scale-110" />
                  {t.more}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Separator between social and utility */}
        <ToolbarSeparator />
        
        {/* Copy Link Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyLink}
          className={`${buttonClass} relative overflow-hidden transition-all duration-300 ${
            copied 
              ? "bg-[#5a6f3c]/20 border-[#5a6f3c]/50 text-[#a8c686]" 
              : ""
          }`}
        >
          <span className={`flex items-center transition-all duration-300 ${copied ? "scale-110" : ""}`}>
            {copied ? (
              <Check className="w-4 h-4 mr-2 animate-scale-in" />
            ) : (
              <Link2 className="w-4 h-4 mr-2" />
            )}
            {copied ? t.copied : t.link}
          </span>
          {/* Success ripple effect */}
          {copied && (
            <span 
              className="absolute inset-0 bg-[#5a6f3c]/30 animate-[ping_0.5s_ease-out]" 
              style={{ borderRadius: 'inherit' }}
            />
          )}
        </Button>

        {/* QR Code Button */}
        <QRCodeDialog
          url={getShareUrl()}
          title={t.qrTitle}
          description={t.qrDescription}
          preview={{
            word: inputWord.toUpperCase(),
            totemString: getTotemString(decoded),
            concepts: decoded.map(d => d.concept),
          }}
        >
          <Button
            variant="outline"
            size="sm"
            className={buttonClass}
          >
            <QrCode className="w-4 h-4 mr-2" />
            QR
          </Button>
        </QRCodeDialog>
      </div>

      {/* Image Preview Dialog */}
      <ImagePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        selectedRatio={previewRatio}
        onRatioChange={setPreviewRatio}
        onDownload={handleDownload}
        generatePreview={generatePreviewImage}
        isGenerating={isGenerating}
        shareUrl={getShareUrl()}
      />
    </>
  );
};

export default ShareTotem;
