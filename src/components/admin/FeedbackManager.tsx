import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useNewItemHighlight } from "@/hooks/useNewItemHighlight";
import { useHighlightSettings } from "@/hooks/useHighlightSettings";
import { MessageSquare, Trash2, RefreshCw, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Feedback {
  id: string;
  feedback_type: string;
  message: string;
  email: string | null;
  created_at: string;
}

const feedbackTypeBadgeVariant = (type: string) => {
  switch (type) {
    case "feature":
      return "default";
    case "issue":
      return "destructive";
    default:
      return "secondary";
  }
};

export default function FeedbackManager() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Track new feedback for highlight animation with configurable duration
  const { settings: highlightSettings } = useHighlightSettings();
  const { isHighlighted } = useNewItemHighlight(feedback, {
    highlightDuration: highlightSettings.feedback,
  });

  const fetchFeedback = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("user_feedback")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error loading feedback",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setFeedback(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchFeedback();

    // Subscribe to real-time updates for user_feedback
    const channel = supabase
      .channel('user-feedback-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_feedback',
        },
        (payload) => {
          // Add new feedback to the top of the list
          setFeedback((prev) => [payload.new as Feedback, ...prev]);
          toast({
            title: "New feedback received",
            description: "A user just submitted new feedback.",
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'user_feedback',
        },
        (payload) => {
          // Remove deleted feedback from the list
          setFeedback((prev) => prev.filter((f) => f.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const { error } = await supabase
      .from("user_feedback")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error deleting feedback",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setFeedback((prev) => prev.filter((f) => f.id !== id));
      toast({
        title: "Feedback deleted",
        description: "The feedback has been removed.",
      });
    }
    setDeletingId(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            User Feedback
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            User Feedback
            {feedback.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {feedback.length}
              </Badge>
            )}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={fetchFeedback}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {feedback.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No feedback received yet.</p>
            <p className="text-sm mt-1">
              User feedback from the landing page will appear here.
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Type</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead className="w-[180px]">Email</TableHead>
                  <TableHead className="w-[140px]">Date</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedback.map((item) => (
                  <TableRow 
                    key={item.id}
                    className={cn(
                      isHighlighted(item.id) && "animate-highlight-new"
                    )}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={feedbackTypeBadgeVariant(item.feedback_type)}>
                          {item.feedback_type}
                        </Badge>
                        {isHighlighted(item.id) && (
                          <Badge variant="default" className="animate-fade-in text-[10px] px-1.5 py-0 h-4">
                            New
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="line-clamp-2 text-sm">{item.message}</p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.email || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(item.created_at), "MMM d, yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={deletingId === item.id}
                          >
                            {deletingId === item.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete feedback?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete this feedback entry.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(item.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
