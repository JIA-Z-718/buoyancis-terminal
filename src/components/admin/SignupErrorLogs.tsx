import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { ChevronDown, ChevronUp, RefreshCw, Trash2, AlertTriangle, Bug } from "lucide-react";
import { format } from "date-fns";

interface SignupErrorLog {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  error_code: string | null;
  error_message: string | null;
  error_details: string | null;
  user_agent: string | null;
  created_at: string;
}

const SignupErrorLogs = () => {
  const [logs, setLogs] = useState<SignupErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-signup-error-logs", {
        body: { action: "list", limit: 100, offset: 0 },
      });

      if (error) {
        throw error;
      }

      setLogs((data?.data || []) as SignupErrorLog[]);
    } catch (error: any) {
      console.error("Error fetching error logs:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch error logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.functions.invoke("admin-signup-error-logs", {
        body: { action: "delete", id },
      });

      if (error) {
        throw error;
      }

      setLogs(logs.filter((log) => log.id !== id));
      toast({
        title: "Deleted",
        description: "Error log deleted successfully.",
      });
    } catch (error: any) {
      console.error("Error deleting log:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete log",
        variant: "destructive",
      });
    }
  };

  const handleClearAll = async () => {
    try {
      const { error } = await supabase.functions.invoke("admin-signup-error-logs", {
        body: { action: "clear_all" },
      });

      if (error) {
        throw error;
      }

      setLogs([]);
      toast({
        title: "Cleared",
        description: "All error logs cleared successfully.",
      });
    } catch (error: any) {
      console.error("Error clearing logs:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to clear logs",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  const getErrorBadge = (code: string | null) => {
    if (!code) return <Badge variant="secondary">Unknown</Badge>;
    if (code === "PGRST301" || code === "42501") {
      return <Badge variant="destructive">RLS Error</Badge>;
    }
    if (code.startsWith("22") || code.startsWith("23")) {
      return <Badge variant="outline" className="border-amber-500 text-amber-600">Constraint</Badge>;
    }
    return <Badge variant="secondary">{code}</Badge>;
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bug className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle className="text-lg">Signup Error Logs</CardTitle>
                  <CardDescription>
                    Debug failed early access signups
                  </CardDescription>
                </div>
                {logs.length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {logs.length}
                  </Badge>
                )}
              </div>
              {isOpen ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchLogs}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              {logs.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear all error logs?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all {logs.length} error logs.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClearAll}>
                        Clear All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>

            {logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No signup errors logged.</p>
                <p className="text-sm">That's a good thing!</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Error</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <>
                        <TableRow
                          key={log.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                        >
                          <TableCell className="font-mono text-xs">
                            {format(new Date(log.created_at), "MMM d, HH:mm:ss")}
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate">
                            {log.email || "-"}
                          </TableCell>
                          <TableCell>
                            {[log.first_name, log.last_name].filter(Boolean).join(" ") || "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getErrorBadge(log.error_code)}
                              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {log.error_message}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(log.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        {expandedLog === log.id && (
                          <TableRow key={`${log.id}-details`}>
                            <TableCell colSpan={5} className="bg-muted/30">
                              <div className="p-4 space-y-3 text-sm">
                                <div>
                                  <span className="font-medium">Error Message:</span>
                                  <p className="text-muted-foreground mt-1">
                                    {log.error_message || "No message"}
                                  </p>
                                </div>
                                {log.error_details && (
                                  <div>
                                    <span className="font-medium">Details:</span>
                                    <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                                      {log.error_details}
                                    </pre>
                                  </div>
                                )}
                                {log.user_agent && (
                                  <div>
                                    <span className="font-medium">User Agent:</span>
                                    <p className="text-xs text-muted-foreground mt-1 break-all">
                                      {log.user_agent}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default SignupErrorLogs;