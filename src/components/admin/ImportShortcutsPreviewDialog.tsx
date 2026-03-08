import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ArrowRight, Check, Minus, AlertTriangle, FileJson } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { 
  ImportPreviewResult, 
  ImportPreviewChange,
  formatKeysForDisplay 
} from "@/hooks/useKeyboardPreferences";

interface ImportShortcutsPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preview: ImportPreviewResult | null;
  onConfirm: () => void;
}

export default function ImportShortcutsPreviewDialog({
  open,
  onOpenChange,
  preview,
  onConfirm,
}: ImportShortcutsPreviewDialogProps) {
  const [showUnchanged, setShowUnchanged] = useState(false);

  const groupedChanges = useMemo(() => {
    if (!preview?.changes) return {};
    
    const filtered = showUnchanged 
      ? preview.changes 
      : preview.changes.filter(c => c.changeType !== "unchanged");
    
    return filtered.reduce((acc, change) => {
      if (!acc[change.category]) {
        acc[change.category] = [];
      }
      acc[change.category].push(change);
      return acc;
    }, {} as Record<string, ImportPreviewChange[]>);
  }, [preview, showUnchanged]);

  const unchangedCount = preview?.changes.filter(c => c.changeType === "unchanged").length || 0;

  if (!preview) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="w-5 h-5 text-primary" />
            Import Preview
          </DialogTitle>
          <DialogDescription>
            Review the changes before applying the imported shortcuts
          </DialogDescription>
        </DialogHeader>

        {!preview.valid ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{preview.error}</AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Summary */}
            <div className="flex items-center justify-between py-3 px-4 bg-muted/50 rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant={preview.totalChanges > 0 ? "default" : "secondary"}>
                    {preview.totalChanges} change{preview.totalChanges !== 1 ? "s" : ""}
                  </Badge>
                  <Badge variant="outline">
                    {unchangedCount} unchanged
                  </Badge>
                </div>
                {preview.exportedAt && (
                  <p className="text-xs text-muted-foreground">
                    Exported: {format(new Date(preview.exportedAt), "PPp")}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUnchanged(!showUnchanged)}
              >
                {showUnchanged ? "Hide unchanged" : "Show all"}
              </Button>
            </div>

            {/* Changes list */}
            <ScrollArea className="flex-1 min-h-0 max-h-[400px]">
              <div className="space-y-4 pr-4">
                {Object.keys(groupedChanges).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Check className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    <p>No changes to apply</p>
                    <p className="text-sm">All shortcuts match the imported configuration</p>
                  </div>
                ) : (
                  Object.entries(groupedChanges).map(([category, changes]) => (
                    <div key={category}>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">
                        {category}
                      </h4>
                      <div className="space-y-2">
                        {changes.map((change) => (
                          <ChangeRow key={change.id} change={change} />
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            <Separator />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  onConfirm();
                  onOpenChange(false);
                }}
                disabled={preview.totalChanges === 0}
              >
                Apply {preview.totalChanges} Change{preview.totalChanges !== 1 ? "s" : ""}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ChangeRow({ change }: { change: ImportPreviewChange }) {
  const isUnchanged = change.changeType === "unchanged";
  
  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 rounded-lg border",
        isUnchanged 
          ? "bg-muted/30 border-border/50" 
          : "bg-primary/5 border-primary/20"
      )}
    >
      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-medium text-sm",
          isUnchanged && "text-muted-foreground"
        )}>
          {change.label}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Current keys */}
        <div className="flex items-center gap-1">
          {change.currentKeys.length > 0 ? (
            change.currentKeys.map((key, i) => (
              <kbd
                key={i}
                className={cn(
                  "px-1.5 py-0.5 text-xs rounded border",
                  isUnchanged 
                    ? "bg-muted text-muted-foreground border-border" 
                    : "bg-destructive/10 text-destructive border-destructive/20"
                )}
              >
                {formatKeysForDisplay([key])}
              </kbd>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">None</span>
          )}
        </div>

        {/* Arrow */}
        {!isUnchanged && (
          <>
            <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />

            {/* New keys */}
            <div className="flex items-center gap-1">
              {change.newKeys.length > 0 ? (
                change.newKeys.map((key, i) => (
                  <kbd
                    key={i}
                    className="px-1.5 py-0.5 text-xs bg-green-500/10 text-green-700 dark:text-green-400 rounded border border-green-500/20"
                  >
                    {formatKeysForDisplay([key])}
                  </kbd>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">None</span>
              )}
            </div>
          </>
        )}

        {isUnchanged && (
          <Badge variant="outline" className="text-[10px] ml-2">
            <Minus className="w-3 h-3 mr-1" />
            No change
          </Badge>
        )}
      </div>
    </div>
  );
}
