import { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  Circle, 
  AlertTriangle, 
  Eye, 
  Keyboard, 
  MousePointer, 
  Volume2, 
  Palette, 
  FileText, 
  Navigation, 
  RefreshCw,
  Download,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "a11y-checklist-progress";

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  priority: "critical" | "high" | "medium";
}

interface ChecklistCategory {
  id: string;
  name: string;
  icon: React.ElementType;
  items: ChecklistItem[];
}

const checklistData: ChecklistCategory[] = [
  {
    id: "keyboard",
    name: "Keyboard Navigation",
    icon: Keyboard,
    items: [
      { id: "kb-1", label: "All interactive elements are focusable", description: "Buttons, links, and form controls can be reached via Tab key", priority: "critical" },
      { id: "kb-2", label: "Focus order is logical", description: "Tab order follows visual reading order (left-to-right, top-to-bottom)", priority: "critical" },
      { id: "kb-3", label: "Focus indicators are visible", description: "Focused elements have clear visual outline or highlight", priority: "critical" },
      { id: "kb-4", label: "Skip links are functional", description: "Skip-to-main-content link works on all pages", priority: "high" },
      { id: "kb-5", label: "Modal focus is trapped", description: "Focus stays within open modals and returns on close", priority: "high" },
      { id: "kb-6", label: "Escape key closes modals", description: "Pressing Escape dismisses dialogs and popups", priority: "medium" },
    ],
  },
  {
    id: "screen-reader",
    name: "Screen Reader Support",
    icon: Volume2,
    items: [
      { id: "sr-1", label: "All images have alt text", description: "Meaningful images have descriptive alt attributes", priority: "critical" },
      { id: "sr-2", label: "Form fields have labels", description: "All inputs are associated with visible or aria-labels", priority: "critical" },
      { id: "sr-3", label: "ARIA landmarks are used", description: "Main, nav, header, footer regions are properly marked", priority: "high" },
      { id: "sr-4", label: "Live regions announce updates", description: "Dynamic content changes are announced via aria-live", priority: "high" },
      { id: "sr-5", label: "Buttons have accessible names", description: "Icon-only buttons have aria-label or sr-only text", priority: "critical" },
      { id: "sr-6", label: "Tables have proper headers", description: "Data tables use th elements and scope attributes", priority: "medium" },
    ],
  },
  {
    id: "visual",
    name: "Visual Design",
    icon: Eye,
    items: [
      { id: "vis-1", label: "Color contrast meets WCAG AA", description: "Text has 4.5:1 contrast ratio (3:1 for large text)", priority: "critical" },
      { id: "vis-2", label: "Information not conveyed by color alone", description: "Icons, patterns, or text supplement color coding", priority: "critical" },
      { id: "vis-3", label: "Text can be resized to 200%", description: "Content remains usable when zoomed to 200%", priority: "high" },
      { id: "vis-4", label: "Animations can be disabled", description: "Respects prefers-reduced-motion media query", priority: "high" },
      { id: "vis-5", label: "Touch targets are 44x44px minimum", description: "Interactive elements meet minimum touch size", priority: "medium" },
    ],
  },
  {
    id: "content",
    name: "Content Structure",
    icon: FileText,
    items: [
      { id: "con-1", label: "Page has single H1", description: "Each page has exactly one H1 describing main content", priority: "critical" },
      { id: "con-2", label: "Heading hierarchy is correct", description: "Headings follow logical order (H1 → H2 → H3)", priority: "high" },
      { id: "con-3", label: "Links have descriptive text", description: "Link text describes destination (no 'click here')", priority: "high" },
      { id: "con-4", label: "Page titles are unique", description: "Each page has a unique, descriptive title", priority: "high" },
      { id: "con-5", label: "Language is declared", description: "HTML lang attribute is set correctly", priority: "medium" },
    ],
  },
  {
    id: "forms",
    name: "Forms & Inputs",
    icon: MousePointer,
    items: [
      { id: "frm-1", label: "Error messages are clear", description: "Form errors explain what's wrong and how to fix it", priority: "critical" },
      { id: "frm-2", label: "Required fields are indicated", description: "Required fields are marked visually and programmatically", priority: "high" },
      { id: "frm-3", label: "Autocomplete attributes are used", description: "Common fields have appropriate autocomplete values", priority: "medium" },
      { id: "frm-4", label: "Input types are correct", description: "Email, tel, url inputs use appropriate types", priority: "medium" },
    ],
  },
  {
    id: "navigation",
    name: "Navigation",
    icon: Navigation,
    items: [
      { id: "nav-1", label: "Current page is indicated", description: "Active navigation item is visually and programmatically marked", priority: "high" },
      { id: "nav-2", label: "Consistent navigation across pages", description: "Main navigation appears in same location on all pages", priority: "high" },
      { id: "nav-3", label: "Breadcrumbs are available", description: "Complex sites have breadcrumb navigation", priority: "medium" },
      { id: "nav-4", label: "Back button works correctly", description: "Browser back button returns to previous page", priority: "high" },
    ],
  },
];

