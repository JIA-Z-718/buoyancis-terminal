import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SectionItem {
  id: string;
  label: string;
}

// Flattened list of all navigable sections
const allSections: SectionItem[] = [
  { id: "metrics", label: "Metrics" },
  { id: "signups", label: "Signups" },
  { id: "deliverability", label: "Deliverability" },
  { id: "campaigns", label: "Campaigns" },
  { id: "scheduled", label: "Scheduled" },
  { id: "templates", label: "Templates" },
  { id: "unsubscribes", label: "Unsubscribes" },
  { id: "bounces", label: "Bounces" },
  { id: "complaints", label: "Complaints" },
  { id: "bot-detection", label: "Bot Detection" },
  { id: "rate-limits", label: "Rate Limits" },
  { id: "ip-blocklist", label: "IP Blocklist" },
  { id: "geo-restrictions", label: "Geo Restrictions" },
  { id: "error-logs", label: "Error Logs" },
  { id: "cron-jobs", label: "Cron Jobs" },
  { id: "notifications", label: "Notifications" },
  { id: "data-retention", label: "Data Retention" },
  { id: "email-sender", label: "Email Sender" },
  { id: "user-roles", label: "User Roles" },
  { id: "support", label: "Customer Support" },
];

interface AdminSectionHintBarProps {
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
}

export default function AdminSectionHintBar({
  activeSection,
  onSectionChange,
}: AdminSectionHintBarProps) {
  const { currentIndex, prevSection, nextSection, currentSection, total } = useMemo(() => {
    const index = allSections.findIndex((s) => s.id === activeSection);
    const safeIndex = index === -1 ? 0 : index;
    
    return {
      currentIndex: safeIndex,
      currentSection: allSections[safeIndex],
      prevSection: safeIndex > 0 ? allSections[safeIndex - 1] : null,
      nextSection: safeIndex < allSections.length - 1 ? allSections[safeIndex + 1] : null,
      total: allSections.length,
    };
  }, [activeSection]);

  const navigateTo = (sectionId: string) => {
    onSectionChange(sectionId);
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 print:hidden">
      <div className="flex items-center gap-1 bg-card/95 backdrop-blur-md border border-border rounded-full shadow-lg px-2 py-1.5">
        {/* Previous Section */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => prevSection && navigateTo(prevSection.id)}
          disabled={!prevSection}
          className="h-7 px-2 rounded-full text-xs gap-1"
        >
          <ChevronLeft className="h-3 w-3" />
          <span className="hidden sm:inline max-w-20 truncate">
            {prevSection?.label || "—"}
          </span>
        </Button>

        {/* Current Section Indicator */}
        <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
          <Badge variant="secondary" className="h-5 px-1.5 text-xs font-mono">
            {currentIndex + 1}/{total}
          </Badge>
          <span className="text-sm font-medium text-foreground max-w-32 truncate">
            {currentSection.label}
          </span>
        </div>

        {/* Next Section */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => nextSection && navigateTo(nextSection.id)}
          disabled={!nextSection}
          className="h-7 px-2 rounded-full text-xs gap-1"
        >
          <span className="hidden sm:inline max-w-20 truncate">
            {nextSection?.label || "—"}
          </span>
          <ChevronRight className="h-3 w-3" />
        </Button>

        {/* Keyboard Hints */}
        <div className="hidden md:flex items-center gap-1 ml-2 pl-2 border-l border-border/50">
          <kbd className="h-5 min-w-5 flex items-center justify-center bg-muted rounded text-[10px] font-mono text-muted-foreground px-1">
            ←
          </kbd>
          <kbd className="h-5 min-w-5 flex items-center justify-center bg-muted rounded text-[10px] font-mono text-muted-foreground px-1">
            →
          </kbd>
        </div>
      </div>
    </div>
  );
}
