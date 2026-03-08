import { useState, useRef } from "react";
import { Upload, GitCompare, X, ArrowUp, ArrowDown, Minus, AlertCircle, CheckCircle2, Clock, RefreshCw, ShieldCheck, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { format } from "date-fns";
import { validateComplianceReport, ValidationError, formatValidationError } from "@/lib/schemaValidator";
import { ValidationHistoryEntry } from "@/hooks/useValidationHistory";

interface ImportedReport {
  metadata: {
    reportTitle: string;
    reportDate: string;
    version: string;
    classification: string;
    reviewCycle: string;
    generatedBy: string;
  };
  executiveSummary: {
    securityLayers: number;
    rlsCoverage: string;
    autoPurgeTables: number;
    monitoring: string;
    auditTrail: string;
  };
  dataCollectionPractices: Array<{
    dataType: string;
    purpose: string;
    retention: string;
    legalBasis: string;
    encryption: string;
  }>;
  securityMeasures: Array<{
    category: string;
    description: string;
    controls: Array<{
      name: string;
      details: string;
      status: string;
    }>;
  }>;
  dataRetentionPolicies: {
    dynamicPolicies: Array<{
      tableName: string;
      retentionDays: number;
      isEnabled: boolean;
      description: string;
      automation: string;
      lastUpdated?: string;
    }>;
    staticPolicies: Array<{
      resource: string;
      retention: string;
      automation: string;
      purpose: string;
      isEnabled: boolean;
    }>;
  };
  complianceChecklist: Array<{
    requirement: string;
    status: string;
    notes: string;
  }>;
}

interface ComparisonResult {
  type: "added" | "removed" | "changed" | "unchanged";
  field: string;
  category: string;
  oldValue?: string | number | boolean;
  newValue?: string | number | boolean;
}

interface ComplianceReportComparisonProps {
  currentReport: ImportedReport;
  onValidationEntry?: (
    action: ValidationHistoryEntry["action"],
    success: boolean,
    errors?: ValidationError[]
  ) => void;
}

export default function ComplianceReportComparison({ currentReport, onValidationEntry }: ComplianceReportComparisonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [importedReport, setImportedReport] = useState<ImportedReport | null>(null);
  const [comparisons, setComparisons] = useState<ComparisonResult[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [schemaValidation, setSchemaValidation] = useState<{ valid: boolean; errors: ValidationError[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateReport = (data: unknown): data is ImportedReport => {
    if (!data || typeof data !== "object") return false;
    const report = data as Record<string, unknown>;
    return (
      "metadata" in report &&
      "executiveSummary" in report &&
      "dataCollectionPractices" in report &&
      "securityMeasures" in report &&
      "dataRetentionPolicies" in report &&
      "complianceChecklist" in report
    );
  };

  const compareReports = (oldReport: ImportedReport, newReport: ImportedReport): ComparisonResult[] => {
    const results: ComparisonResult[] = [];

    // Compare executive summary
    const summaryFields: (keyof ImportedReport["executiveSummary"])[] = [
      "securityLayers", "rlsCoverage", "autoPurgeTables", "monitoring", "auditTrail"
    ];
    
    summaryFields.forEach(field => {
      const oldVal = oldReport.executiveSummary[field];
      const newVal = newReport.executiveSummary[field];
      if (oldVal !== newVal) {
        results.push({
          type: "changed",
          field: field.replace(/([A-Z])/g, " $1").trim(),
          category: "Executive Summary",
          oldValue: oldVal,
          newValue: newVal
        });
      }
    });

    // Compare security measures
    const oldControlMap = new Map<string, { status: string; details: string }>();
    const newControlMap = new Map<string, { status: string; details: string }>();

    oldReport.securityMeasures.forEach(section => {
      section.controls.forEach(control => {
        oldControlMap.set(`${section.category}:${control.name}`, { status: control.status, details: control.details });
      });
    });

    newReport.securityMeasures.forEach(section => {
      section.controls.forEach(control => {
        newControlMap.set(`${section.category}:${control.name}`, { status: control.status, details: control.details });
      });
    });

    // Find added controls
    newControlMap.forEach((value, key) => {
      if (!oldControlMap.has(key)) {
        const [category, name] = key.split(":");
        results.push({
          type: "added",
          field: name,
          category: `Security: ${category}`,
          newValue: value.status
        });
      }
    });

    // Find removed controls
    oldControlMap.forEach((value, key) => {
      if (!newControlMap.has(key)) {
        const [category, name] = key.split(":");
        results.push({
          type: "removed",
          field: name,
          category: `Security: ${category}`,
          oldValue: value.status
        });
      }
    });

    // Find changed controls
    oldControlMap.forEach((oldValue, key) => {
      const newValue = newControlMap.get(key);
      if (newValue && (oldValue.status !== newValue.status || oldValue.details !== newValue.details)) {
        const [category, name] = key.split(":");
        results.push({
          type: "changed",
          field: name,
          category: `Security: ${category}`,
          oldValue: oldValue.status,
          newValue: newValue.status
        });
      }
    });

    // Compare retention policies
    const oldRetentionMap = new Map<string, { days: number; enabled: boolean }>();
    const newRetentionMap = new Map<string, { days: number; enabled: boolean }>();

    oldReport.dataRetentionPolicies.dynamicPolicies.forEach(policy => {
      oldRetentionMap.set(policy.tableName, { days: policy.retentionDays, enabled: policy.isEnabled });
    });

    newReport.dataRetentionPolicies.dynamicPolicies.forEach(policy => {
      newRetentionMap.set(policy.tableName, { days: policy.retentionDays, enabled: policy.isEnabled });
    });

    // Find retention changes
    newRetentionMap.forEach((newValue, tableName) => {
      const oldValue = oldRetentionMap.get(tableName);
      if (!oldValue) {
        results.push({
          type: "added",
          field: tableName.replace(/_/g, " "),
          category: "Data Retention",
          newValue: `${newValue.days} days`
        });
      } else if (oldValue.days !== newValue.days || oldValue.enabled !== newValue.enabled) {
        results.push({
          type: "changed",
          field: tableName.replace(/_/g, " "),
          category: "Data Retention",
          oldValue: `${oldValue.days} days (${oldValue.enabled ? "enabled" : "disabled"})`,
          newValue: `${newValue.days} days (${newValue.enabled ? "enabled" : "disabled"})`
        });
      }
    });

    oldRetentionMap.forEach((oldValue, tableName) => {
      if (!newRetentionMap.has(tableName)) {
        results.push({
          type: "removed",
          field: tableName.replace(/_/g, " "),
          category: "Data Retention",
          oldValue: `${oldValue.days} days`
        });
      }
    });

    // Compare compliance checklist
    const oldChecklistMap = new Map<string, string>();
    const newChecklistMap = new Map<string, string>();

    oldReport.complianceChecklist.forEach(item => {
      oldChecklistMap.set(item.requirement, item.status);
    });

    newReport.complianceChecklist.forEach(item => {
      newChecklistMap.set(item.requirement, item.status);
    });

    newChecklistMap.forEach((newStatus, requirement) => {
      const oldStatus = oldChecklistMap.get(requirement);
      if (!oldStatus) {
        results.push({
          type: "added",
          field: requirement,
          category: "Compliance Checklist",
          newValue: newStatus
        });
      } else if (oldStatus !== newStatus) {
        results.push({
          type: "changed",
          field: requirement,
          category: "Compliance Checklist",
          oldValue: oldStatus,
          newValue: newStatus
        });
      }
    });

    return results;
  };

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith(".json")) {
      toast.error("Please upload a JSON file");
      return;
    }

    setIsValidating(true);
    setSchemaValidation(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        // Basic structure validation first
        if (!validateReport(data)) {
          const structureErrors: ValidationError[] = [{
            path: "(root)",
            message: "Invalid compliance report format. Missing required sections.",
            keyword: "required",
            schemaPath: "#/required",
          }];
          setSchemaValidation({ 
            valid: false, 
            errors: structureErrors
          });
          setIsValidating(false);
          // Track failed import in validation history
          onValidationEntry?.("import", false, structureErrors);
          toast.error("Invalid compliance report format");
          return;
        }

        // Full JSON schema validation
        const schemaResult = await validateComplianceReport(data);
        setSchemaValidation(schemaResult);

        if (!schemaResult.valid) {
          setIsValidating(false);
          // Track failed import in validation history
          onValidationEntry?.("import", false, schemaResult.errors);
          toast.error(`Schema validation failed: ${schemaResult.errors.length} error(s)`);
          // Still set the imported report so user can see validation errors
          setImportedReport(data);
          return;
        }

        setImportedReport(data);
        const results = compareReports(data, currentReport);
        setComparisons(results);
        // Track successful import in validation history
        onValidationEntry?.("import", true, []);
        toast.success("Report validated and imported successfully");
      } catch {
        const parseErrors: ValidationError[] = [{
          path: "(root)",
          message: "Failed to parse JSON file",
          keyword: "parse",
          schemaPath: "#",
        }];
        setSchemaValidation({ 
          valid: false, 
          errors: parseErrors
        });
        // Track failed import in validation history
        onValidationEntry?.("import", false, parseErrors);
        toast.error("Failed to parse JSON file");
      } finally {
        setIsValidating(false);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const getChangeIcon = (type: ComparisonResult["type"]) => {
    switch (type) {
      case "added":
        return <ArrowUp className="w-4 h-4 text-green-500" />;
      case "removed":
        return <ArrowDown className="w-4 h-4 text-red-500" />;
      case "changed":
        return <GitCompare className="w-4 h-4 text-amber-500" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getChangeBadge = (type: ComparisonResult["type"]) => {
    switch (type) {
      case "added":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Added</Badge>;
      case "removed":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Removed</Badge>;
      case "changed":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Changed</Badge>;
      default:
        return <Badge variant="outline">Unchanged</Badge>;
    }
  };

  const groupedComparisons = comparisons.reduce((acc, comparison) => {
    if (!acc[comparison.category]) {
      acc[comparison.category] = [];
    }
    acc[comparison.category].push(comparison);
    return acc;
  }, {} as Record<string, ComparisonResult[]>);

  const stats = {
    added: comparisons.filter(c => c.type === "added").length,
    removed: comparisons.filter(c => c.type === "removed").length,
    changed: comparisons.filter(c => c.type === "changed").length
  };

  const clearImport = () => {
    setImportedReport(null);
    setComparisons([]);
    setSchemaValidation(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const downloadSchema = async () => {
    try {
      const response = await fetch("/schemas/compliance-report.schema.json");
      const schema = await response.json();
      const blob = new Blob([JSON.stringify(schema, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "compliance-report.schema.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Schema downloaded successfully");
    } catch {
      toast.error("Failed to download schema");
    }
  };

  const proceedWithComparison = () => {
    if (importedReport) {
      const results = compareReports(importedReport, currentReport);
      setComparisons(results);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="w-4 h-4 mr-2" />
          Import & Compare
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompare className="w-5 h-5" />
            Compare Compliance Reports
          </DialogTitle>
          <DialogDescription>
            Import a previous compliance report JSON to compare with the current version
          </DialogDescription>
        </DialogHeader>

        {!importedReport ? (
          <div className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
              } ${isValidating ? "opacity-50 pointer-events-none" : ""}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {isValidating ? (
                <>
                  <RefreshCw className="w-12 h-12 mx-auto text-primary mb-4 animate-spin" />
                  <p className="text-lg font-medium mb-2">Validating against JSON schema...</p>
                  <p className="text-muted-foreground">Please wait</p>
                </>
              ) : (
                <>
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">Drop your compliance report JSON here</p>
                  <p className="text-muted-foreground mb-4">Files are validated against the compliance schema before comparison</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <div className="flex items-center gap-2 justify-center">
                    <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                      Select File
                    </Button>
                    <Button variant="outline" onClick={downloadSchema}>
                      <Download className="w-4 h-4 mr-2" />
                      Download Schema
                    </Button>
                  </div>
                </>
              )}
            </div>

            {schemaValidation && !schemaValidation.valid && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Schema Validation Failed</AlertTitle>
                <AlertDescription>
                  <div className="mt-2 max-h-32 overflow-auto text-xs">
                    <p className="mb-2">{schemaValidation.errors.length} error(s) found:</p>
                    <ul className="list-none space-y-2">
                      {schemaValidation.errors.slice(0, 5).map((err, i) => (
                        <li key={i} className="border-l-2 border-destructive/30 pl-2">
                          <div className="font-medium">{err.path === "(root)" ? "Root" : err.path}</div>
                          <div className="text-muted-foreground">{err.message}</div>
                          <div className="font-mono text-[10px] text-muted-foreground/70">{err.schemaPath}</div>
                        </li>
                      ))}
                    </ul>
                    {schemaValidation.errors.length > 5 && (
                      <p className="mt-2 text-muted-foreground">
                        ...and {schemaValidation.errors.length - 5} more errors
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-6">
              {/* Schema validation status */}
              {schemaValidation && (
                <Alert variant={schemaValidation.valid ? "default" : "destructive"}>
                  {schemaValidation.valid ? (
                    <ShieldCheck className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>
                    {schemaValidation.valid ? "Schema Validation Passed" : "Schema Validation Failed"}
                  </AlertTitle>
                  <AlertDescription>
                    {schemaValidation.valid ? (
                      "The imported report matches the compliance schema (Draft 2020-12)"
                    ) : (
                      <div className="mt-2 max-h-24 overflow-auto text-xs">
                        <ul className="list-none space-y-2">
                          {schemaValidation.errors.slice(0, 3).map((err, i) => (
                            <li key={i} className="border-l-2 border-destructive/30 pl-2">
                              <div className="font-medium">{err.path === "(root)" ? "Root" : err.path}</div>
                              <div className="text-muted-foreground">{err.message}</div>
                            </li>
                          ))}
                        </ul>
                        {schemaValidation.errors.length > 3 && (
                          <p className="mt-1">...and {schemaValidation.errors.length - 3} more</p>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={proceedWithComparison}
                        >
                          Compare Anyway
                        </Button>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Version comparison header */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Imported Report
                      {schemaValidation?.valid && (
                        <Badge variant="outline" className="ml-auto text-green-600 border-green-500/30">
                          <ShieldCheck className="w-3 h-3 mr-1" />
                          Valid
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <div className="text-muted-foreground">
                      {format(new Date(importedReport.metadata.reportDate), "PPP")}
                    </div>
                    <div>Version {importedReport.metadata.version}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      Current Report
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <div className="text-muted-foreground">
                      {format(new Date(currentReport.metadata.reportDate), "PPP")}
                    </div>
                    <div>Version {currentReport.metadata.version}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Change statistics */}
              <div className="flex gap-4 justify-center">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10">
                  <ArrowUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">{stats.added} Added</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10">
                  <GitCompare className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium">{stats.changed} Changed</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10">
                  <ArrowDown className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium">{stats.removed} Removed</span>
                </div>
              </div>

              {comparisons.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-3" />
                  <p className="text-lg font-medium">No differences found</p>
                  <p className="text-muted-foreground">The reports are identical</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedComparisons).map(([category, changes]) => (
                    <Card key={category}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">{category}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {changes.map((change, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-3 p-2 rounded-md bg-muted/50"
                            >
                              {getChangeIcon(change.type)}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium capitalize">{change.field}</span>
                                  {getChangeBadge(change.type)}
                                </div>
                                {(change.oldValue !== undefined || change.newValue !== undefined) && (
                                  <div className="text-sm text-muted-foreground mt-1">
                                    {change.oldValue !== undefined && (
                                      <span className="line-through mr-2">{String(change.oldValue)}</span>
                                    )}
                                    {change.newValue !== undefined && (
                                      <span className="text-foreground">{String(change.newValue)}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <Separator />

              <div className="flex justify-between">
                <Button variant="outline" onClick={clearImport}>
                  <X className="w-4 h-4 mr-2" />
                  Clear & Import Another
                </Button>
                <Button onClick={() => setIsOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
