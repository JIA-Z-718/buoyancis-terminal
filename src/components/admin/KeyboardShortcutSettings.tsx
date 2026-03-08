import { useState, useEffect, useCallback, useRef } from "react";
import { Settings, RotateCcw, AlertTriangle, Check, X, Download, Upload, Cloud, CloudOff, Loader2, RefreshCw, Copy, Clock, History, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { 
  useKeyboardPreferences, 
  formatKeysForDisplay,
  ShortcutDefinition,
  ImportPreviewResult
} from "@/hooks/useKeyboardPreferences";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import ImportShortcutsPreviewDialog from "./ImportShortcutsPreviewDialog";

interface KeyboardShortcutSettingsProps {
  trigger?: React.ReactNode;
}

function KeyRecorder({ 
  shortcut, 
  currentKeys,
  isRecording,
  onStartRecording,
  onStopRecording,
  onSave,
  conflict
}: { 
  shortcut: ShortcutDefinition;
  currentKeys: string[];
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onSave: (keys: string[]) => void;
  conflict: string | null;
}) {
  const [recordedKeys, setRecordedKeys] = useState<string[]>([]);
  const inputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isRecording) {
      setRecordedKeys([]);
      inputRef.current?.focus();
    }
  }, [isRecording]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!isRecording) return;
    
    event.preventDefault();
    event.stopPropagation();

    const key = event.key;
    
    // Cancel on Escape
    if (key === "Escape") {
      onStopRecording();
      return;
    }

    const newKeys: string[] = [];
    
    if (event.ctrlKey) newKeys.push("Ctrl");
    if (event.altKey) newKeys.push("Alt");
    if (event.shiftKey) newKeys.push("Shift");
    if (event.metaKey) newKeys.push("Meta");
    
    // Add the main key if it's not just a modifier
    const modifierKeys = ["Control", "Alt", "Shift", "Meta"];
    if (!modifierKeys.includes(key)) {
      newKeys.push(key);
    }

    setRecordedKeys(newKeys);
  }, [isRecording, onStopRecording]);

  const handleKeyUp = useCallback((event: React.KeyboardEvent) => {
    if (!isRecording) return;
    
    event.preventDefault();
    event.stopPropagation();

    // Only save if we have at least one non-modifier key
    const modifierKeys = ["Control", "Alt", "Shift", "Meta"];
    const hasNonModifier = recordedKeys.some(k => !["Ctrl", "Alt", "Shift", "Meta"].includes(k));
    
    if (hasNonModifier && recordedKeys.length > 0) {
      onSave(recordedKeys);
      onStopRecording();
    }
  }, [isRecording, recordedKeys, onSave, onStopRecording]);

  const isModified = JSON.stringify(currentKeys) !== JSON.stringify(shortcut.defaultKeys);

  return (
    <div className="flex items-center gap-2">
      <div
        ref={inputRef}
        tabIndex={0}
        onClick={onStartRecording}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onBlur={() => isRecording && onStopRecording()}
        className={cn(
          "min-w-[120px] px-3 py-1.5 rounded-md border text-sm cursor-pointer transition-all",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          isRecording 
            ? "border-primary bg-primary/10 animate-pulse" 
            : "border-input bg-background hover:bg-muted/50",
          conflict && "border-destructive"
        )}
      >
        {isRecording ? (
          <span className="text-muted-foreground">
            {recordedKeys.length > 0 ? formatKeysForDisplay(recordedKeys) : "Press keys..."}
          </span>
        ) : (
          <div className="flex items-center gap-1.5">
            {currentKeys.map((key, idx) => (
              <span key={idx} className="flex items-center gap-1">
                <Badge variant="secondary" className="font-mono text-xs px-1.5">
                  {formatKeysForDisplay([key])}
                </Badge>
                {idx < currentKeys.length - 1 && (
                  <span className="text-muted-foreground text-xs">+</span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>
      
      {conflict && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <AlertTriangle className="w-4 h-4 text-destructive" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Conflicts with: {conflict}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      {isModified && !isRecording && (
        <Badge variant="outline" className="text-xs text-amber-600 border-amber-600/30">
          Modified
        </Badge>
      )}
    </div>
  );
}

export default function KeyboardShortcutSettings({ trigger }: KeyboardShortcutSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportPreviewResult | null>(null);
  const [pendingImportContent, setPendingImportContent] = useState<string | null>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { 
    shortcuts, 
    defaultShortcuts, 
    updateShortcut, 
    resetShortcut, 
    resetAllShortcuts,
    isRecording,
    setIsRecording,
    hasConflict,
    exportPreferences,
    importPreferences,
    previewImport,
    syncStatus,
    isSyncing,
    lastSyncedAt,
    syncHistory,
    forceSyncNow,
    nextAutoSyncAt,
    hasUnsyncedChanges,
    clearSyncHistory
  } = useKeyboardPreferences();

  const handleSyncNow = async () => {
    const success = await forceSyncNow();
    if (success) {
      toast.success("Preferences synced to cloud");
    } else {
      toast.error("Failed to sync preferences");
    }
  };

  const processImportFile = useCallback((file: File) => {
    if (!file.name.endsWith(".json")) {
      toast.error("Please upload a JSON file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const preview = previewImport(content);
      
      if (!preview.valid) {
        toast.error(`Import failed: ${preview.error}`);
        return;
      }

      setImportPreview(preview);
      setPendingImportContent(content);
      setShowPreviewDialog(true);
    };
    reader.onerror = () => {
      toast.error("Failed to read file");
    };
    reader.readAsText(file);
  }, [previewImport]);

  const handleConfirmImport = useCallback(() => {
    if (!pendingImportContent) return;
    
    const result = importPreferences(pendingImportContent);
    if (result.success) {
      toast.success("Keyboard shortcuts imported successfully");
    } else {
      toast.error(`Import failed: ${result.error}`);
    }
    
    setImportPreview(null);
    setPendingImportContent(null);
  }, [pendingImportContent, importPreferences]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      processImportFile(file);
    }
  }, [processImportFile]);

  // Group shortcuts by category
  const groupedShortcuts = defaultShortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, ShortcutDefinition[]>);

  const handleSave = (id: string, keys: string[]) => {
    const conflict = hasConflict(id, keys);
    if (conflict) {
      toast.error(`Shortcut conflicts with "${conflict}"`);
      return;
    }
    updateShortcut(id, keys);
    toast.success("Shortcut updated");
  };

  const handleReset = (id: string) => {
    resetShortcut(id);
    toast.success("Shortcut reset to default");
  };

  const handleResetAll = () => {
    resetAllShortcuts();
    toast.success("All shortcuts reset to defaults");
  };

  const handleExport = () => {
    const jsonString = exportPreferences();
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `keyboard-shortcuts-${format(new Date(), "yyyy-MM-dd")}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Keyboard shortcuts exported");
  };

  const handleCopyToClipboard = async () => {
    const jsonString = exportPreferences();
    try {
      await navigator.clipboard.writeText(jsonString);
      toast.success("Shortcuts copied to clipboard");
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    processImportFile(file);
    
    // Reset input so same file can be selected again
    event.target.value = "";
  };

  const modifiedCount = defaultShortcuts.filter(s => 
    JSON.stringify(shortcuts[s.id]) !== JSON.stringify(s.defaultKeys)
  ).length;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Customize Shortcuts
          </Button>
        )}
      </DialogTrigger>
      <DialogContent 
        className="max-w-2xl max-h-[85vh]"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Customize Keyboard Shortcuts
            {syncStatus !== "idle" && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="ml-auto">
                      {syncStatus === "syncing" && (
                        <Badge variant="secondary" className="gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Saving...
                        </Badge>
                      )}
                      {syncStatus === "synced" && (
                        <Badge variant="outline" className="gap-1 text-green-600 border-green-500/30">
                          <Cloud className="w-3 h-3" />
                          Saved
                        </Badge>
                      )}
                      {syncStatus === "error" && (
                        <Badge variant="destructive" className="gap-1 cursor-pointer" onClick={handleSyncNow}>
                          <CloudOff className="w-3 h-3" />
                          Sync Failed
                        </Badge>
                      )}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {syncStatus === "syncing" && "Saving preferences to cloud..."}
                    {syncStatus === "synced" && "Preferences saved to your account"}
                    {syncStatus === "error" && "Click to retry sync"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {syncStatus === "error" && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 ml-2 text-destructive hover:text-destructive"
                onClick={handleSyncNow}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                ) : (
                  <RefreshCw className="w-3 h-3 mr-1" />
                )}
                Retry
              </Button>
            )}
          </DialogTitle>
          <DialogDescription>
            Click on a shortcut to record new keys. Press Escape to cancel.
            {modifiedCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {modifiedCount} modified
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        {hasUnsyncedChanges && syncStatus !== "syncing" && (
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="flex items-center justify-between">
              <span className="text-amber-700 dark:text-amber-400 text-sm">
                You have unsaved changes that need to be synced to the cloud.
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSyncNow}
                disabled={isSyncing}
                className="ml-4 shrink-0 border-amber-500/50 text-amber-700 hover:bg-amber-500/20"
              >
                {isSyncing ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                ) : (
                  <Cloud className="w-3 h-3 mr-1" />
                )}
                Sync Now
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <ScrollArea className="max-h-[55vh] pr-4 relative">
          {isDragging && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/95 border-2 border-dashed border-primary rounded-lg">
              <div className="text-center">
                <Upload className="w-10 h-10 mx-auto text-primary mb-2" />
                <p className="text-sm font-medium">Drop JSON file to import</p>
                <p className="text-xs text-muted-foreground">Release to import keyboard shortcuts</p>
              </div>
            </div>
          )}
          <div className="space-y-6">
            {Object.entries(groupedShortcuts).map(([category, categoryShortcuts], idx) => (
              <div key={category}>
                {idx > 0 && <Separator className="mb-4" />}
                <h4 className="text-sm font-semibold text-foreground mb-3">
                  {category}
                </h4>
                <div className="space-y-2">
                  {categoryShortcuts.map((shortcut) => {
                    const currentKeys = shortcuts[shortcut.id] || shortcut.defaultKeys;
                    const isModified = JSON.stringify(currentKeys) !== JSON.stringify(shortcut.defaultKeys);
                    const conflict = hasConflict(shortcut.id, currentKeys);

                    return (
                      <div
                        key={shortcut.id}
                        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{shortcut.label}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {shortcut.description}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <KeyRecorder
                            shortcut={shortcut}
                            currentKeys={currentKeys}
                            isRecording={isRecording === shortcut.id}
                            onStartRecording={() => setIsRecording(shortcut.id)}
                            onStopRecording={() => setIsRecording(null)}
                            onSave={(keys) => handleSave(shortcut.id, keys)}
                            conflict={conflict}
                          />
                          
                          {isModified && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleReset(shortcut.id)}
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Reset to default ({formatKeysForDisplay(shortcut.defaultKeys)})</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="pt-4 border-t space-y-3">
          {/* Sync History */}
          {syncHistory.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <History className="w-3 h-3" />
                  <span>Sync History</span>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 px-1.5 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          clearSyncHistory();
                          toast.success("Sync history cleared");
                        }}
                      >
                        <X className="w-3 h-3 mr-0.5" />
                        Clear
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Clear sync history</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {syncHistory.slice(0, 5).map((entry, idx) => (
                  <TooltipProvider key={idx}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={cn(
                          "inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px]",
                          entry.success 
                            ? "bg-green-500/10 text-green-700 dark:text-green-400" 
                            : "bg-destructive/10 text-destructive"
                        )}>
                          {entry.success ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          <span>{format(entry.timestamp, "h:mm a")}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {entry.success ? "Synced" : "Failed"} ({entry.type}) - {format(entry.timestamp, "MMM d, h:mm:ss a")}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          )}
          {lastSyncedAt && syncHistory.length === 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-help">
                    <Clock className="w-3 h-3" />
                    <span>Last synced: {formatDistanceToNow(lastSyncedAt, { addSuffix: true })}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{format(lastSyncedAt, "PPpp")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {nextAutoSyncAt && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70 cursor-help">
                    <RefreshCw className="w-3 h-3" />
                    <span>Next sync: {formatDistanceToNow(nextAutoSyncAt, { addSuffix: true })}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Auto-sync at {format(nextAutoSyncAt, "h:mm a")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="w-4 h-4 mr-1" />
                    Export
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Export shortcuts as JSON file</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleCopyToClipboard}>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy shortcuts JSON to clipboard</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleImportClick}>
                    <Upload className="w-4 h-4 mr-1" />
                    Import
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Import shortcuts from a JSON file</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSyncNow}
                    disabled={isSyncing}
                  >
                    {isSyncing ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Cloud className="w-4 h-4 mr-1" />
                    )}
                    Sync Now
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Force sync preferences to cloud</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={modifiedCount === 0}>
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Reset All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset all shortcuts?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reset all {modifiedCount} modified shortcuts back to their default values. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetAll}>
                    Reset All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button size="sm" onClick={() => setIsOpen(false)}>
              <Check className="w-4 h-4 mr-1" />
              Done
            </Button>
          </div>
        </div>
        </div>
      </DialogContent>

      <ImportShortcutsPreviewDialog
        open={showPreviewDialog}
        onOpenChange={setShowPreviewDialog}
        preview={importPreview}
        onConfirm={handleConfirmImport}
      />
    </Dialog>
  );
}
