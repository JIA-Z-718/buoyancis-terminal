import { useEffect, useState, useCallback } from "react";
import { Keyboard, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

interface ShortcutItem {
  keys: string[];
  description: string;
}

interface ShortcutGroup {
  title: string;
  icon?: React.ReactNode;
  shortcuts: ShortcutItem[];
}

interface KeyboardShortcutsOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups?: ShortcutGroup[];
  title?: string;
}

const defaultGroups: ShortcutGroup[] = [
  {
    title: "General",
    shortcuts: [
      { keys: ["Ctrl", "P"], description: "Print / Export PDF" },
      { keys: ["Shift", "?"], description: "Show keyboard shortcuts" },
      { keys: ["Esc"], description: "Close modals / dialogs" },
    ],
  },
  {
    title: "Navigation",
    shortcuts: [
      { keys: ["↑", "↓"], description: "Navigate lists" },
      { keys: ["Enter"], description: "Confirm selection" },
      { keys: ["Tab"], description: "Move to next element" },
      { keys: ["Shift", "Tab"], description: "Move to previous element" },
    ],
  },
];

function KeyBadge({ children }: { children: React.ReactNode }) {
  return (
    <Badge
      variant="outline"
      className="font-mono text-xs px-2 py-1 bg-muted border-border min-w-[28px] flex items-center justify-center"
    >
      {children}
    </Badge>
  );
}

export default function KeyboardShortcutsOverlay({
  open,
  onOpenChange,
  groups = defaultGroups,
  title = "Keyboard Shortcuts",
}: KeyboardShortcutsOverlayProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-2 py-2">
          {groups.map((group, groupIndex) => (
            <div key={group.title}>
              {groupIndex > 0 && <Separator className="mb-5" />}
              <div className="flex items-center gap-2 mb-3">
                {group.icon}
                <h4 className="text-sm font-semibold text-foreground">
                  {group.title}
                </h4>
              </div>
              <div className="space-y-2 bg-muted/30 rounded-lg p-3">
                {group.shortcuts.map((shortcut, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm text-muted-foreground">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex} className="flex items-center gap-1">
                          <KeyBadge>{key}</KeyBadge>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="text-muted-foreground text-xs">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Press <KeyBadge>Esc</KeyBadge> or <KeyBadge>Shift</KeyBadge>+<KeyBadge>?</KeyBadge> to close
          </p>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4 mr-1" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to enable Shift+? shortcut globally
export function useKeyboardShortcutsOverlay() {
  const [isOpen, setIsOpen] = useState(false);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Check for Shift+? (Shift + / on most keyboards)
    if (event.shiftKey && (event.key === "?" || event.key === "/")) {
      const target = event.target as HTMLElement;
      
      // Don't trigger in inputs/textareas
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      event.preventDefault();
      setIsOpen(prev => !prev);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return { isOpen, setIsOpen };
}
