import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Loader2 } from "lucide-react";

interface AlertResolutionDialogProps {
  alertId: string;
  alertType: string;
  metricValue: number;
  onResolved?: () => void;
}

const RESOLUTION_TEMPLATES: Record<string, string> = {
  bounce_rate_warning: "Cleaned email list by removing invalid addresses. Verified sender reputation.",
  bounce_rate_critical: "Performed full email list audit. Removed hard bounces. Implemented double opt-in for new signups.",
  complaint_rate_warning: "Reviewed email content and frequency. Updated unsubscribe link visibility.",
  complaint_rate_critical: "Paused email campaigns. Conducted content review. Implemented preference center.",
  unsubscribe_rate_warning: "Adjusted email frequency. Improved content relevance and segmentation.",
};

const AlertResolutionDialog = ({
  alertId,
  alertType,
  metricValue,
  onResolved,
}: AlertResolutionDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleResolve = async () => {
    if (!notes.trim()) {
      toast({
        title: "Notes required",
        description: "Please describe what actions were taken to resolve this alert.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("deliverability_alerts")
        .update({
          resolved_at: new Date().toISOString(),
          resolution_notes: notes.trim(),
          resolved_by: user?.id,
        })
        .eq("id", alertId);

      if (error) throw error;

      toast({
        title: "Alert resolved",
        description: "The alert has been marked as resolved.",
      });

      setIsOpen(false);
      setNotes("");
      onResolved?.();
    } catch (error: any) {
      console.error("Error resolving alert:", error);
      toast({
        title: "Failed to resolve alert",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyTemplate = () => {
    const template = RESOLUTION_TEMPLATES[alertType];
    if (template) {
      setNotes(template);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <CheckCircle className="h-3.5 w-3.5" />
          Resolve
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Resolve Alert</DialogTitle>
          <DialogDescription>
            Document the actions taken to resolve this alert. This helps track
            remediation efforts and provides context for future reference.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-3 rounded-lg bg-muted/50 text-sm">
            <p className="text-muted-foreground">Current metric value:</p>
            <p className="font-mono font-bold text-lg">
              {Number(metricValue).toFixed(2)}%
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="resolution-notes">Resolution Notes</Label>
              {RESOLUTION_TEMPLATES[alertType] && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={applyTemplate}
                  className="text-xs h-7"
                >
                  Use template
                </Button>
              )}
            </div>
            <Textarea
              id="resolution-notes"
              placeholder="Describe the actions taken to resolve this alert..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Be specific about what changes were made and their expected impact.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleResolve} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Resolving...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Resolved
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AlertResolutionDialog;
