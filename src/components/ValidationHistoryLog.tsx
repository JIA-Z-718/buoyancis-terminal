import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { useRelativeTimeRefresh } from "@/hooks/useRelativeTimeRefresh";
import { 
  History, 
  CheckCircle2, 
  XCircle, 
  FileJson, 
  Mail,
  ExternalLink,
  Copy, 
  FileSearch, 
  Download,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  ClipboardList,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ValidationHistoryEntry } from "@/hooks/useValidationHistory";
import ValidationErrorBreakdown from "@/components/ValidationErrorBreakdown";
import EmailSummaryDialog from "@/components/EmailSummaryDialog";
import { useToast } from "@/hooks/use-toast";

interface ValidationHistoryLogProps {
  history: ValidationHistoryEntry[];
  onClear: () => void;
}

const ACTION_CONFIG = {
  validate: { icon: FileSearch, label: "Validate", color: "text-blue-600 dark:text-blue-400" },
  export: { icon: Download, label: "Export", color: "text-green-600 dark:text-green-400" },
  copy: { icon: Copy, label: "Copy", color: "text-purple-600 dark:text-purple-400" },
  import: { icon: FileJson, label: "Import", color: "text-amber-600 dark:text-amber-400" },
};

const formatErrorsAsText = (entry: ValidationHistoryEntry): string => {
  const lines: string[] = [
    `Validation ${entry.success ? "Passed" : "Failed"}`,
    `Action: ${entry.action}`,
    `Timestamp: ${format(new Date(entry.timestamp), "PPpp")}`,
    `Error Count: ${entry.errorCount}`,
    "",
  ];

  if (entry.errors.length > 0) {
    lines.push("Errors:");
    entry.errors.forEach((error, index) => {
      lines.push(`  ${index + 1}. Path: ${error.path}`);
      lines.push(`     Message: ${error.message}`);
      lines.push(`     Schema Path: ${error.schemaPath}`);
      lines.push("");
    });

    if (entry.errorCount > entry.errors.length) {
      lines.push(`  ...and ${entry.errorCount - entry.errors.length} more errors not shown`);
    }
  }

  return lines.join("\n");
};

