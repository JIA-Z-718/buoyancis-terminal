import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  MailX,
  Search,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  UserPlus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Unsubscribe {
  id: string;
  email: string;
  unsubscribed_at: string;
  reason: string | null;
}

const UnsubscribesManager = () => {
  const [unsubscribes, setUnsubscribes] = useState<Unsubscribe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [resubscribeEmail, setResubscribeEmail] = useState<Unsubscribe | null>(null);
  const [isResubscribing, setIsResubscribing] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    fetchUnsubscribes();
  }, []);

  const fetchUnsubscribes = async () => {
    try {
      const { data, error } = await supabase
        .from("email_unsubscribes")
        .select("*")
        .order("unsubscribed_at", { ascending: false });

      if (error) throw error;
      setUnsubscribes(data || []);
    } catch (error) {
      console.error("Error fetching unsubscribes:", error);
      toast({
        title: "Error",
        description: "Failed to load unsubscribed emails.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResubscribe = async () => {
    if (!resubscribeEmail) return;

    setIsResubscribing(true);

    try {
      const { error } = await supabase
        .from("email_unsubscribes")
        .delete()
        .eq("id", resubscribeEmail.id);

      if (error) throw error;

      toast({
        title: "Resubscribed",
        description: `${resubscribeEmail.email} can now receive emails again.`,
      });

      setResubscribeEmail(null);
      fetchUnsubscribes();
    } catch (error: any) {
      console.error("Error resubscribing:", error);
      toast({
        title: "Resubscribe failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResubscribing(false);
    }
  };

  const filteredUnsubscribes = unsubscribes.filter((u) =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
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
            <MailX className="h-4 w-4" />
            Unsubscribed Emails
            {unsubscribes.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {unsubscribes.length}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchUnsubscribes}
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
            {unsubscribes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MailX className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>No unsubscribed emails</p>
                <p className="text-sm">
                  Users who unsubscribe will appear here.
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
                        <TableHead>Unsubscribed</TableHead>
                        <TableHead className="w-[100px]">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUnsubscribes.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className="text-center text-muted-foreground py-8"
                          >
                            No matching emails found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUnsubscribes.map((unsub) => (
                          <TableRow key={unsub.id}>
                            <TableCell className="font-medium">
                              {unsub.email}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {format(
                                new Date(unsub.unsubscribed_at),
                                "MMM d, yyyy 'at' h:mm a"
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setResubscribeEmail(unsub)}
                                className="text-primary hover:text-primary"
                              >
                                <UserPlus className="h-4 w-4 mr-1" />
                                Resubscribe
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                <p className="text-xs text-muted-foreground mt-3">
                  Resubscribing will allow the user to receive emails again.
                  They can unsubscribe again at any time.
                </p>
              </>
            )}
          </CardContent>
        )}
      </Card>

      {/* Resubscribe Confirmation */}
      <AlertDialog
        open={!!resubscribeEmail}
        onOpenChange={(open) => !open && setResubscribeEmail(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resubscribe User?</AlertDialogTitle>
            <AlertDialogDescription>
              This will allow <strong>{resubscribeEmail?.email}</strong> to
              receive emails again. They can unsubscribe again at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResubscribing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResubscribe}
              disabled={isResubscribing}
            >
              {isResubscribing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Resubscribing...
                </>
              ) : (
                "Resubscribe"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UnsubscribesManager;
