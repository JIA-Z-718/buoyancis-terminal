import { Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import KeyboardShortcutSettings from "./KeyboardShortcutSettings";

interface KeyboardShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string[]; description: string }[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: "General",
    shortcuts: [
      { keys: ["R"], description: "Refresh data" },
      { keys: ["E"], description: "Export to CSV" },
      { keys: ["Esc"], description: "Sign out" },
      { keys: ["?"], description: "Show keyboard shortcuts" },
    ],
  },
  {
    title: "Sidebar",
    shortcuts: [
      { keys: ["Ctrl", "B"], description: "Toggle sidebar" },
    ],
  },
  {
    title: "Quick Jump (Number Keys)",
    shortcuts: [
      { keys: ["1"], description: "Signups" },
      { keys: ["2"], description: "Cron Jobs" },
      { keys: ["3"], description: "Deliverability" },
      { keys: ["4"], description: "Bot Detection" },
      { keys: ["5"], description: "Email Campaigns" },
      { keys: ["6"], description: "Templates" },
      { keys: ["7"], description: "User Roles" },
      { keys: ["8"], description: "Data Retention" },
      { keys: ["9"], description: "Notifications" },
    ],
  },
  {
    title: "Navigation (G + key)",
    shortcuts: [
      { keys: ["G", "S"], description: "Go to Signups" },
      { keys: ["G", "C"], description: "Go to Cron Jobs" },
      { keys: ["G", "D"], description: "Go to Deliverability" },
      { keys: ["G", "B"], description: "Go to Bot Detection" },
      { keys: ["G", "E"], description: "Go to Email Campaigns" },
      { keys: ["G", "T"], description: "Go to Templates" },
      { keys: ["G", "U"], description: "Go to User Roles" },
      { keys: ["G", "R"], description: "Go to Data Retention" },
      { keys: ["G", "N"], description: "Go to Notifications" },
      { keys: ["G", "H"], description: "Go to Security" },
    ],
  },
];

function KeyBadge({ children }: { children: React.ReactNode }) {
  return (
    <Badge
      variant="outline"
      className="font-mono text-xs px-2 py-0.5 bg-muted border-border"
    >
      {children}
    </Badge>
  );
}

export default function KeyboardShortcutsModal({
  open,
  onOpenChange,
}: KeyboardShortcutsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            ⌨️ Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {shortcutGroups.map((group, groupIndex) => (
            <div key={group.title}>
              {groupIndex > 0 && <Separator className="mb-4" />}
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                {group.title}
              </h4>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.description}
                    className="flex items-center justify-between py-1"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={key} className="flex items-center gap-1">
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

        <div className="pt-2 border-t flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Press <KeyBadge>Esc</KeyBadge> to close
          </p>
          <KeyboardShortcutSettings 
            trigger={
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-1" />
                Customize
              </Button>
            }
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
