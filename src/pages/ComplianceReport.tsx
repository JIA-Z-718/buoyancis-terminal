import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { 
  Shield, 
  Database, 
  Lock, 
  Eye, 
  Clock,
  Users,
  Mail,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Server,
  Key,
  Trash2,
  History,
  Globe,
  Fingerprint,
  Download,
  RefreshCw,
  FileSearch,
  FileJson,
  Code2,
  Copy,
  Check,
  Link2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import BackToTopButton from "@/components/BackToTopButton";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { validateComplianceReport, formatValidationError, ValidationError } from "@/lib/schemaValidator";
import { toast } from "@/hooks/use-toast";
import PrintPreview from "@/components/PrintPreview";
import { usePrintPreviewShortcut } from "@/hooks/usePrintPreviewShortcut";
import ComplianceReportComparison from "@/components/ComplianceReportComparison";
import KeyboardShortcutsOverlay, { useKeyboardShortcutsOverlay } from "@/components/KeyboardShortcutsOverlay";
import SchemaViewerModal from "@/components/SchemaViewerModal";
import ValidationHistoryLog from "@/components/ValidationHistoryLog";
import { useValidationHistory } from "@/hooks/useValidationHistory";
import { Keyboard, QrCode } from "lucide-react";
import QRCodeDialog from "@/components/QRCodeDialog";
import SocialShareButtons from "@/components/SocialShareButtons";

interface RetentionSetting {
  id: string;
  table_name: string;
  retention_days: number;
  description: string | null;
  is_enabled: boolean;
  updated_at: string;
}

interface ComplianceSection {
  icon: React.ReactNode;
  title: string;
  description: string;
  items: {
    category: string;
    details: string;
    status: "implemented" | "planned" | "n/a";
  }[];
}

function StatusBadge({ status }: { status: "implemented" | "planned" | "n/a" }) {
  const variants = {
    implemented: { variant: "default" as const, label: "Implemented" },
    planned: { variant: "secondary" as const, label: "Planned" },
    "n/a": { variant: "outline" as const, label: "N/A" },
  };
  const { variant, label } = variants[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export default function ComplianceReport() {
  const [retentionSettings, setRetentionSettings] = useState<RetentionSetting[]>([]);
  const [isLoadingRetention, setIsLoadingRetention] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [showSchemaModal, setShowSchemaModal] = useState(false);
  const { isOpen: showShortcuts, setIsOpen: setShowShortcuts } = useKeyboardShortcutsOverlay();
  const { history: validationHistory, addEntry: addValidationEntry, clearHistory: clearValidationHistory } = useValidationHistory();
  
  const reportDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const openPreview = useCallback(() => setShowPreview(true), []);
  usePrintPreviewShortcut(openPreview);

  const complianceShortcutGroups = [
    {
      title: "Document Actions",
      shortcuts: [
        { keys: ["Ctrl", "P"], description: "Print / Export PDF" },
        { keys: ["Shift", "?"], description: "Show keyboard shortcuts" },
      ],
    },
    {
      title: "Navigation",
      shortcuts: [
        { keys: ["↑", "↓"], description: "Scroll page" },
        { keys: ["Home"], description: "Go to top" },
        { keys: ["End"], description: "Go to bottom" },
        { keys: ["Tab"], description: "Next focusable element" },
      ],
    },
    {
      title: "Dialogs & Modals",
      shortcuts: [
        { keys: ["Esc"], description: "Close current dialog" },
        { keys: ["Enter"], description: "Confirm / Submit" },
      ],
    },
  ];

  useEffect(() => {
    const fetchRetentionSettings = async () => {
      setIsLoadingRetention(true);
      const { data, error } = await supabase
        .from("data_retention_settings")
        .select("*")
        .order("table_name");
      
      if (!error && data) {
        setRetentionSettings(data);
      }
      setIsLoadingRetention(false);
    };

    fetchRetentionSettings();
  }, []);

  const dataCollectionPractices = [
    {
      dataType: "Email Address",
      purpose: "User identification, communication, early access notifications",
      retention: "Indefinite (until unsubscribe)",
      legalBasis: "Consent",
      encrypted: "At rest (Supabase)",
    },
    {
      dataType: "First/Last Name",
      purpose: "Email personalization, user identification",
      retention: "Indefinite (until account deletion)",
      legalBasis: "Consent",
      encrypted: "At rest (Supabase)",
    },
    {
      dataType: "IP Address",
      purpose: "Security monitoring, rate limiting, bot detection",
      retention: "30-90 days (auto-purged)",
      legalBasis: "Legitimate interest",
      encrypted: "At rest (Supabase)",
    },
    {
      dataType: "User Agent",
      purpose: "Bot detection, device analytics",
      retention: "90 days (auto-purged)",
      legalBasis: "Legitimate interest",
      encrypted: "At rest (Supabase)",
    },
    {
      dataType: "Email Opens/Clicks",
      purpose: "Campaign analytics, deliverability monitoring",
      retention: "Indefinite (admin access only)",
      legalBasis: "Legitimate interest",
      encrypted: "At rest (Supabase)",
    },
  ];

  const securityMeasures: ComplianceSection[] = [
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Application Security",
      description: "Multi-layer protection for user-facing endpoints",
      items: [
        { category: "Rate Limiting", details: "Progressive rate limiting with exponential backoff (5 req/min base)", status: "implemented" },
        { category: "CAPTCHA", details: "Cloudflare Turnstile invisible challenge verification", status: "implemented" },
        { category: "Bot Detection", details: "9-layer protection: honeypots, timing, UA filtering, JS challenges", status: "implemented" },
        { category: "Input Validation", details: "Server-side validation, HTML escaping, email domain checks", status: "implemented" },
        { category: "XSS Prevention", details: "React's built-in escaping + manual escapeHtml utility", status: "implemented" },
      ],
    },
    {
      icon: <Database className="w-5 h-5" />,
      title: "Database Security",
      description: "Row-Level Security and access control policies",
      items: [
        { category: "RLS Enabled", details: "All tables have Row-Level Security enabled", status: "implemented" },
        { category: "Admin-Only Access", details: "Sensitive tables (tracking, logs) restricted to admin role", status: "implemented" },
        { category: "Service Role Isolation", details: "Server-side operations use service role, bypassing client RLS", status: "implemented" },
        { category: "Public INSERT Controls", details: "Public signup protected by Edge Function validation, not raw DB access", status: "implemented" },
        { category: "Role-Based Access", details: "has_role() function with SECURITY DEFINER for safe role checks", status: "implemented" },
      ],
    },
    {
      icon: <Key className="w-5 h-5" />,
      title: "Authentication & Authorization",
      description: "User identity and access management",
      items: [
        { category: "Supabase Auth", details: "Industry-standard authentication with email/password", status: "implemented" },
        { category: "Password Security", details: "HIBP breach checking for password validation", status: "implemented" },
        { category: "Role Management", details: "Separate user_roles table to prevent privilege escalation", status: "implemented" },
        { category: "Session Management", details: "JWT tokens with automatic refresh", status: "implemented" },
        { category: "Audit Logging", details: "Role changes logged to role_audit_log with actor tracking", status: "implemented" },
      ],
    },
    {
      icon: <Server className="w-5 h-5" />,
      title: "Backend Security",
      description: "Edge function and API protection",
      items: [
        { category: "Webhook Verification", details: "HMAC-SHA256 signature validation for Resend webhooks", status: "implemented" },
        { category: "Replay Protection", details: "5-minute timestamp validation for webhook requests", status: "implemented" },
        { category: "Cron Authentication", details: "X-Cron-Secret header validation for scheduled jobs", status: "implemented" },
        { category: "Function Allowlisting", details: "Only whitelisted edge functions can be scheduled/executed", status: "implemented" },
        { category: "SQL Injection Prevention", details: "Parameterized queries, no raw SQL execution", status: "implemented" },
      ],
    },
  ];

  // Static fallback policies (used when not logged in or for additional items)
  const staticRetentionPolicies = [
    { table: "exports (storage)", retention: "24 hours", automation: "Periodic cleanup function", purpose: "Temporary file storage", isEnabled: true },
  ];

  const formatTableName = (name: string) => {
    return name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  const getTablePurpose = useCallback((tableName: string): string => {
    const purposes: Record<string, string> = {
      bot_detection_events: "Security monitoring, threat detection",
      rate_limit_violations: "Rate limit analytics, abuse prevention",
      signup_error_logs: "Error debugging, signup troubleshooting",
      cron_failure_notifications: "Job monitoring, system health",
    };
    return purposes[tableName] || "Data management";
  }, []);

  const complianceChecklist: { requirement: string; status: "implemented" | "planned" | "n/a"; notes: string }[] = [
    { requirement: "Data minimization", status: "implemented", notes: "Only essential data collected; auto-purge policies active" },
    { requirement: "Purpose limitation", status: "implemented", notes: "Data used only for stated purposes in privacy policy" },
    { requirement: "Storage limitation", status: "implemented", notes: "Automatic retention policies purge old records" },
    { requirement: "Consent management", status: "implemented", notes: "Explicit consent for email signup; unsubscribe available" },
    { requirement: "Right to erasure", status: "implemented", notes: "Unsubscribe removes from active lists; admin can delete records" },
    { requirement: "Access controls", status: "implemented", notes: "RLS policies restrict access by role; admin audit logging" },
    { requirement: "Breach notification", status: "implemented", notes: "Alert system for security anomalies; admin notifications" },
    { requirement: "Data encryption", status: "implemented", notes: "TLS in transit; Supabase encryption at rest" },
  ];

  const handlePrint = () => {
    window.print();
  };

  const currentReportData = useMemo(() => ({
    metadata: {
      reportTitle: "Compliance & Security Report",
      reportDate: new Date().toISOString(),
      version: "1.0",
      classification: "Internal / Confidential",
      reviewCycle: "Quarterly",
      generatedBy: "Buoyancis Compliance System"
    },
    executiveSummary: {
      securityLayers: 9,
      rlsCoverage: "100%",
      autoPurgeTables: retentionSettings.filter(s => s.is_enabled).length || 4,
      monitoring: "24/7",
      auditTrail: "Full"
    },
    dataCollectionPractices: dataCollectionPractices.map(item => ({
      dataType: item.dataType,
      purpose: item.purpose,
      retention: item.retention,
      legalBasis: item.legalBasis,
      encryption: item.encrypted
    })),
    securityMeasures: securityMeasures.map(section => ({
      category: section.title,
      description: section.description,
      controls: section.items.map(item => ({
        name: item.category,
        details: item.details,
        status: item.status
      }))
    })),
    dataRetentionPolicies: {
      dynamicPolicies: retentionSettings.map(setting => ({
        tableName: setting.table_name,
        retentionDays: setting.retention_days,
        isEnabled: setting.is_enabled,
        description: setting.description || getTablePurpose(setting.table_name),
        automation: "Daily cron at 3:00 AM UTC",
        lastUpdated: setting.updated_at
      })),
      staticPolicies: staticRetentionPolicies.map(policy => ({
        resource: policy.table,
        retention: policy.retention,
        automation: policy.automation,
        purpose: policy.purpose,
        isEnabled: policy.isEnabled
      }))
    },
    complianceChecklist: complianceChecklist.map(item => ({
      requirement: item.requirement,
      status: item.status,
      notes: item.notes
    }))
  }), [retentionSettings, dataCollectionPractices, securityMeasures, staticRetentionPolicies, complianceChecklist, getTablePurpose]);

  const [isExporting, setIsExporting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);


  const validateOnly = async () => {
    setIsValidating(true);
    try {
      const validation = await validateComplianceReport(currentReportData);
      
      // Log validation attempt to history
      addValidationEntry("validate", validation.valid, validation.errors);
      
      if (!validation.valid) {
        toast({
          title: "Validation Failed",
          description: (
            <div className="mt-2 max-h-40 overflow-auto text-xs">
              <p className="mb-2 font-medium text-destructive">
                {validation.errors.length} error{validation.errors.length !== 1 ? "s" : ""} found:
              </p>
              <ul className="list-none space-y-2">
                {validation.errors.slice(0, 3).map((err, i) => (
                  <li key={i} className="border-l-2 border-destructive/30 pl-2">
                    <div className="font-medium">{err.path === "(root)" ? "Root" : err.path}</div>
                    <div className="text-muted-foreground">{err.message}</div>
                    <div className="font-mono text-[10px] text-muted-foreground/70">{err.schemaPath}</div>
                  </li>
                ))}
              </ul>
              {validation.errors.length > 3 && (
                <p className="mt-2 text-muted-foreground">
                  ...and {validation.errors.length - 3} more errors
                </p>
              )}
            </div>
          ),
          variant: "destructive",
        });
      } else {
        toast({
          title: "Validation Passed",
          description: (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Report data matches the JSON schema (Draft 2020-12)</span>
            </div>
          ),
        });
      }
    } catch (error) {
      const errorEntry: ValidationError = {
        path: "(root)",
        message: error instanceof Error ? error.message : "Unknown error",
        keyword: "error",
        schemaPath: "#",
      };
      addValidationEntry("validate", false, [errorEntry]);
      toast({
        title: "Validation Error",
        description: error instanceof Error ? error.message : "Failed to validate report",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const exportAsJSON = async () => {
    setIsExporting(true);
    try {
      const validation = await validateComplianceReport(currentReportData);
      
      if (!validation.valid) {
        addValidationEntry("export", false, validation.errors);
        toast({
          title: "Schema Validation Failed",
          description: (
            <div className="mt-2 max-h-40 overflow-auto text-xs">
              <p className="mb-2">The report data does not match the expected schema:</p>
              <ul className="list-none space-y-2">
                {validation.errors.slice(0, 3).map((err, i) => (
                  <li key={i} className="border-l-2 border-destructive/30 pl-2">
                    <div className="font-medium">{err.path === "(root)" ? "Root" : err.path}</div>
                    <div className="text-muted-foreground">{err.message}</div>
                  </li>
                ))}
              </ul>
              {validation.errors.length > 3 && (
                <p className="mt-2 text-muted-foreground">
                  ...and {validation.errors.length - 3} more errors
                </p>
              )}
            </div>
          ),
          variant: "destructive",
        });
        return;
      }

      const jsonString = JSON.stringify(currentReportData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `compliance-report-${format(new Date(), "yyyy-MM-dd")}.json`;
      link.click();
      URL.revokeObjectURL(url);

      addValidationEntry("export", true);
      toast({
        title: "Export Successful",
        description: "Compliance report validated and exported successfully.",
      });
    } catch (error) {
      const errorEntry: ValidationError = {
        path: "(root)",
        message: error instanceof Error ? error.message : "Unknown error",
        keyword: "error",
        schemaPath: "#",
      };
      addValidationEntry("export", false, [errorEntry]);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export report",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const copyToClipboard = useCallback(async () => {
    try {
      const validation = await validateComplianceReport(currentReportData);
      
      if (!validation.valid) {
        addValidationEntry("copy", false, validation.errors);
        toast({
          title: "Schema Validation Failed",
          description: `Cannot copy: ${validation.errors.length} validation error(s) found`,
          variant: "destructive",
        });
        return;
      }

      const jsonString = JSON.stringify(currentReportData, null, 2);
      await navigator.clipboard.writeText(jsonString);
      setIsCopied(true);
      
      addValidationEntry("copy", true);
      toast({
        title: "Copied to Clipboard",
        description: "Compliance report JSON copied successfully.",
      });

      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      const errorEntry: ValidationError = {
        path: "(root)",
        message: error instanceof Error ? error.message : "Unknown error",
        keyword: "error",
        schemaPath: "#",
      };
      addValidationEntry("copy", false, [errorEntry]);
      toast({
        title: "Copy Failed",
        description: error instanceof Error ? error.message : "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  }, [currentReportData, addValidationEntry]);

  // Keyboard shortcut: Ctrl+C when page is focused (and no text selected)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputField = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      // Ctrl+C for copy (when no text selected and not in input)
      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        const selection = window.getSelection();
        const hasSelection = selection && selection.toString().length > 0;
        
        if (hasSelection) return;
        if (isInputField) return;

        e.preventDefault();
        copyToClipboard();
        return;
      }

      // Ctrl+E for export as JSON
      if ((e.ctrlKey || e.metaKey) && e.key === "e") {
        if (isInputField) return;

        e.preventDefault();
        exportAsJSON();
        return;
      }

      // Ctrl+V for validate schema (when not in input - preserve paste behavior)
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        if (isInputField) return;

        e.preventDefault();
        validateOnly();
        return;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [copyToClipboard, exportAsJSON, validateOnly]);

  return (
    <div className="min-h-screen bg-background print:bg-white">
      {/* Header */}
      <header className="border-b bg-card print:bg-white print:border-gray-300">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary text-primary-foreground print:bg-gray-800">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Compliance & Security Report</h1>
                <p className="text-muted-foreground">Data Handling & Protection Documentation</p>
              </div>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={() => setShowPreview(true)}>
                      <FileSearch className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Preview document <kbd className="ml-1 px-1.5 py-0.5 text-xs bg-muted rounded">Ctrl+P</kbd></p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <ComplianceReportComparison currentReport={currentReportData} onValidationEntry={addValidationEntry} />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={validateOnly} disabled={isValidating}>
                      {isValidating ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                      )}
                      {isValidating ? "Validating..." : "Validate"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Check report against JSON schema without downloading</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button variant="outline" onClick={exportAsJSON} disabled={isExporting}>
                {isExporting ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileJson className="w-4 h-4 mr-2" />
                )}
                {isExporting ? "Validating..." : "Export JSON"}
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={copyToClipboard} disabled={isCopied}>
                      {isCopied ? (
                        <Check className="w-4 h-4 mr-2 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 mr-2" />
                      )}
                      {isCopied ? "Copied!" : "Copy"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy JSON to clipboard <kbd className="ml-1 px-1.5 py-0.5 text-xs bg-muted rounded">Ctrl+C</kbd></p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        const subject = encodeURIComponent("Compliance & Security Report");
                        const bodyContent = `Please find the Compliance & Security Report attached below:\n\n---\n\n${JSON.stringify(currentReportData, null, 2)}`;
                        const encodedBody = encodeURIComponent(bodyContent);
                        const mailtoUrl = `mailto:?subject=${subject}&body=${encodedBody}`;
                        
                        // URL length limits: ~2000 chars for IE/Edge, ~2083 for Chrome, varies by browser
                        const URL_LENGTH_WARNING = 1800;
                        const URL_LENGTH_LIMIT = 2000;
                        
                        if (mailtoUrl.length > URL_LENGTH_LIMIT) {
                          toast({
                            title: "Email Body Too Large",
                            description: (
                              <div className="text-sm space-y-2">
                                <p>The report is too large ({mailtoUrl.length.toLocaleString()} characters) for some email clients.</p>
                                <p className="text-muted-foreground">Consider using "Copy" and pasting into your email client instead.</p>
                              </div>
                            ),
                            variant: "destructive",
                          });
                          return;
                        }
                        
                        if (mailtoUrl.length > URL_LENGTH_WARNING) {
                          toast({
                            title: "Large Email Content",
                            description: `The mailto: URL is ${mailtoUrl.length.toLocaleString()} characters. Some browsers may truncate content over 2,000 characters.`,
                            variant: "default",
                          });
                        }
                        
                        window.location.href = mailtoUrl;
                      }}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Share via Email
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Open email client with report (may be truncated for large reports)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        const shareUrl = window.location.href;
                        navigator.clipboard.writeText(shareUrl);
                        toast({
                          title: "Link Copied",
                          description: "Shareable URL copied to clipboard",
                        });
                      }}
                    >
                      <Link2 className="w-4 h-4 mr-2" />
                      Share Link
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy shareable URL to clipboard</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <QRCodeDialog 
                      title="Share Compliance Report"
                      description="Scan this QR code to access the compliance report"
                    >
                      <Button variant="outline">
                        <QrCode className="w-4 h-4 mr-2" />
                        QR Code
                      </Button>
                    </QRCodeDialog>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Generate QR code for sharing</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <SocialShareButtons 
                title="Compliance & Security Report - Buoyancis"
                description="View our comprehensive compliance and security documentation including GDPR measures, data retention policies, and security controls."
              />
              <Button variant="outline" onClick={() => setShowSchemaModal(true)}>
                <Code2 className="w-4 h-4 mr-2" />
                View Schema
              </Button>
              <Button variant="outline" onClick={handlePrint}>
                <Download className="w-4 h-4 mr-2" />
                Print/Export
              </Button>
              <Button variant="outline" size="icon" onClick={() => setShowShortcuts(true)} title="Keyboard shortcuts (Shift+?)">
                <Keyboard className="w-4 h-4" />
              </Button>
              <Button variant="outline" asChild>
                <Link to="/security-docs">Security Details</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/">Back to Home</Link>
              </Button>
            </div>

      <PrintPreview 
        isOpen={showPreview} 
        onClose={() => setShowPreview(false)} 
        title="Compliance & Security Report"
      />
      <SchemaViewerModal 
        open={showSchemaModal} 
        onOpenChange={setShowSchemaModal} 
      />
      <KeyboardShortcutsOverlay
        open={showShortcuts}
        onOpenChange={setShowShortcuts}
        groups={complianceShortcutGroups}
        title="Compliance Report Shortcuts"
      />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Report Metadata */}
        <Card className="mb-8 print:shadow-none print:border-gray-300">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Report Date</div>
                <div className="font-medium">{reportDate}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Version</div>
                <div className="font-medium">1.0</div>
              </div>
              <div>
                <div className="text-muted-foreground">Classification</div>
                <div className="font-medium">Internal / Confidential</div>
              </div>
              <div>
                <div className="text-muted-foreground">Review Cycle</div>
                <div className="font-medium">Quarterly</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Validation History Log */}
        <div className="print:hidden">
          <ValidationHistoryLog 
            history={validationHistory} 
            onClear={clearValidationHistory} 
          />
        </div>

        {/* Executive Summary */}
        <section className="mb-12">
          <Card className="bg-primary/5 border-primary/20 print:bg-gray-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                This document provides a comprehensive overview of security measures and data handling 
                practices implemented in the application. The system employs defense-in-depth strategies 
                across multiple layers including application security, database access controls, 
                authentication, and automated monitoring.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-background rounded-lg print:border print:border-gray-200">
                  <div className="text-2xl font-bold text-primary">9</div>
                  <div className="text-xs text-muted-foreground">Security Layers</div>
                </div>
                <div className="text-center p-4 bg-background rounded-lg print:border print:border-gray-200">
                  <div className="text-2xl font-bold text-primary">100%</div>
                  <div className="text-xs text-muted-foreground">RLS Coverage</div>
                </div>
                <div className="text-center p-4 bg-background rounded-lg print:border print:border-gray-200">
                  <div className="text-2xl font-bold text-primary">
                    {retentionSettings.filter(s => s.is_enabled).length || 4}
                  </div>
                  <div className="text-xs text-muted-foreground">Auto-Purge Tables</div>
                </div>
                <div className="text-center p-4 bg-background rounded-lg print:border print:border-gray-200">
                  <div className="text-2xl font-bold text-primary">24/7</div>
                  <div className="text-xs text-muted-foreground">Monitoring</div>
                </div>
                <div className="text-center p-4 bg-background rounded-lg print:border print:border-gray-200">
                  <div className="text-2xl font-bold text-primary">Full</div>
                  <div className="text-xs text-muted-foreground">Audit Trail</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Data Collection Practices */}
        <section className="mb-12 print:break-before-page">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Data Collection Practices
          </h2>
          <Card className="print:shadow-none">
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data Type</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Retention</TableHead>
                    <TableHead>Legal Basis</TableHead>
                    <TableHead>Encryption</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dataCollectionPractices.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.dataType}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.purpose}</TableCell>
                      <TableCell>{item.retention}</TableCell>
                      <TableCell>{item.legalBasis}</TableCell>
                      <TableCell>{item.encrypted}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        {/* Security Measures */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Security Measures
          </h2>
          <div className="space-y-6">
            {securityMeasures.map((section, sectionIndex) => (
              <Card key={sectionIndex} className="print:shadow-none print:break-inside-avoid">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary print:bg-gray-100">
                      {section.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      <CardDescription>{section.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-1/4">Category</TableHead>
                        <TableHead>Implementation Details</TableHead>
                        <TableHead className="w-32">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {section.items.map((item, itemIndex) => (
                        <TableRow key={itemIndex}>
                          <TableCell className="font-medium">{item.category}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{item.details}</TableCell>
                          <TableCell><StatusBadge status={item.status} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator className="my-12 print:hidden" />

        {/* Data Retention Policies */}
        <section className="mb-12 print:break-before-page" id="data-retention">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Data Retention Policies
          </h2>
          <Card className="print:shadow-none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardDescription>
                  Automatic data purging is configured to minimize data retention and comply with 
                  data minimization principles. The cleanup job runs daily at 3:00 AM UTC.
                </CardDescription>
                {retentionSettings.length > 0 && (
                  <Badge variant="secondary" className="print:hidden">
                    Live Data
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingRetention ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Table/Resource</TableHead>
                      <TableHead>Retention Period</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Automation</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead className="print:hidden">Last Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {retentionSettings.map((setting) => (
                      <TableRow key={setting.id}>
                        <TableCell className="font-mono text-sm">{setting.table_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{setting.retention_days} days</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={setting.is_enabled ? "default" : "secondary"}>
                            {setting.is_enabled ? "Active" : "Disabled"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          Daily cron at 3:00 AM UTC
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {setting.description || getTablePurpose(setting.table_name)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground print:hidden">
                          {format(new Date(setting.updated_at), "MMM d, yyyy")}
                        </TableCell>
                      </TableRow>
                    ))}
                    {staticRetentionPolicies.map((policy, index) => (
                      <TableRow key={`static-${index}`}>
                        <TableCell className="font-mono text-sm">{policy.table}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{policy.retention}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={policy.isEnabled ? "default" : "secondary"}>
                            {policy.isEnabled ? "Active" : "Disabled"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{policy.automation}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{policy.purpose}</TableCell>
                        <TableCell className="text-sm text-muted-foreground print:hidden">—</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              
              {/* Summary Statistics */}
              {!isLoadingRetention && retentionSettings.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="text-sm font-medium mb-3">Retention Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-lg font-bold text-primary">
                        {retentionSettings.filter(s => s.is_enabled).length}
                      </div>
                      <div className="text-xs text-muted-foreground">Active Policies</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-lg font-bold text-primary">
                        {retentionSettings.filter(s => !s.is_enabled).length}
                      </div>
                      <div className="text-xs text-muted-foreground">Disabled Policies</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-lg font-bold text-primary">
                        {Math.min(...retentionSettings.map(s => s.retention_days))} days
                      </div>
                      <div className="text-xs text-muted-foreground">Shortest Retention</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-lg font-bold text-primary">
                        {Math.max(...retentionSettings.map(s => s.retention_days))} days
                      </div>
                      <div className="text-xs text-muted-foreground">Longest Retention</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Compliance Checklist */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Compliance Checklist
          </h2>
          <Card className="print:shadow-none">
            <CardHeader>
              <CardDescription>
                Overview of data protection requirements and implementation status.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Requirement</TableHead>
                    <TableHead className="w-32">Status</TableHead>
                    <TableHead>Implementation Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complianceChecklist.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.requirement}</TableCell>
                      <TableCell><StatusBadge status={item.status} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        <Separator className="my-12 print:hidden" />

        {/* Audit & Monitoring */}
        <section className="mb-12 print:break-before-page">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <History className="w-5 h-5" />
            Audit & Monitoring Capabilities
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="print:shadow-none">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Role Audit Logging
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    All role assignments/revocations logged
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    Actor (who made change) and target user tracked
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    Date-range filtering and CSV export available
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    Email notifications on role changes (admin)
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="print:shadow-none">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Security Event Monitoring
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    Real-time bot detection event streaming
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    Rate limit violation tracking and trends
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    Spike detection with admin alerts
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    Geographic threat visualization (world map)
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="print:shadow-none">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Compliance Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    Automatic unsubscribe list management
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    Bounce and complaint tracking with Resend
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    Suppression list enforcement before sending
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    Deliverability alerts and escalation
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="print:shadow-none">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Scheduled Job Monitoring
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    Cron job success/failure tracking
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    7-day trend visualization
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    Failure notifications to admins
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    Success rate threshold alerts
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Related Documentation */}
        <section className="mb-12 print:hidden">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Related Documentation
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="text-lg">Security Details</CardTitle>
                <CardDescription>
                  In-depth documentation of the 9-layer security architecture
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild className="w-full">
                  <Link to="/security-docs">View Security Docs</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="text-lg">Admin Dashboard</CardTitle>
                <CardDescription>
                  Real-time monitoring and management interface
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild className="w-full">
                  <Link to="/admin">Open Dashboard</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="text-lg">API Documentation</CardTitle>
                <CardDescription>
                  Edge function endpoints and authentication
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" disabled className="w-full">
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground py-8 border-t print:border-gray-300">
          <p>Generated: {reportDate}</p>
          <p className="mt-2">
            This document is for internal use only. For questions, contact the security team.
          </p>
          <p className="mt-4 text-xs">
            Document Version 1.0 | Next Review: Quarterly
          </p>
        </footer>
      </main>

      <BackToTopButton />

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            margin: 1in;
            size: A4;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
