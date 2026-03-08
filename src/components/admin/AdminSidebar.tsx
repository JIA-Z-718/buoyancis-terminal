import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Users,
  Mail,
  Shield,
  Clock,
  Bell,
  Database,
  Settings,
  FileText,
  AlertTriangle,
  Bot,
  ShieldCheck,
  Globe,
  Ban,
  UserCog,
  Headphones,
  MailX,
  MailWarning,
  TrendingUp,
  Calendar,
  Gauge,
  MessageSquare,
  PenSquare,
  Sparkles,
  KeyRound,
  BarChart3,
  Zap,
  ClipboardCheck,
  Activity,
} from "lucide-react";

interface NavSection {
  id: string;
  label: string;
  icon: React.ElementType;
  items?: NavItem[];
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

const navSections: NavSection[] = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    items: [
      { id: "metrics", label: "Metrics", icon: TrendingUp },
      { id: "signups", label: "Signups", icon: Users },
      { id: "event-checkins", label: "Event Check-ins", icon: ClipboardCheck },
    ],
  },
  {
    id: "content",
    label: "Content",
    icon: PenSquare,
    items: [
      { id: "blog-posts", label: "Blog Posts", icon: FileText },
      { id: "daily-entropy", label: "Daily Entropy", icon: Zap },
    ],
  },
  {
    id: "email",
    label: "Email Management",
    icon: Mail,
    items: [
      { id: "deliverability", label: "Deliverability", icon: Gauge },
      { id: "campaigns", label: "Campaigns", icon: Mail },
      { id: "scheduled", label: "Scheduled", icon: Calendar },
      { id: "templates", label: "Templates", icon: FileText },
      { id: "unsubscribes", label: "Unsubscribes", icon: MailX },
      { id: "bounces", label: "Bounces", icon: MailWarning },
      { id: "complaints", label: "Complaints", icon: AlertTriangle },
    ],
  },
  {
    id: "security",
    label: "Security",
    icon: Shield,
    items: [
      { id: "security-overview", label: "Security Overview", icon: ShieldCheck },
      { id: "security-summary", label: "Security Reports", icon: Mail },
      { id: "audit-log", label: "Audit Log", icon: FileText },
      { id: "abuse-monitoring", label: "Abuse Monitoring", icon: Bot },
      { id: "rate-limits", label: "Rate Limits", icon: Gauge },
      { id: "ip-blocklist", label: "IP Blocklist", icon: Ban },
      { id: "geo-restrictions", label: "Geo Restrictions", icon: Globe },
      { id: "error-logs", label: "Error Logs", icon: AlertTriangle },
    ],
  },
  {
    id: "trust",
    label: "Trust System",
    icon: Activity,
    items: [
      { id: "trust-decay", label: "Trust Decay", icon: Activity },
    ],
  },
  {
    id: "system",
    label: "System",
    icon: Settings,
    items: [
      { id: "cron-jobs", label: "Cron Jobs", icon: Clock },
      { id: "notifications", label: "Notifications", icon: Bell },
      { id: "data-retention", label: "Data Retention", icon: Database },
      { id: "email-sender", label: "Email Sender", icon: Mail },
      { id: "highlight-settings", label: "Highlight Duration", icon: Sparkles },
      { id: "mfa-settings", label: "Two-Factor Auth", icon: KeyRound },
      { id: "mfa-adoption", label: "MFA Adoption", icon: BarChart3 },
      { id: "locked-users", label: "Locked Users", icon: KeyRound },
    ],
  },
  {
    id: "users",
    label: "Users & Support",
    icon: Users,
    items: [
      { id: "user-roles", label: "User Roles", icon: UserCog },
      { id: "feedback", label: "User Feedback", icon: MessageSquare },
      { id: "support", label: "Customer Support", icon: Headphones },
    ],
  },
];

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
}

export default function AdminSidebar({ activeSection, onSectionChange }: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["overview", "email", "security"]));

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const scrollToSection = (sectionId: string) => {
    onSectionChange(sectionId);
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "sticky top-0 h-screen border-r border-border bg-card/50 backdrop-blur-sm transition-all duration-300 z-40 flex flex-col",
          isCollapsed ? "w-14" : "w-64"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border">
          {!isCollapsed && (
            <span className="font-medium text-sm text-foreground">Navigation</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn("h-8 w-8 p-0", isCollapsed && "mx-auto")}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-2">
          <nav className="space-y-1 px-2">
            {navSections.map((section) => (
              <div key={section.id}>
                {isCollapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => section.items && scrollToSection(section.items[0].id)}
                        className={cn(
                          "w-full justify-center h-10",
                          activeSection === section.id && "bg-accent text-accent-foreground"
                        )}
                      >
                        <section.icon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-popover text-popover-foreground border border-border">
                      <p>{section.label}</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSection(section.id)}
                      className={cn(
                        "w-full justify-start h-9 px-2 font-medium text-muted-foreground hover:text-foreground",
                        expandedSections.has(section.id) && "text-foreground"
                      )}
                    >
                      <section.icon className="h-4 w-4 mr-2" />
                      <span className="flex-1 text-left">{section.label}</span>
                      <ChevronRight
                        className={cn(
                          "h-3 w-3 transition-transform",
                          expandedSections.has(section.id) && "rotate-90"
                        )}
                      />
                    </Button>
                    {expandedSections.has(section.id) && section.items && (
                      <div className="ml-4 mt-1 space-y-0.5 border-l border-border pl-2">
                        {section.items.map((item) => (
                          <Button
                            key={item.id}
                            variant="ghost"
                            size="sm"
                            onClick={() => scrollToSection(item.id)}
                            className={cn(
                              "w-full justify-start h-8 px-2 text-sm",
                              activeSection === item.id
                                ? "bg-accent text-accent-foreground font-medium"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <item.icon className="h-3.5 w-3.5 mr-2" />
                            {item.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* Footer with keyboard hint */}
        {!isCollapsed && (
          <div className="p-3 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs font-mono">Ctrl+B</kbd> to toggle
            </p>
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}
