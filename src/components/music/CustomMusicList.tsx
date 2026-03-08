import { useState, useCallback } from "react";
import { Music, Trash2, GripVertical, Pencil, Check, X, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CustomMusic } from "@/hooks/useCustomMusic";

interface CustomMusicListProps {
  customMusic: CustomMusic[];
  publicMusic?: CustomMusic[];
  currentCustomMusic: CustomMusic | null;
  isPlaying: boolean;
  onPlay: (music: CustomMusic) => void;
  onRemove: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onTogglePublic?: (id: string) => void;
}

const CustomMusicList = ({
  customMusic,
  publicMusic = [],
  currentCustomMusic,
  isPlaying,
  onPlay,
  onRemove,
  onRename,
  onReorder,
  onTogglePublic,
}: CustomMusicListProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleStartEdit = useCallback((music: CustomMusic, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(music.id);
    setEditName(music.name);
  }, []);

  const handleSaveEdit = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editName.trim()) {
      onRename(id, editName);
    }
    setEditingId(null);
    setEditName("");
  }, [editName, onRename]);

  const handleCancelEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditName("");
  }, []);

  const handleKeyDown = useCallback((id: string, e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (editName.trim()) {
        onRename(id, editName);
      }
      setEditingId(null);
      setEditName("");
    } else if (e.key === "Escape") {
      setEditingId(null);
      setEditName("");
    }
  }, [editName, onRename]);

  const handleDragStart = useCallback((index: number, e: React.DragEvent) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((index: number, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      onReorder(draggedIndex, dragOverIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, dragOverIndex, onReorder]);

  const handleRemove = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(id);
  }, [onRemove]);

  const handleTogglePublic = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onTogglePublic?.(id);
  }, [onTogglePublic]);

  if (customMusic.length === 0 && publicMusic.length === 0) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-2">
        {/* My Music */}
        {customMusic.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground font-medium">我的音樂</p>
            <div className="flex flex-col gap-1">
              {customMusic.map((music, index) => (
                <div
                  key={music.id}
                  draggable={editingId !== music.id}
                  onDragStart={(e) => handleDragStart(index, e)}
                  onDragOver={(e) => handleDragOver(index, e)}
                  onDragEnd={handleDragEnd}
                  className={`
                    flex items-center gap-1 rounded transition-all
                    ${dragOverIndex === index && draggedIndex !== index ? "border-t-2 border-primary" : ""}
                    ${draggedIndex === index ? "opacity-50" : ""}
                  `}
                >
                  <div className="cursor-grab hover:text-foreground text-muted-foreground">
                    <GripVertical className="h-3 w-3" />
                  </div>
                  
                  {editingId === music.id ? (
                    <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(music.id, e)}
                        className="h-6 text-xs px-1.5 py-0"
                        autoFocus
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleSaveEdit(music.id, e)}
                        className="h-6 w-6 p-0"
                      >
                        <Check className="h-3 w-3 text-green-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEdit}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant={currentCustomMusic?.id === music.id && isPlaying ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPlay(music)}
                      className="text-xs px-2 py-1 h-7 flex-1 justify-start group"
                    >
                      <Music className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="max-w-[50px] truncate">{music.name}</span>
                      <div className="ml-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!music.isLocal && onTogglePublic && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span onClick={(e) => handleTogglePublic(music.id, e)}>
                                {music.isPublic ? (
                                  <Globe className="h-3 w-3 text-primary hover:text-primary/80" />
                                ) : (
                                  <Lock className="h-3 w-3 hover:text-primary" />
                                )}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              {music.isPublic ? "設為私人" : "設為公開"}
                            </TooltipContent>
                          </Tooltip>
                        )}
                        <Pencil
                          className="h-3 w-3 hover:text-primary"
                          onClick={(e) => handleStartEdit(music, e)}
                        />
                        <Trash2
                          className="h-3 w-3 hover:text-destructive"
                          onClick={(e) => handleRemove(music.id, e)}
                        />
                      </div>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Public Music from others */}
        {publicMusic.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
              <Globe className="h-3 w-3" />
              公開音樂
            </p>
            <div className="flex flex-col gap-1">
              {publicMusic.map((music) => (
                <Button
                  key={music.id}
                  variant={currentCustomMusic?.id === music.id && isPlaying ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPlay(music)}
                  className="text-xs px-2 py-1 h-7 justify-start"
                >
                  <Music className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="max-w-[80px] truncate">{music.name}</span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default CustomMusicList;
