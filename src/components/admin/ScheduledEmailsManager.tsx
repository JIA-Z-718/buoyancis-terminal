import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Clock,
  CalendarIcon,
  Pencil,
  Trash2,
  Loader2,
  Mail,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, setHours, setMinutes, isBefore, addMinutes } from "date-fns";
import { cn } from "@/lib/utils";

interface ScheduledEmail {
  id: string;
  emails: string[];
  subject: string;
  body: string;
  scheduled_for: string;
  status: string;
  created_at: string;
  sent_at: string | null;
  error_message: string | null;
}

const ScheduledEmailsManager = () => {
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [editingEmail, setEditingEmail] = useState<ScheduledEmail | null>(null);
  const [deleteEmail, setDeleteEmail] = useState<ScheduledEmail | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Edit form state
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editDate, setEditDate] = useState<Date | undefined>(undefined);
  const [editHour, setEditHour] = useState("09");
  const [editMinute, setEditMinute] = useState("00");
  
  const { toast } = useToast();
  
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
  const minutes = ["00", "15", "30", "45"];

  useEffect(() => {
    fetchScheduledEmails();
  }, []);

  const fetchScheduledEmails = async () => {
    try {
      const { data, error } = await supabase
        .from("scheduled_emails")
        .select("*")
        .order("scheduled_for", { ascending: true });

      if (error) throw error;
      setScheduledEmails(data || []);
    } catch (error) {
      console.error("Error fetching scheduled emails:", error);
      toast({
        title: "Error",
        description: "Failed to load scheduled emails.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getEditScheduledDateTime = () => {
    if (!editDate) return null;
    return setMinutes(setHours(editDate, parseInt(editHour)), parseInt(editMinute));
  };

  const isValidEditTime = () => {
    const scheduledFor = getEditScheduledDateTime();
    if (!scheduledFor) return false;
    return !isBefore(scheduledFor, addMinutes(new Date(), 5));
  };

  const openEditDialog = (email: ScheduledEmail) => {
    const scheduledDate = new Date(email.scheduled_for);
    setEditingEmail(email);
    setEditSubject(email.subject);
    setEditBody(email.body);
    setEditDate(scheduledDate);
    setEditHour(scheduledDate.getHours().toString().padStart(2, "0"));
    setEditMinute((Math.floor(scheduledDate.getMinutes() / 15) * 15).toString().padStart(2, "0"));
  };

  const handleUpdate = async () => {
    if (!editingEmail || !editSubject.trim() || !editBody.trim() || !isValidEditTime()) return;

    setIsUpdating(true);

    try {
      const scheduledFor = getEditScheduledDateTime();
      const { error } = await supabase
        .from("scheduled_emails")
        .update({
          subject: editSubject.trim(),
          body: editBody.trim(),
          scheduled_for: scheduledFor!.toISOString(),
        })
        .eq("id", editingEmail.id);

      if (error) throw error;

      toast({
        title: "Email updated",
        description: "Scheduled email has been updated successfully.",
      });

      setEditingEmail(null);
      fetchScheduledEmails();
    } catch (error: any) {
      console.error("Error updating scheduled email:", error);
      toast({
        title: "Update failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteEmail) return;

    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from("scheduled_emails")
        .delete()
        .eq("id", deleteEmail.id);

      if (error) throw error;

      toast({
        title: "Email cancelled",
        description: "Scheduled email has been cancelled and removed.",
      });

      setDeleteEmail(null);
      fetchScheduledEmails();
    } catch (error: any) {
      console.error("Error deleting scheduled email:", error);
      toast({
        title: "Deletion failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Processing
          </Badge>
        );
      case "sent":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Sent
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const pendingEmails = scheduledEmails.filter((e) => e.status === "pending");
  const completedEmails = scheduledEmails.filter((e) => e.status !== "pending");

  return (
    <>
      <Card>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Clock className="h-4 w-4" />
            Scheduled Emails
            {pendingEmails.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingEmails.length} pending
              </Badge>
            )}
          </CardTitle>
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

        {isVisible && (
          <CardContent className="pt-4">
            {scheduledEmails.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>No scheduled emails</p>
                <p className="text-sm">Use the "Send Email" button to schedule one.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Pending Emails */}
                {pendingEmails.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Upcoming</h4>
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            <TableHead>Subject</TableHead>
                            <TableHead>Recipients</TableHead>
                            <TableHead>Scheduled For</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pendingEmails.map((email) => (
                            <TableRow key={email.id}>
                              <TableCell className="font-medium max-w-[200px] truncate">
                                {email.subject}
                              </TableCell>
                              <TableCell>{email.emails.length}</TableCell>
                              <TableCell>
                                {format(new Date(email.scheduled_for), "MMM d, yyyy 'at' h:mm a")}
                              </TableCell>
                              <TableCell>{getStatusBadge(email.status)}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => openEditDialog(email)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => setDeleteEmail(email)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {/* Completed/Failed Emails */}
                {completedEmails.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">History</h4>
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            <TableHead>Subject</TableHead>
                            <TableHead>Recipients</TableHead>
                            <TableHead>Scheduled For</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {completedEmails.slice(0, 5).map((email) => (
                            <TableRow key={email.id} className="opacity-70">
                              <TableCell className="font-medium max-w-[200px] truncate">
                                {email.subject}
                              </TableCell>
                              <TableCell>{email.emails.length}</TableCell>
                              <TableCell>
                                {format(new Date(email.scheduled_for), "MMM d, yyyy 'at' h:mm a")}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {getStatusBadge(email.status)}
                                  {email.error_message && (
                                    <span
                                      className="text-xs text-red-600 truncate max-w-[100px]"
                                      title={email.error_message}
                                    >
                                      {email.error_message}
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => setDeleteEmail(email)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingEmail} onOpenChange={(open) => !open && setEditingEmail(null)}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5" />
              Edit Scheduled Email
            </DialogTitle>
            <DialogDescription>
              Update the content or reschedule this email.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-subject">Subject</Label>
              <Input
                id="edit-subject"
                value={editSubject}
                onChange={(e) => setEditSubject(e.target.value)}
                disabled={isUpdating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-body">Message</Label>
              <Textarea
                id="edit-body"
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                rows={6}
                disabled={isUpdating}
                className="resize-none"
              />
            </div>

            <div className="space-y-3 rounded-lg border p-4 bg-muted/20">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !editDate && "text-muted-foreground"
                      )}
                      disabled={isUpdating}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editDate ? format(editDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={editDate}
                      onSelect={setEditDate}
                      disabled={(date) => isBefore(date, new Date(new Date().setHours(0, 0, 0, 0)))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Hour</Label>
                  <Select value={editHour} onValueChange={setEditHour} disabled={isUpdating}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {hours.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Minute</Label>
                  <Select value={editMinute} onValueChange={setEditMinute} disabled={isUpdating}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {minutes.map((m) => (
                        <SelectItem key={m} value={m}>
                          :{m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {editDate && (
                <p className="text-sm text-muted-foreground">
                  New schedule: {format(getEditScheduledDateTime()!, "PPP 'at' p")}
                </p>
              )}
            </div>

            {editingEmail && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>Will be sent to {editingEmail.emails.length} recipient{editingEmail.emails.length !== 1 ? "s" : ""}</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingEmail(null)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={isUpdating || !editSubject.trim() || !editBody.trim() || !editDate || !isValidEditTime()}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteEmail} onOpenChange={(open) => !open && setDeleteEmail(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Cancel Scheduled Email?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently cancel and remove the scheduled email "{deleteEmail?.subject}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Cancel Email"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ScheduledEmailsManager;
