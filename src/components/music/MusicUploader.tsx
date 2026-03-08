import { useState, useRef } from "react";
import { Upload, X, Loader2, Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MusicUploaderProps {
  onUploadComplete: (music: { name: string; url: string }) => void;
  onClose: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg"];

const MusicUploader = ({ onUploadComplete, onClose }: MusicUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      toast.error("請選擇 MP3、WAV 或 OGG 格式的音樂檔案");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error("檔案大小不能超過 10MB");
      return;
    }

    setFile(selectedFile);
    if (!name) {
      // Use filename without extension as default name
      setName(selectedFile.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    if (e.dataTransfer.files?.[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleUpload = async () => {
    if (!file || !name.trim()) {
      toast.error("請選擇檔案並輸入名稱");
      return;
    }

    // Check if user is authenticated (required for storage policy)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("請先登入才能上傳音樂");
      return;
    }

    setIsUploading(true);

    try {
      // Generate unique filename with user folder for storage policy compliance
      const timestamp = Date.now();
      const ext = file.name.split(".").pop() || "mp3";
      // Path must start with user ID for RLS policy validation
      const filePath = `${user.id}/${timestamp}-${name.replace(/\s+/g, "-")}.${ext}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("audio")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("audio")
        .getPublicUrl(filePath);

      // Save metadata to database
      await supabase.from("custom_music" as any).insert({
        user_id: user.id,
        name: name.trim(),
        file_path: filePath,
        is_public: false,
      });

      toast.success("音樂上傳成功！");
      onUploadComplete({ name: name.trim(), url: urlData.publicUrl });
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("上傳失敗，請稍後再試");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">上傳自訂音樂</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
          ${dragActive 
            ? "border-primary bg-primary/5" 
            : "border-border hover:border-primary/50"
          }
          ${file ? "bg-muted/50" : ""}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".mp3,.wav,.ogg,audio/*"
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          className="hidden"
        />
        
        {file ? (
          <div className="flex items-center justify-center gap-2">
            <Music2 className="h-4 w-4 text-primary" />
            <span className="text-sm truncate max-w-[150px]">{file.name}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              拖放或點擊選擇音樂檔案
            </p>
            <p className="text-[10px] text-muted-foreground/70">
              MP3, WAV, OGG (最大 10MB)
            </p>
          </div>
        )}
      </div>

      {/* Name input */}
      <div className="space-y-1.5">
        <Label htmlFor="music-name" className="text-xs">
          音樂名稱
        </Label>
        <Input
          id="music-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="輸入音樂名稱"
          className="h-8 text-sm"
          maxLength={50}
        />
      </div>

      {/* Upload button */}
      <Button
        onClick={handleUpload}
        disabled={!file || !name.trim() || isUploading}
        className="w-full h-8 text-sm"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
            上傳中...
          </>
        ) : (
          <>
            <Upload className="h-3 w-3 mr-1.5" />
            上傳音樂
          </>
        )}
      </Button>
    </div>
  );
};

export default MusicUploader;
