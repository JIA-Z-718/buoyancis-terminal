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
  AlertTriangle,
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

interface Bounce {
  id: string;
  email: string;
  bounce_type: string;
  reason: string | null;
  bounced_at: string;
}

const BouncesManager = () => {
  const [bounces, setBounces] = useState<Bounce[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [removeEmail, setRemoveEmail] = useState<Bounce | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    fetchBounces();
  }, []);

  const fetchBounces = async () => {
    try {
      const { data, error } = await supabase
        .from("email_bounces")
        .select("*")
        .order("bounced_at", { ascending: false });

      if (error) throw error;
      setBounces(data || []);
    } catch (error) {
      console.error("Error fetching bounces:", error);
      toast({
        title: "Error",
        description: "Failed to load bounced emails.",
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
        .from("email_bounces")
        .delete()
        .eq("id", removeEmail.id);

      if (error) throw error;

      toast({
        title: "Bounce removed",
        description: `${removeEmail.email} can now receive emails again.`,
      });

      setRemoveEmail(null);
      fetchBounces();
    } catch (error: any) {
      console.error("Error removing bounce:", error);
      toast({
        title: "Removal failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRemoving(false);
    }
  };

  const getBounceTypeBadge = (type: string) => {
    if (type === "hard") {
      return <Badge variant="destructive">Hard</Badge>;
    }
    return <Badge variant="secondary">Soft</Badge>;
  };

  const filteredBounces = bounces.filter((b) =>
    b.email.toLowerCase().includes(searchQuery.toLowerCase())
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
            <AlertTriangle className="h-4 w-4" />
            Bounced Emails
            {bounces.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {bounces.length}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchBounces}
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
            {bounces.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>No bounced emails</p>
                <p className="text-sm">
                  Emails that bounce will appear here automatically.
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
                        <TableHead>Reason</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="w-[100px]">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBounces.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center text-muted-foreground py-8"
                          >
                            No matching emails found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredBounces.map((bounce) => (
                          <TableRow key={bounce.id}>
                            <TableCell className="font-medium">
                              {bounce.email}
                            </TableCell>
                            <TableCell>
                              {getBounceTypeBadge(bounce.bounce_type)}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                              {bounce.reason || "—"}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {format(
                                new Date(bounce.bounced_at),
                                "MMM d, yyyy"
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setRemoveEmail(bounce)}
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
                  Bounced emails are automatically excluded from future sends.
                  Remove a bounce to retry sending to that address.
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
            <AlertDialogTitle>Remove Bounce?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>{removeEmail?.email}</strong> from the
              bounce list, allowing future emails to be sent. Only do this if
              the email address issue has been resolved.
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
                "Remove Bounce"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BouncesManager;
