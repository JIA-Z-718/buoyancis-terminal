import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Download, Mail, FileSpreadsheet } from "lucide-react";

interface ExportEarlyAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signupCount: number;
}

export default function ExportEarlyAccessDialog({
  open,
  onOpenChange,
  signupCount,
}: ExportEarlyAccessDialogProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [includeUnsubscribed, setIncludeUnsubscribed] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
        setRecipientEmail(user.email);
      }
    };
    if (open) {
      fetchUserEmail();
    }
  }, [open]);

  const handleExport = async () => {
    if (!recipientEmail) {
      toast.error("Please enter a recipient email");
      return;
    }

    setIsExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("export-early-access", {
        body: {
          recipientEmail,
          includeUnsubscribed,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success(`Export sent to ${recipientEmail}`, {
        description: `${data.recordCount} records exported. Check your email for the download link.`,
      });
      
      onOpenChange(false);
    } catch (error: any) {
      console.error("Export error:", error);
      toast.error("Failed to export", {
        description: error.message || "An unexpected error occurred",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSendToMyself = () => {
    if (userEmail) {
      setRecipientEmail(userEmail);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Export Early Access Signups
          </DialogTitle>
          <DialogDescription>
            Generate a secure CSV export and receive it via email with a time-limited download link.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Stats */}
          <div className="bg-muted/50 rounded-lg p-4 border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total signups</span>
              <span className="font-semibold">{signupCount}</span>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="include-unsubscribed"
                checked={includeUnsubscribed}
                onCheckedChange={(checked) => setIncludeUnsubscribed(checked === true)}
              />
              <div className="space-y-1">
                <Label 
                  htmlFor="include-unsubscribed" 
                  className="text-sm font-medium cursor-pointer"
                >
                  Include unsubscribed users
                </Label>
                <p className="text-xs text-muted-foreground">
                  By default, only active subscribers are exported
                </p>
              </div>
            </div>
          </div>

          {/* Email input */}
          <div className="space-y-2">
            <Label htmlFor="recipient-email">Send export to</Label>
            <div className="flex gap-2">
              <Input
                id="recipient-email"
                type="email"
                placeholder="Enter email address..."
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="flex-1"
              />
              {userEmail && recipientEmail !== userEmail && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSendToMyself}
                  className="whitespace-nowrap"
                >
                  <Mail className="h-3.5 w-3.5 mr-1" />
                  Send to myself
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              The download link will expire in 24 hours
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || !recipientEmail}
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export & Send
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
