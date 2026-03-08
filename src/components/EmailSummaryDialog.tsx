import { useState } from "react";
import { Mail, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ValidationSummary {
  totalEntries: number;
  successCount: number;
  failedCount: number;
  totalErrors: number;
  topErrors: Array<{
    path: string;
    message: string;
    count: number;
  }>;
  generatedAt: string;
}

interface EmailSummaryDialogProps {
  summary: ValidationSummary;
  disabled?: boolean;
  children?: React.ReactNode;
}

export default function EmailSummaryDialog({ 
  summary, 
  disabled = false,
  children 
}: EmailSummaryDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-validation-summary", {
        body: {
          recipientEmail: email,
          summary,
        },
      });

      if (error) throw error;

      toast({
        title: "Summary Sent",
        description: `Validation summary emailed to ${email}`,
      });
      setOpen(false);
      setEmail("");
    } catch (error: any) {
      console.error("Failed to send summary:", error);
      toast({
        title: "Failed to Send",
        description: error.message || "Could not send the email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild disabled={disabled}>
        {children || (
          <Button variant="ghost" size="sm" className="text-muted-foreground" disabled={disabled}>
            <Mail className="h-4 w-4 mr-1" />
            Email Summary
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Email Validation Summary</DialogTitle>
          <DialogDescription>
            Send a shortened summary report instead of the full JSON export.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Validations:</span>
              <span className="font-medium">{summary.totalEntries}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Passed:</span>
              <span className="font-medium text-green-600">{summary.successCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Failed:</span>
              <span className="font-medium text-destructive">{summary.failedCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Errors:</span>
              <span className="font-medium">{summary.totalErrors}</span>
            </div>
            {summary.topErrors.length > 0 && (
              <div className="pt-2 border-t">
                <span className="text-muted-foreground text-xs">Top {summary.topErrors.length} error types included</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Recipient Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="recipient@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isSending || !email}>
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Summary
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
