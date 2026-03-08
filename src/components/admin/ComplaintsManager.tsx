import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ShieldAlert,
  Search,
  Loader2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Complaint {
  id: string;
  email: string;
  complaint_type: string;
  feedback_id: string | null;
  complained_at: string;
}

const ComplaintsManager = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [removeEmail, setRemoveEmail] = useState<Complaint | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const { data, error } = await supabase
        .from("email_complaints")
        .select("*")
        .order("complained_at", { ascending: false });

      if (error) throw error;
      setComplaints(data || []);
    } catch (error) {
      console.error("Error fetching complaints:", error);
      toast({
        title: "Error",
        description: "Failed to load spam complaints.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!removeEmail) return;

    setIsRemoving(true);

    try {
      const { error } = await supabase
        .from("email_complaints")
        .delete()
        .eq("id", removeEmail.id);

      if (error) throw error;

      toast({
        title: "Complaint removed",
        description: `${removeEmail.email} can now receive emails again.`,
      });

      setRemoveEmail(null);
      fetchComplaints();
    } catch (error: any) {
      console.error("Error removing complaint:", error);
      toast({
        title: "Removal failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRemoving(false);
    }
  };

  const filteredComplaints = complaints.filter((c) =>
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <Card className="mb-6">
        <div className="px-6 py-4">
          <Skeleton className="h-6 w-48" />
        </div>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="mb-6">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <ShieldAlert className="h-4 w-4" />
            Spam Complaints
            {complaints.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {complaints.length}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchComplaints}
              className="text-muted-foreground"
            >
              <RefreshCw className="h-4 w-4" />
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

        {isVisible && (
          <CardContent className="pt-4">
            {complaints.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShieldAlert className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>No spam complaints</p>
                <p className="text-sm">
                  Recipients who mark emails as spam will appear here.
                </p>
              </div>
            ) : (
              <>
                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search emails..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Table */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="w-[100px]">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredComplaints.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center text-muted-foreground py-8"
                          >
                            No matching emails found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredComplaints.map((complaint) => (
                          <TableRow key={complaint.id}>
                            <TableCell className="font-medium">
                              {complaint.email}
                            </TableCell>
                            <TableCell>
                              <Badge variant="destructive">
                                {complaint.complaint_type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {format(
                                new Date(complaint.complained_at),
                                "MMM d, yyyy"
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setRemoveEmail(complaint)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Remove
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                <p className="text-xs text-muted-foreground mt-3">
                  Spam complaints are automatically excluded from future sends.
                  Removing allows retry but is not recommended.
                </p>
              </>
            )}
          </CardContent>
        )}
      </Card>

      {/* Remove Confirmation */}
      <AlertDialog
        open={!!removeEmail}
        onOpenChange={(open) => !open && setRemoveEmail(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Spam Complaint?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>{removeEmail?.email}</strong> from the
              complaint list. Sending to users who marked you as spam is not
              recommended and may hurt deliverability.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove Complaint"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ComplaintsManager;