export default function ValidationHistoryLog({ history, onClear }: ValidationHistoryLogProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  
  // Auto-refresh relative timestamps every minute
  useRelativeTimeRefresh(60000);

  const toggleEntry = (id: string) => {
    setExpandedEntries((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const stats = {
    total: history.length,
    successful: history.filter((e) => e.success).length,
    failed: history.filter((e) => !e.success).length,
  };

  const failedEntries = history.filter((e) => !e.success);

  const formatErrorsAsPlainText = (): string => {
    const lines: string[] = [
      `All Validation Errors Report`,
      `============================`,
      `Total Failed Entries: ${failedEntries.length}`,
      `Total Errors: ${failedEntries.reduce((sum, e) => sum + e.errorCount, 0)}`,
      `Generated: ${new Date().toLocaleString()}`,
      ``,
    ];

    failedEntries.forEach((entry, entryIndex) => {
      lines.push(`--- Entry ${entryIndex + 1} ---`);
      lines.push(`Action: ${entry.action}`);
      lines.push(`Timestamp: ${format(new Date(entry.timestamp), "PPpp")}`);
      lines.push(`Error Count: ${entry.errorCount}`);
      lines.push(``);

      entry.errors.forEach((error, errorIndex) => {
        lines.push(`  Error ${errorIndex + 1}:`);
        lines.push(`    Path: ${error.path}`);
        lines.push(`    Message: ${error.message}`);
        lines.push(`    Schema Path: ${error.schemaPath}`);
        lines.push(``);
      });

      if (entry.errorCount > entry.errors.length) {
        lines.push(`  ...and ${entry.errorCount - entry.errors.length} more errors not shown`);
        lines.push(``);
      }
    });

    return lines.join("\n");
  };

  const formatErrorsAsMarkdown = (): string => {
    const lines: string[] = [
      `# Validation Errors Report`,
      ``,
      `| Metric | Value |`,
      `|--------|-------|`,
      `| Total Failed Entries | ${failedEntries.length} |`,
      `| Total Errors | ${failedEntries.reduce((sum, e) => sum + e.errorCount, 0)} |`,
      `| Generated | ${new Date().toLocaleString()} |`,
      ``,
    ];

    failedEntries.forEach((entry, entryIndex) => {
      lines.push(`## Entry ${entryIndex + 1}: ${ACTION_CONFIG[entry.action].label}`);
      lines.push(``);
      lines.push(`- **Timestamp:** ${format(new Date(entry.timestamp), "PPpp")}`);
      lines.push(`- **Error Count:** ${entry.errorCount}`);
      lines.push(``);

      if (entry.errors.length > 0) {
        lines.push(`### Errors`);
        lines.push(``);
        entry.errors.forEach((error, errorIndex) => {
          lines.push(`#### ${errorIndex + 1}. ${error.message}`);
          lines.push(``);
          lines.push(`| Field | Value |`);
          lines.push(`|-------|-------|`);
          lines.push(`| Path | \`${error.path}\` |`);
          lines.push(`| Schema Path | \`${error.schemaPath}\` |`);
          lines.push(``);
        });
      }

      if (entry.errorCount > entry.errors.length) {
        lines.push(`> ⚠️ ...and ${entry.errorCount - entry.errors.length} more errors not shown`);
        lines.push(``);
      }
    });

    return lines.join("\n");
  };

  const copyAllErrors = async (format: "text" | "markdown" = "text") => {
    if (failedEntries.length === 0) {
      toast({
        title: "No Errors",
        description: "There are no failed validation entries to copy.",
        variant: "default",
      });
      return;
    }

    const content = format === "markdown" ? formatErrorsAsMarkdown() : formatErrorsAsPlainText();

    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: format === "markdown" ? "Copied as Markdown" : "Copied All Errors",
        description: `Copied ${failedEntries.length} failed entries with ${failedEntries.reduce((sum, e) => sum + e.errorCount, 0)} total errors to clipboard.`,
      });
    } catch {
      toast({
        title: "Copy Failed",
        description: "Failed to copy errors to clipboard.",
        variant: "destructive",
      });
    }
  };

  const exportAsJSON = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      totalEntries: history.length,
      summary: stats,
      entries: history.map((entry) => ({
        ...entry,
        formattedTimestamp: format(new Date(entry.timestamp), "PPpp"),
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `validation-history-${format(new Date(), "yyyy-MM-dd-HHmmss")}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `Exported ${history.length} entries as JSON`,
    });
  };

  const exportAsCSV = () => {
    const headers = ["ID", "Timestamp", "Action", "Success", "Error Count", "Errors"];
    const rows = history.map((entry) => [
      entry.id,
      format(new Date(entry.timestamp), "yyyy-MM-dd HH:mm:ss"),
      entry.action,
      entry.success ? "Yes" : "No",
      entry.errorCount.toString(),
      entry.errors.map((e) => `${e.path}: ${e.message}`).join("; "),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `validation-history-${format(new Date(), "yyyy-MM-dd-HHmmss")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `Exported ${history.length} entries as CSV`,
    });
  };

  const exportAndOpenEmailClient = () => {
    // First export the JSON file
    const exportData = {
      exportedAt: new Date().toISOString(),
      totalEntries: history.length,
      summary: stats,
      entries: history.map((entry) => ({
        ...entry,
        formattedTimestamp: format(new Date(entry.timestamp), "PPpp"),
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const filename = `validation-history-${format(new Date(), "yyyy-MM-dd-HHmmss")}.json`;
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Open email client with instructions
    const subject = encodeURIComponent(`Validation Report - ${stats.failed} failed, ${stats.successful} passed`);
    const body = encodeURIComponent(
`Hi,

Please find attached the validation report with the following summary:

• Total Validations: ${stats.total}
• Passed: ${stats.successful}
• Failed: ${stats.failed}
• Total Errors: ${failedEntries.reduce((sum, e) => sum + e.errorCount, 0)}

📎 ATTACHMENT INSTRUCTIONS:
The file "${filename}" has been downloaded to your computer.
Please attach it to this email before sending.

Generated: ${new Date().toLocaleString()}

Best regards`
    );

    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");

    toast({
      title: "Email Client Opened",
      description: `Don't forget to attach "${filename}" to your email.`,
    });
  };

  // Generate summary for email
  const generateEmailSummary = () => {
    // Count error occurrences by path+message
    const errorCounts = new Map<string, { path: string; message: string; count: number }>();
    
    failedEntries.forEach((entry) => {
      entry.errors.forEach((error) => {
        const key = `${error.path}|${error.message}`;
        const existing = errorCounts.get(key);
        if (existing) {
          existing.count++;
        } else {
          errorCounts.set(key, { path: error.path, message: error.message, count: 1 });
        }
      });
    });

    // Get top 5 errors sorted by count
    const topErrors = Array.from(errorCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalEntries: stats.total,
      successCount: stats.successful,
      failedCount: stats.failed,
      totalErrors: failedEntries.reduce((sum, e) => sum + e.errorCount, 0),
      topErrors,
      generatedAt: new Date().toLocaleString(),
    };
  };

  if (history.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4" />
            Validation History
          </CardTitle>
          <CardDescription>
            No validation attempts recorded yet. Run a validation to start tracking.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="p-0 h-auto hover:bg-transparent gap-2">
                <History className="h-4 w-4" />
                <CardTitle className="text-base">Validation History</CardTitle>
                <div className="flex items-center gap-1.5 ml-2">
                  <Badge variant="outline" className="text-xs">
                    {stats.total} total
                  </Badge>
                  {stats.successful > 0 && (
                    <Badge variant="default" className="text-xs bg-green-600">
                      {stats.successful} passed
                    </Badge>
                  )}
                  {stats.failed > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {stats.failed} failed
                    </Badge>
                  )}
                </div>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 ml-1" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-1" />
                )}
              </Button>
            </CollapsibleTrigger>

            <div className="flex items-center gap-1">
              {stats.failed > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <ClipboardList className="h-4 w-4 mr-1" />
                      Copy All Errors
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => copyAllErrors("text")}>
                      <FileText className="h-4 w-4 mr-2" />
                      Copy as Plain Text
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => copyAllErrors("markdown")}>
                      <FileJson className="h-4 w-4 mr-2" />
                      Copy as Markdown
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={exportAsJSON}>
                    <FileJson className="h-4 w-4 mr-2" />
                    Export as JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportAsCSV}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportAndOpenEmailClient}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Share via Email Client
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <EmailSummaryDialog 
                summary={generateEmailSummary()} 
                disabled={history.length === 0}
              >
                <Button variant="ghost" size="sm" className="text-muted-foreground" disabled={history.length === 0}>
                  <Mail className="h-4 w-4 mr-1" />
                  Email Summary
                </Button>
              </EmailSummaryDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear Validation History?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all {stats.total} validation history entries. 
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onClear} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Clear History
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          <CardDescription>
            Track validation attempts with timestamps and results
          </CardDescription>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {history.map((entry) => {
                  const config = ACTION_CONFIG[entry.action];
                  const ActionIcon = config.icon;
                  const isExpanded = expandedEntries.has(entry.id);
                  const hasErrors = entry.errors.length > 0;

                  return (
                    <div
                      key={entry.id}
                      className={cn(
                        "p-3 rounded-lg border transition-colors",
                        entry.success
                          ? "bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                          : "bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn("p-1.5 rounded-md bg-background", config.color)}>
                            <ActionIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{config.label}</span>
                              {entry.success ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                              ) : (
                                <XCircle className="h-4 w-4 text-destructive" />
                              )}
                            </div>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <p className="text-xs text-muted-foreground cursor-help">
                                    {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                                  </p>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {format(new Date(entry.timestamp), "PPpp")}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {!entry.success && (
                            <Badge variant="destructive" className="text-xs">
                              {entry.errorCount} error{entry.errorCount !== 1 ? "s" : ""}
                            </Badge>
                          )}
                          {hasErrors && (
                            <>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2"
                                      onClick={() => {
                                        const text = formatErrorsAsText(entry);
                                        navigator.clipboard.writeText(text);
                                        toast({
                                          title: "Copied to Clipboard",
                                          description: `${entry.errorCount} error${entry.errorCount !== 1 ? "s" : ""} copied as formatted text`,
                                        });
                                      }}
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Copy error details</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={() => toggleEntry(entry.id)}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-3 w-3" />
                                ) : (
                                  <ChevronDown className="h-3 w-3" />
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {isExpanded && hasErrors && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <ValidationErrorBreakdown 
                            errors={entry.errors} 
                            maxErrors={10}
                          />
                          {entry.errorCount > entry.errors.length && (
                            <p className="text-xs text-muted-foreground mt-2 pl-3">
                              ...and {entry.errorCount - entry.errors.length} more errors not shown
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
