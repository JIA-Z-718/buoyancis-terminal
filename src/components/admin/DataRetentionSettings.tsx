import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Database, Save, RefreshCw, Clock, Trash2, Play, Eye, AlertTriangle, History, Download, ListChecks } from "lucide-react";
import CleanupHistoryLog from "./CleanupHistoryLog";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";

interface CleanupPreview {
  table: string;
  deleted_count: number;
  retention_days: number;
}

interface RetentionSetting {
  id: string;
  table_name: string;
  retention_days: number;
  description: string | null;
  is_enabled: boolean;
  updated_at: string;
}

interface AuditLogEntry {
  id: string;
  table_name: string;
  field_changed: string;
  old_value: string | null;
  new_value: string | null;
  changed_by: string | null;
  changed_at: string;
}

export default function DataRetentionSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<RetentionSetting[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunningCleanup, setIsRunningCleanup] = useState(false);
  const [cleanupInProgress, setCleanupInProgress] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [cleanupPreview, setCleanupPreview] = useState<CleanupPreview[] | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [tableToCleanup, setTableToCleanup] = useState<string | null>(null);
  const [editedSettings, setEditedSettings] = useState<Record<string, { retention_days: number; is_enabled: boolean }>>({});
  const { toast } = useToast();

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("data_retention_settings")
        .select("*")
        .order("table_name");

      if (error) throw error;
      setSettings(data || []);
      
      // Initialize edited settings
      const initial: Record<string, { retention_days: number; is_enabled: boolean }> = {};
      (data || []).forEach(s => {
        initial[s.id] = { retention_days: s.retention_days, is_enabled: s.is_enabled };
      });
      setEditedSettings(initial);
    } catch (error) {
      console.error("Error fetching retention settings:", error);
      toast({
        title: "Error",
        description: "Failed to load retention settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAuditLog = async () => {
    setIsLoadingAudit(true);
    try {
      const { data, error } = await supabase
        .from("retention_policy_audit_log")
        .select("*")
        .order("changed_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setAuditLog(data || []);
    } catch (error) {
      console.error("Error fetching audit log:", error);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchAuditLog();
  }, []);

  const handleRetentionChange = (id: string, value: string) => {
    const days = parseInt(value) || 1;
    setEditedSettings(prev => ({
      ...prev,
      [id]: { ...prev[id], retention_days: Math.max(1, Math.min(365, days)) }
    }));
  };

  const handleEnabledChange = (id: string, enabled: boolean) => {
    setEditedSettings(prev => ({
      ...prev,
      [id]: { ...prev[id], is_enabled: enabled }
    }));
  };

  const hasChanges = (setting: RetentionSetting) => {
    const edited = editedSettings[setting.id];
    if (!edited) return false;
    return edited.retention_days !== setting.retention_days || edited.is_enabled !== setting.is_enabled;
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const updates = settings
        .filter(hasChanges)
        .map(s => ({
          id: s.id,
          retention_days: editedSettings[s.id].retention_days,
          is_enabled: editedSettings[s.id].is_enabled
        }));

      for (const update of updates) {
        const { error } = await supabase
          .from("data_retention_settings")
          .update({
            retention_days: update.retention_days,
            is_enabled: update.is_enabled,
            updated_by: user?.id || null
          })
          .eq("id", update.id);

        if (error) throw error;
      }

      toast({
        title: "Settings Saved",
        description: `Updated ${updates.length} retention setting(s)`
      });

      await fetchSettings();
      await fetchAuditLog(); // Refresh audit log after saving
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save retention settings",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const exportAuditLog = () => {
    const headers = ["Date", "Table", "Field Changed", "Old Value", "New Value"];
    const rows = auditLog.map(entry => [
      format(new Date(entry.changed_at), "yyyy-MM-dd HH:mm:ss"),
      formatTableName(entry.table_name),
      entry.field_changed,
      entry.old_value || "",
      entry.new_value || ""
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `retention-policy-audit-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const pendingChanges = settings.filter(hasChanges).length;

  const getTableIcon = (tableName: string) => {
    switch (tableName) {
      case "bot_detection_events":
        return "🤖";
      case "rate_limit_violations":
        return "⚡";
      case "signup_error_logs":
        return "📝";
      case "cron_failure_notifications":
        return "⏰";
      default:
        return "📊";
    }
  };

  const formatTableName = (name: string) => {
    return name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Data Retention Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Data Retention Settings
            </CardTitle>
            <CardDescription className="mt-1">
              Configure how long data is kept before automatic cleanup
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {pendingChanges > 0 && (
              <Badge variant="secondary">{pendingChanges} unsaved</Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSettings}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              size="sm"
              onClick={saveSettings}
              disabled={isSaving || pendingChanges === 0}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="cleanup-history" className="flex items-center gap-2">
              <ListChecks className="w-4 h-4" />
              Cleanup History
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Change History
              {auditLog.length > 0 && (
                <Badge variant="secondary" className="ml-1">{auditLog.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <div className="space-y-4">
          {settings.map((setting) => {
            const edited = editedSettings[setting.id];
            const changed = hasChanges(setting);

            return (
              <div
                key={setting.id}
                className={`p-4 rounded-lg border ${changed ? 'border-primary bg-primary/5' : 'border-border'} transition-colors`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getTableIcon(setting.table_name)}</span>
                      <h4 className="font-medium">{formatTableName(setting.table_name)}</h4>
                      {changed && (
                        <Badge variant="outline" className="text-xs">Modified</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {setting.description || `Data from ${setting.table_name}`}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Last updated: {format(new Date(setting.updated_at), "PPp")}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`enabled-${setting.id}`} className="text-sm text-muted-foreground">
                        Enabled
                      </Label>
                      <Switch
                        id={`enabled-${setting.id}`}
                        checked={edited?.is_enabled ?? setting.is_enabled}
                        onCheckedChange={(checked) => handleEnabledChange(setting.id, checked)}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        min={1}
                        max={365}
                        value={edited?.retention_days ?? setting.retention_days}
                        onChange={(e) => handleRetentionChange(setting.id, e.target.value)}
                        className="w-20 text-center"
                        disabled={!(edited?.is_enabled ?? setting.is_enabled)}
                      />
                      <span className="text-sm text-muted-foreground">days</span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTableToCleanup(setting.table_name);
                        setShowConfirmDialog(true);
                      }}
                      disabled={!(edited?.is_enabled ?? setting.is_enabled) || cleanupInProgress === setting.table_name}
                      className="ml-2"
                    >
                      {cleanupInProgress === setting.table_name ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                      <span className="ml-1 hidden sm:inline">Clean</span>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
            </div>

            <Separator className="my-6" />

        {/* Manual Cleanup Section */}
        <div className="p-4 border rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium flex items-center gap-2">
                <Play className="w-4 h-4" />
                Run Cleanup Now
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                Preview and run data retention cleanup for all enabled tables
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={async () => {
                  setIsLoadingPreview(true);
                  setCleanupPreview(null);
                  try {
                    const { data, error } = await supabase.functions.invoke("cleanup-old-records", {
                      body: { dry_run: true }
                    });
                    
                    if (error) throw error;
                    
                    setCleanupPreview(data?.results || []);
                  } catch (error) {
                    console.error("Error fetching preview:", error);
                    toast({
                      title: "Error",
                      description: "Failed to load cleanup preview",
                      variant: "destructive"
                    });
                  } finally {
                    setIsLoadingPreview(false);
                  }
                }}
                disabled={isLoadingPreview || isRunningCleanup}
              >
                {isLoadingPreview ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </>
                )}
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  setTableToCleanup(null);
                  setShowConfirmDialog(true);
                }}
                disabled={isRunningCleanup || isLoadingPreview || cleanupInProgress !== null}
              >
                {isRunningCleanup ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run All Cleanup
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Preview Results */}
          {cleanupPreview && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <h5 className="font-medium text-sm mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Cleanup Preview
              </h5>
              {cleanupPreview.length === 0 ? (
                <p className="text-sm text-muted-foreground">No records to delete based on current retention settings.</p>
              ) : (
                <div className="space-y-2">
                  {cleanupPreview.map((item) => (
                    <div key={item.table} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span>{getTableIcon(item.table)}</span>
                        <span>{formatTableName(item.table)}</span>
                        <span className="text-muted-foreground">
                          (older than {item.retention_days} days)
                        </span>
                      </span>
                      <Badge variant={item.deleted_count > 0 ? "destructive" : "secondary"}>
                        {item.deleted_count} record{item.deleted_count !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  ))}
                  <Separator className="my-2" />
                  <div className="flex items-center justify-between font-medium">
                    <span>Total records to delete</span>
                    <Badge variant="destructive">
                      {cleanupPreview.reduce((sum, r) => sum + r.deleted_count, 0)}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Confirmation Dialog */}
        <AlertDialog open={showConfirmDialog} onOpenChange={(open) => {
          setShowConfirmDialog(open);
          if (!open) setTableToCleanup(null);
        }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Confirm Data Cleanup
              </AlertDialogTitle>
              <AlertDialogDescription>
                {tableToCleanup ? (
                  <>
                    This will permanently delete all records from <strong>{formatTableName(tableToCleanup)}</strong> older than the configured retention period.
                  </>
                ) : (
                  <>
                    This will permanently delete all records older than the configured retention periods from all enabled tables.
                  </>
                )}
                {" "}This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={async () => {
                  const targetTable = tableToCleanup;
                  if (targetTable) {
                    setCleanupInProgress(targetTable);
                  } else {
                    setIsRunningCleanup(true);
                  }
                  setShowConfirmDialog(false);
                  
                  try {
                    const body: Record<string, unknown> = { manual_trigger: true };
                    if (targetTable) {
                      body.table_name = targetTable;
                    }
                    
                    const { data, error } = await supabase.functions.invoke("cleanup-old-records", {
                      body
                    });
                    
                    if (error) throw error;
                    
                    const totalDeleted = data?.total_deleted || 0;
                    const tableName = targetTable ? formatTableName(targetTable) : "all tables";
                    toast({
                      title: "Cleanup Complete",
                      description: `Successfully deleted ${totalDeleted} record${totalDeleted !== 1 ? "s" : ""} from ${tableName}`
                    });
                    
                    // Clear preview after successful cleanup
                    setCleanupPreview(null);
                  } catch (error) {
                    console.error("Error running cleanup:", error);
                    toast({
                      title: "Error",
                      description: "Failed to run cleanup. Please try again.",
                      variant: "destructive"
                    });
                  } finally {
                    setIsRunningCleanup(false);
                    setCleanupInProgress(null);
                    setTableToCleanup(null);
                  }
                }}
              >
                Delete Records
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">About Data Retention</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Cleanup runs daily at 3:00 AM UTC via the <code className="text-xs bg-muted px-1 rounded">cleanup-old-records</code> function</li>
                <li>• Records older than the retention period are permanently deleted</li>
                <li>• Disabled tables will not have their data cleaned up</li>
                <li>• Retention period can be set between 1 and 365 days</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="cleanup-history">
            <CleanupHistoryLog />
          </TabsContent>

          <TabsContent value="audit">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Track all changes to retention policy settings for compliance auditing.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchAuditLog}
                    disabled={isLoadingAudit}
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingAudit ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportAuditLog}
                    disabled={auditLog.length === 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>

              {isLoadingAudit ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 rounded-lg" />
                  ))}
                </div>
              ) : auditLog.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No policy changes recorded yet.</p>
                  <p className="text-sm">Changes will appear here when retention settings are modified.</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Table</TableHead>
                        <TableHead>Field</TableHead>
                        <TableHead>Old Value</TableHead>
                        <TableHead>New Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLog.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="text-sm">
                            {format(new Date(entry.changed_at), "PPp")}
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center gap-2">
                              <span>{getTableIcon(entry.table_name)}</span>
                              <span className="text-sm">{formatTableName(entry.table_name)}</span>
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {entry.field_changed === "retention_days" ? "Retention Days" : "Enabled Status"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {entry.field_changed === "is_enabled" ? (
                              <Badge variant={entry.old_value === "true" ? "default" : "secondary"}>
                                {entry.old_value === "true" ? "Enabled" : "Disabled"}
                              </Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">{entry.old_value} days</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {entry.field_changed === "is_enabled" ? (
                              <Badge variant={entry.new_value === "true" ? "default" : "secondary"}>
                                {entry.new_value === "true" ? "Enabled" : "Disabled"}
                              </Badge>
                            ) : (
                              <span className="text-sm font-medium">{entry.new_value} days</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
