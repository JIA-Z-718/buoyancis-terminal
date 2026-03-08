import { useState, useEffect, useRef, useCallback } from "react";
import { QrCode, Download, Copy, Check, RefreshCw, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";

interface QRCodeDialogProps {
  url?: string;
  title?: string;
  description?: string;
  /** Custom logo URL to overlay on QR code center */
  logoUrl?: string;
  /** Preview content to show alongside QR code */
  preview?: {
    word: string;
    totemString: string;
    concepts: string[];
  };
  children?: React.ReactNode;
}

type QRSize = "small" | "medium" | "large";

const QR_SIZES: Record<QRSize, { pixels: number; label: string; description: string }> = {
  small: { pixels: 150, label: "S", description: "Screen (150px)" },
  medium: { pixels: 250, label: "M", description: "Standard (250px)" },
  large: { pixels: 400, label: "L", description: "Print (400px)" },
};

// Default Buoyancis logo - a simple "B" icon as SVG data URL
const DEFAULT_LOGO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%235a6f3c'/%3E%3Ctext x='50' y='68' font-family='system-ui, sans-serif' font-size='50' font-weight='bold' fill='white' text-anchor='middle'%3EB%3C/text%3E%3C/svg%3E";

export default function QRCodeDialog({ 
  url, 
  title = "Share via QR Code",
  description = "Scan this QR code to access the page",
  logoUrl,
  preview,
  children 
}: QRCodeDialogProps) {
  const [open, setOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState(url || "");
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [size, setSize] = useState<QRSize>("medium");
  const [showLogo, setShowLogo] = useState(true);
  const [compositeUrl, setCompositeUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const currentSize = QR_SIZES[size];
  const logoSrc = logoUrl || DEFAULT_LOGO;

  useEffect(() => {
    if (open && !url) {
      setShareUrl(window.location.href);
    }
  }, [open, url]);

  useEffect(() => {
    setIsLoading(true);
    setCompositeUrl(null);
  }, [size, showLogo]);

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${currentSize.pixels}x${currentSize.pixels}&data=${encodeURIComponent(shareUrl)}&format=png&margin=10`;

  // Composite QR code with logo overlay
  const createCompositeImage = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const qrSize = currentSize.pixels;
    canvas.width = qrSize;
    canvas.height = qrSize;

    // Load QR code
    const qrImage = new Image();
    qrImage.crossOrigin = "anonymous";
    
    qrImage.onload = async () => {
      ctx.drawImage(qrImage, 0, 0, qrSize, qrSize);

      if (showLogo) {
        // Load and draw logo
        const logo = new Image();
        logo.crossOrigin = "anonymous";
        
        logo.onload = () => {
          const logoSize = qrSize * 0.22; // Logo is ~22% of QR size
          const logoX = (qrSize - logoSize) / 2;
          const logoY = (qrSize - logoSize) / 2;
          const padding = logoSize * 0.15;
          const cornerRadius = logoSize * 0.2;

          // Draw white background with rounded corners
          ctx.fillStyle = "white";
          ctx.beginPath();
          ctx.roundRect(
            logoX - padding,
            logoY - padding,
            logoSize + padding * 2,
            logoSize + padding * 2,
            cornerRadius
          );
          ctx.fill();

          // Draw logo
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(logoX, logoY, logoSize, logoSize, cornerRadius * 0.6);
          ctx.clip();
          ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
          ctx.restore();

          // Convert to data URL
          setCompositeUrl(canvas.toDataURL("image/png"));
          setIsLoading(false);
        };

        logo.onerror = () => {
          // If logo fails, just use QR without logo
          setCompositeUrl(canvas.toDataURL("image/png"));
          setIsLoading(false);
        };

        logo.src = logoSrc;
      } else {
        setCompositeUrl(canvas.toDataURL("image/png"));
        setIsLoading(false);
      }
    };

    qrImage.onerror = () => {
      setIsLoading(false);
      toast({
        title: "QR Generation Failed",
        description: "Could not generate QR code",
        variant: "destructive",
      });
    };

    qrImage.src = qrCodeUrl;
  }, [qrCodeUrl, currentSize.pixels, showLogo, logoSrc, toast]);

  useEffect(() => {
    if (open && shareUrl) {
      createCompositeImage();
    }
  }, [open, shareUrl, createCompositeImage]);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      toast({
        title: "URL Copied",
        description: "Link copied to clipboard",
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleDownloadQR = async () => {
    try {
      const downloadUrl = compositeUrl || qrCodeUrl;
      
      if (compositeUrl) {
        // Download from canvas data URL
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `qr-code-${size}${showLogo ? "-branded" : ""}-${new Date().toISOString().split("T")[0]}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Fallback to fetching
        const response = await fetch(qrCodeUrl);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `qr-code-${size}-${new Date().toISOString().split("T")[0]}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }
      
      toast({
        title: "QR Code Downloaded",
        description: `${currentSize.description}${showLogo ? " with logo" : ""} saved`,
      });
    } catch {
      toast({
        title: "Download Failed",
        description: "Could not download QR code",
        variant: "destructive",
      });
    }
  };

  // Display size (capped for UI)
  const displaySize = Math.min(currentSize.pixels, 280);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline">
            <QrCode className="w-4 h-4 mr-2" />
            QR Code
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        {/* Hidden canvas for compositing */}
        <canvas ref={canvasRef} className="hidden" />
        
        <div className="flex flex-col items-center space-y-5 py-4">
          {/* Options Row */}
          <div className="w-full flex flex-col sm:flex-row gap-4">
            {/* Size Selector */}
            <div className="flex-1 space-y-2">
              <Label className="text-xs text-muted-foreground">Size</Label>
              <ToggleGroup
                type="single"
                value={size}
                onValueChange={(value) => value && setSize(value as QRSize)}
                className="justify-start"
              >
                {(Object.keys(QR_SIZES) as QRSize[]).map((sizeKey) => (
                  <ToggleGroupItem
                    key={sizeKey}
                    value={sizeKey}
                    aria-label={QR_SIZES[sizeKey].description}
                    className="flex-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  >
                    <span className="font-medium">{QR_SIZES[sizeKey].label}</span>
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            {/* Logo Toggle */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Branding</Label>
              <div className="flex items-center gap-2 h-10 px-3 rounded-md border bg-background">
                <ImagePlus className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Logo</span>
                <Switch
                  checked={showLogo}
                  onCheckedChange={setShowLogo}
                  className="ml-auto"
                />
              </div>
            </div>
          </div>

          {/* QR Code + Preview Row */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            {/* QR Code Container */}
            <div 
              className="relative bg-white p-4 rounded-xl shadow-sm border transition-all duration-200 shrink-0"
              style={{ width: displaySize + 32, height: displaySize + 32 }}
            >
              {isLoading && (
                <Skeleton 
                  className="absolute inset-4" 
                  style={{ width: displaySize, height: displaySize }}
                />
              )}
              {compositeUrl && (
                <img
                  src={compositeUrl}
                  alt="QR Code"
                  className={`transition-opacity duration-200 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                  style={{ width: displaySize, height: displaySize }}
                />
              )}
            </div>

            {/* Preview Panel */}
            {preview && (
              <div className="flex-1 min-w-0 p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border space-y-3">
                {/* Word */}
                <div className="text-center sm:text-left">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-1">Decode</p>
                  <p className="text-lg font-bold tracking-wide text-foreground">{preview.word}</p>
                </div>
                
                {/* Totem String */}
                <div className="text-center sm:text-left">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-1">Totem</p>
                  <p className="text-sm font-mono text-primary break-all leading-relaxed">{preview.totemString}</p>
                </div>
                
                {/* Concepts (limited to 3) */}
                {preview.concepts.length > 0 && (
                  <div className="text-center sm:text-left">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-1.5">Concepts</p>
                    <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                      {preview.concepts.slice(0, 4).map((concept, i) => (
                        <span 
                          key={i}
                          className="px-2 py-0.5 text-[10px] rounded-full bg-primary/10 text-primary border border-primary/20 font-medium"
                        >
                          {concept}
                        </span>
                      ))}
                      {preview.concepts.length > 4 && (
                        <span className="px-2 py-0.5 text-[10px] rounded-full bg-muted text-muted-foreground font-medium">
                          +{preview.concepts.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* URL Display */}
          <div className="w-full space-y-2">
            <p className="text-xs text-muted-foreground text-center">Sharing this URL:</p>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
              <code className="text-xs flex-1 truncate text-muted-foreground">
                {shareUrl}
              </code>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 shrink-0"
                onClick={handleCopyUrl}
              >
                {isCopied ? (
                  <Check className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setIsLoading(true);
                setCompositeUrl(null);
                setShareUrl(prev => prev.includes('?') ? prev : prev + '?t=' + Date.now());
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              className="flex-1"
              onClick={handleDownloadQR}
              disabled={isLoading}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
