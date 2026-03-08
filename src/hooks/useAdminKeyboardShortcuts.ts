import { useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

interface ShortcutAction {
  key: string;
  description: string;
  action: () => void;
  modifier?: "ctrl" | "alt" | "shift";
}

interface UseAdminKeyboardShortcutsProps {
  onRefresh: () => void;
  onExport: () => void;
  onSignOut: () => void;
  onShowShortcuts?: () => void;
  onSectionChange?: (sectionId: string) => void;
  activeSection?: string;
  enabled?: boolean;
}

// Section IDs for navigation
const SECTION_SHORTCUTS: Record<string, string> = {
  s: "signups",
  c: "cron-jobs",
  d: "deliverability",
  b: "bot-detection",
  e: "email-campaigns",
  t: "templates",
  u: "user-roles",
  r: "data-retention",
  n: "notifications",
  h: "security",
};

// Number key shortcuts (0-9) for quick section access
const NUMBER_SECTION_MAP: Record<string, string> = {
  "1": "signups",
  "2": "cron-jobs",
  "3": "deliverability",
  "4": "bot-detection",
  "5": "email-campaigns",
  "6": "templates",
  "7": "user-roles",
  "8": "data-retention",
  "9": "notifications",
  "0": "bot-detection", // 10th section - Security/Bot Detection
};

// Ordered list of all sections for arrow key navigation
const SECTION_ORDER = [
  "metrics",
  "signups",
  "deliverability",
  "campaigns",
  "scheduled",
  "templates",
  "unsubscribes",
  "bounces",
  "complaints",
  "bot-detection",
  "rate-limits",
  "ip-blocklist",
  "geo-restrictions",
  "error-logs",
  "cron-jobs",
  "notifications",
  "data-retention",
  "email-sender",
  "user-roles",
  "support",
];

const SECTION_NAMES: Record<string, string> = {
  signups: "Signups",
  "cron-jobs": "Cron Jobs",
  deliverability: "Deliverability",
  "bot-detection": "Bot Detection",
  "email-campaigns": "Email Campaigns",
  templates: "Templates",
  "user-roles": "User Roles",
  "data-retention": "Data Retention",
  notifications: "Notifications",
  security: "Security",
};

export function useAdminKeyboardShortcuts({
  onRefresh,
  onExport,
  onSignOut,
  onShowShortcuts,
  onSectionChange,
  activeSection = "metrics",
  enabled = true,
}: UseAdminKeyboardShortcutsProps) {
  const { toast } = useToast();
  const gKeyPressed = useRef(false);
  const gKeyTimer = useRef<NodeJS.Timeout | null>(null);

  const shortcuts: ShortcutAction[] = [
    { key: "r", description: "Refresh data", action: onRefresh },
    { key: "e", description: "Export to CSV", action: onExport },
    { key: "Escape", description: "Sign out", action: onSignOut },
  ];

  const scrollToSection = useCallback((sectionId: string, updateActive = true) => {
    const element = document.getElementById(`section-${sectionId}`) || document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      // Briefly highlight the section
      element.classList.add("ring-2", "ring-primary", "ring-offset-2");
      setTimeout(() => {
        element.classList.remove("ring-2", "ring-primary", "ring-offset-2");
      }, 1500);
    }
    if (updateActive && onSectionChange) {
      onSectionChange(sectionId);
    }
  }, [onSectionChange]);

  const navigateSection = useCallback((direction: "prev" | "next") => {
    const currentIndex = SECTION_ORDER.indexOf(activeSection);
    if (currentIndex === -1) return;

    const newIndex = direction === "next" 
      ? Math.min(currentIndex + 1, SECTION_ORDER.length - 1)
      : Math.max(currentIndex - 1, 0);

    if (newIndex !== currentIndex) {
      const newSection = SECTION_ORDER[newIndex];
      scrollToSection(newSection);
    }
  }, [activeSection, scrollToSection]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs, textareas, or contenteditable
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        target.closest("[role='dialog']") // Don't trigger in modals
      ) {
        return;
      }

      const key = event.key.toLowerCase();

      // Handle arrow keys for section navigation
      if (event.key === "ArrowLeft" && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        navigateSection("prev");
        return;
      }

      if (event.key === "ArrowRight" && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        navigateSection("next");
        return;
      }

      // Handle 'g' key for "go to" navigation prefix
      if (key === "g" && !event.ctrlKey && !event.metaKey && !event.altKey && !gKeyPressed.current) {
        gKeyPressed.current = true;
        // Reset after 1.5 seconds if no second key is pressed
        gKeyTimer.current = setTimeout(() => {
          gKeyPressed.current = false;
        }, 1500);
        
        toast({
          title: "Go to...",
          description: "S=Signups • C=Cron • D=Deliverability • B=Bots • E=Email • T=Templates • U=Users • R=Retention • N=Notifications • H=Security",
          duration: 2000,
        });
        return;
      }

      // Handle second key after 'g' for navigation
      if (gKeyPressed.current && SECTION_SHORTCUTS[key]) {
        event.preventDefault();
        gKeyPressed.current = false;
        if (gKeyTimer.current) clearTimeout(gKeyTimer.current);
        
        const sectionId = SECTION_SHORTCUTS[key];
        scrollToSection(sectionId);
        
        toast({
          title: `Navigating to ${SECTION_NAMES[sectionId]}`,
          duration: 1500,
        });
        return;
      }

      // Handle number keys 1-9 for quick section access
      if (!event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey && !gKeyPressed.current) {
        const sectionId = NUMBER_SECTION_MAP[key];
        if (sectionId) {
          event.preventDefault();
          scrollToSection(sectionId);
          
          toast({
            title: `${key}: ${SECTION_NAMES[sectionId]}`,
            duration: 1500,
          });
          return;
        }
      }

      // Handle 'r' for refresh (only when not in g-mode)
      if (key === "r" && !event.ctrlKey && !event.metaKey && !event.altKey && !gKeyPressed.current) {
        event.preventDefault();
        onRefresh();
        toast({
          title: "Refreshing...",
          description: "Data is being refreshed",
          duration: 2000,
        });
      }

      // Handle 'e' for export (only when not in g-mode)
      if (key === "e" && !event.ctrlKey && !event.metaKey && !event.altKey && !gKeyPressed.current) {
        event.preventDefault();
        onExport();
      }

      // Handle 'Escape' for sign out
      if (event.key === "Escape") {
        event.preventDefault();
        gKeyPressed.current = false;
        if (gKeyTimer.current) clearTimeout(gKeyTimer.current);
        onSignOut();
      }

      // Handle '?' for showing shortcuts help
      if (key === "?" || (event.shiftKey && key === "/")) {
        event.preventDefault();
        if (onShowShortcuts) {
          onShowShortcuts();
        } else {
          toast({
            title: "Keyboard Shortcuts",
            description: "R = Refresh • E = Export • Esc = Sign out • Ctrl+B = Toggle sidebar • G+[key] = Navigate • ? = Help",
            duration: 5000,
          });
        }
      }
    },
    [onRefresh, onExport, onSignOut, onShowShortcuts, toast, scrollToSection, navigateSection]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (gKeyTimer.current) clearTimeout(gKeyTimer.current);
    };
  }, [enabled, handleKeyDown]);

  return { shortcuts, scrollToSection };
}
