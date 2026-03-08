import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, AlertTriangle, FileCode, Hash, Info, Copy, Check, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ValidationError } from "@/lib/schemaValidator";
import { useToast } from "@/hooks/use-toast";

interface ValidationErrorBreakdownProps {
  errors: ValidationError[];
  maxErrors?: number;
  className?: string;
}

function formatAllErrorsAsText(errors: ValidationError[]): string {
  const lines: string[] = [
    `Validation Errors Report`,
    `========================`,
    `Total Errors: ${errors.length}`,
    `Generated: ${new Date().toLocaleString()}`,
    ``,
  ];

  errors.forEach((error, index) => {
    lines.push(`Error ${index + 1}:`);
    lines.push(`  Path: ${error.path}`);
    lines.push(`  Message: ${error.message}`);
    lines.push(`  Keyword: ${error.keyword}`);
    lines.push(`  Schema Path: ${error.schemaPath}`);
    if (error.params && Object.keys(error.params).length > 0) {
      lines.push(`  Parameters: ${JSON.stringify(error.params)}`);
    }
    lines.push(``);
  });

  return lines.join("\n");
}

interface GroupedErrors {
  path: string;
  displayPath: string;
  errors: ValidationError[];
  depth: number;
}

function getDisplayPath(path: string): string {
  if (path === "(root)") return "Root";
  return path
    .replace(/^\//g, "")
    .replace(/\//g, " → ")
    .replace(/\[(\d+)\]/g, "[$1]");
}

function getPathDepth(path: string): number {
  if (path === "(root)") return 0;
  return (path.match(/\//g) || []).length;
}

interface PathSegment {
  type: "property" | "index" | "separator" | "root";
  value: string;
}

function parseSchemaPath(path: string): PathSegment[] {
  if (path === "(root)" || path === "/" || path === "#") {
    return [{ type: "root", value: path }];
  }
  
  const segments: PathSegment[] = [];
  // Remove leading # or / if present
  const cleanPath = path.replace(/^[#/]+/, "");
  
  // Split by / but keep track of array indices
  const parts = cleanPath.split("/").filter(Boolean);
  
  parts.forEach((part, index) => {
    if (index > 0) {
      segments.push({ type: "separator", value: "/" });
    }
    
    // Check if this is an array index (numeric)
    if (/^\d+$/.test(part)) {
      segments.push({ type: "index", value: `[${part}]` });
    } else if (part.includes("[")) {
      // Handle cases like "items[0]"
      const match = part.match(/^([^\[]+)(\[\d+\])$/);
      if (match) {
        segments.push({ type: "property", value: match[1] });
        segments.push({ type: "index", value: match[2] });
      } else {
        segments.push({ type: "property", value: part });
      }
    } else {
      segments.push({ type: "property", value: part });
    }
  });
  
  return segments;
}

function HighlightedPath({ path, variant = "default" }: { path: string; variant?: "default" | "schema" }) {
  const segments = parseSchemaPath(path);
  
  if (segments.length === 1 && segments[0].type === "root") {
    return (
      <code className={cn(
        "font-mono text-[10px] px-1 py-0.5 rounded",
        variant === "schema" ? "bg-background" : "bg-destructive/10 text-destructive"
      )}>
        {path}
      </code>
    );
  }
  
  return (
    <code className={cn(
      "font-mono text-[10px] px-1.5 py-0.5 rounded inline-flex items-center flex-wrap gap-0",
      variant === "schema" ? "bg-background" : "bg-destructive/10"
    )}>
      {segments.map((segment, idx) => {
        switch (segment.type) {
          case "property":
            return (
              <span 
                key={idx} 
                className={cn(
                  "font-semibold",
                  variant === "schema" ? "text-primary" : "text-destructive"
                )}
              >
                {segment.value}
              </span>
            );
          case "index":
            return (
              <span 
                key={idx} 
                className="text-amber-600 dark:text-amber-400 font-medium"
              >
                {segment.value}
              </span>
            );
          case "separator":
            return (
              <span key={idx} className="text-muted-foreground mx-0.5">/</span>
            );
          default:
            return <span key={idx}>{segment.value}</span>;
        }
      })}
    </code>
  );
}

function getPathCategory(path: string): string {
  if (path === "(root)") return "root";
  const parts = path.split("/").filter(Boolean);
  return parts[0] || "root";
}

export default function ValidationErrorBreakdown({ 
  errors, 
  maxErrors = 50,
  className 
}: ValidationErrorBreakdownProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [expandAll, setExpandAll] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [keywordFilter, setKeywordFilter] = useState<string>("all");
  const { toast } = useToast();

  const uniqueKeywords = useMemo(() => {
    const keywords = new Set<string>();
    errors.forEach((error) => keywords.add(error.keyword));
    return Array.from(keywords).sort();
  }, [errors]);

  const filteredErrors = useMemo(() => {
    if (keywordFilter === "all") return errors;
    return errors.filter((error) => error.keyword === keywordFilter);
  }, [errors, keywordFilter]);

  const groupedErrors = useMemo(() => {
    const groups = new Map<string, GroupedErrors>();
    
    filteredErrors.slice(0, maxErrors).forEach((error) => {
      const category = getPathCategory(error.path);
      
      if (!groups.has(category)) {
        groups.set(category, {
          path: category,
          displayPath: category === "root" ? "Root Level" : category.replace(/([A-Z])/g, " $1").trim(),
          errors: [],
          depth: 0,
        });
      }
      
      groups.get(category)!.errors.push(error);
    });

    return Array.from(groups.values()).sort((a, b) => b.errors.length - a.errors.length);
  }, [errors, maxErrors]);

  const togglePath = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const copyAllErrors = async () => {
    const text = formatAllErrorsAsText(errors);
    await navigator.clipboard.writeText(text);
    setIsCopied(true);
    toast({
      title: "Copied to Clipboard",
      description: `${errors.length} error${errors.length !== 1 ? "s" : ""} copied as formatted text`,
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const toggleExpandAll = () => {
    if (expandAll) {
      setExpandedPaths(new Set());
    } else {
      setExpandedPaths(new Set(groupedErrors.map((g) => g.path)));
    }
    setExpandAll(!expandAll);
  };

  if (errors.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span className="font-medium">
            {keywordFilter !== "all" ? (
              <>{filteredErrors.length} of {errors.length} error{errors.length !== 1 ? "s" : ""}</>
            ) : (
              <>{errors.length} validation error{errors.length !== 1 ? "s" : ""}</>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <Select value={keywordFilter} onValueChange={setKeywordFilter}>
              <SelectTrigger className="h-7 w-[130px] text-xs">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All types</SelectItem>
                {uniqueKeywords.map((keyword) => (
                  <SelectItem key={keyword} value={keyword} className="text-xs font-mono">
                    {keyword}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={copyAllErrors}
                >
                  {isCopied ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  {isCopied ? "Copied" : "Copy All"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy all errors as formatted text</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={toggleExpandAll}
          >
            {expandAll ? "Collapse All" : "Expand All"}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {groupedErrors.map((group) => {
          const isExpanded = expandedPaths.has(group.path);
          
          return (
            <Collapsible
              key={group.path}
              open={isExpanded}
              onOpenChange={() => togglePath(group.path)}
            >
              <div className="border rounded-lg overflow-hidden bg-card">
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left">
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <FileCode className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm capitalize">
                        {group.displayPath}
                      </span>
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      {group.errors.length} error{group.errors.length !== 1 ? "s" : ""}
                    </Badge>
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="border-t bg-muted/30">
                    <div className="divide-y divide-border/50">
                      {group.errors.map((error, idx) => (
                        <ErrorDetailRow key={idx} error={error} />
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </div>

      {errors.length > maxErrors && (
        <p className="text-xs text-muted-foreground text-center pt-2">
          Showing {maxErrors} of {errors.length} errors
        </p>
      )}
    </div>
  );
}

interface ErrorDetailRowProps {
  error: ValidationError;
}

function ErrorDetailRow({ error }: ErrorDetailRowProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <HighlightedPath path={error.path === "(root)" ? "/" : error.path} />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-[10px] font-mono cursor-help">
                    {error.keyword}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Validation rule: {error.keyword}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-sm text-foreground mt-1.5">{error.message}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 shrink-0"
          onClick={() => setShowDetails(!showDetails)}
        >
          <Info className="h-3 w-3" />
        </Button>
      </div>

      {showDetails && (
        <div className="bg-muted/50 rounded-md p-2 space-y-1.5 text-xs">
          <div className="flex items-start gap-2">
            <Hash className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-muted-foreground">Schema Path: </span>
              <HighlightedPath path={error.schemaPath} variant="schema" />
            </div>
          </div>
          {error.params && Object.keys(error.params).length > 0 && (
            <div className="flex items-start gap-2">
              <Info className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <span className="text-muted-foreground">Parameters: </span>
                <code className="font-mono text-[10px] bg-background px-1 py-0.5 rounded break-all">
                  {JSON.stringify(error.params)}
                </code>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