export default function AccessibilityChecklist() {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(checklistData.map(c => c.id))
  );
  const [isVisible, setIsVisible] = useState(true);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...checkedItems]));
  }, [checkedItems]);

  const toggleItem = (itemId: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const totalItems = checklistData.reduce((sum, cat) => sum + cat.items.length, 0);
  const completedItems = checkedItems.size;
  const progressPercent = Math.round((completedItems / totalItems) * 100);

  const getCategoryProgress = (category: ChecklistCategory) => {
    const completed = category.items.filter(item => checkedItems.has(item.id)).length;
    return { completed, total: category.items.length };
  };

  const handleReset = () => {
    setCheckedItems(new Set());
    toast.success("Checklist reset to default");
  };

  const handleExport = () => {
    const report = {
      date: new Date().toISOString(),
      progress: `${completedItems}/${totalItems} (${progressPercent}%)`,
      categories: checklistData.map(category => ({
        name: category.name,
        items: category.items.map(item => ({
          label: item.label,
          completed: checkedItems.has(item.id),
          priority: item.priority,
        })),
      })),
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `a11y-checklist-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported");
  };

  const getPriorityBadge = (priority: ChecklistItem["priority"]) => {
    switch (priority) {
      case "critical":
        return <Badge variant="destructive" className="text-xs">Critical</Badge>;
      case "high":
        return <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-700 border-amber-500/30">High</Badge>;
      case "medium":
        return <Badge variant="outline" className="text-xs">Medium</Badge>;
    }
  };

  const criticalIncomplete = checklistData.flatMap(c => c.items)
    .filter(item => item.priority === "critical" && !checkedItems.has(item.id)).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Accessibility Checklist
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(!isVisible)}
              className="text-muted-foreground"
            >
              {isVisible ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Collapse
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Expand
                </>
              )}
            </Button>
          </div>
        </div>
        
        {/* Progress Summary */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {completedItems} of {totalItems} items completed
            </span>
            <span className="font-medium">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          
          {criticalIncomplete > 0 && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span>{criticalIncomplete} critical items remaining</span>
            </div>
          )}
        </div>
      </CardHeader>

      {isVisible && (
        <CardContent className="space-y-4">
          {checklistData.map((category) => {
            const progress = getCategoryProgress(category);
            const isExpanded = expandedCategories.has(category.id);
            const Icon = category.icon;
            
            return (
              <Collapsible
                key={category.id}
                open={isExpanded}
                onOpenChange={() => toggleCategory(category.id)}
              >
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{category.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {progress.completed}/{progress.total}
                      </span>
                      <div className="w-16">
                        <Progress 
                          value={(progress.completed / progress.total) * 100} 
                          className="h-1.5" 
                        />
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="mt-2 space-y-1 pl-2">
                    {category.items.map((item) => {
                      const isChecked = checkedItems.has(item.id);
                      
                      return (
                        <button
                          key={item.id}
                          onClick={() => toggleItem(item.id)}
                          className={cn(
                            "w-full flex items-start gap-3 p-2 rounded-md text-left transition-colors",
                            "hover:bg-muted/50",
                            isChecked && "opacity-60"
                          )}
                        >
                          {isChecked ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={cn(
                                "text-sm font-medium",
                                isChecked && "line-through text-muted-foreground"
                              )}>
                                {item.label}
                              </span>
                              {getPriorityBadge(item.priority)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {item.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
          
          <Separator className="my-4" />
          
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              <strong>Testing Tips:</strong> Use browser DevTools Accessibility panel, 
              screen readers (NVDA, VoiceOver), and keyboard-only navigation.
            </p>
            <p>
              Resources: <a href="https://www.w3.org/WAI/WCAG21/quickref/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">WCAG Quick Reference</a> | 
              <a href="https://wave.webaim.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">WAVE Tool</a> |
              <a href="https://www.deque.com/axe/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">axe DevTools</a>
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
