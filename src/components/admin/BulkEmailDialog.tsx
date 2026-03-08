import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, Mail, AlertCircle, Clock, CalendarIcon, FlaskConical, Plus, X, FileText, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, setHours, setMinutes, isBefore, addMinutes } from "date-fns";
import { cn } from "@/lib/utils";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

interface BulkEmailDialogProps {
  emails: string[];
  disabled?: boolean;
}

interface ABVariant {
  name: string;
  subject: string;
}

const BulkEmailDialog = ({ emails, disabled }: BulkEmailDialogProps) => {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [scheduledHour, setScheduledHour] = useState("09");
  const [scheduledMinute, setScheduledMinute] = useState("00");
  
  // A/B Testing state
  const [abTestEnabled, setAbTestEnabled] = useState(false);
  const [variants, setVariants] = useState<ABVariant[]>([
    { name: "A", subject: "" },
    { name: "B", subject: "" },
  ]);

  // Template state
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  
  const { toast } = useToast();

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
  const minutes = ["00", "15", "30", "45"];

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);

  const fetchTemplates = async () => {
    const { data } = await supabase
      .from("email_templates")
      .select("id, name, subject, body")
      .order("name", { ascending: true });
    setTemplates(data || []);
  };

  const loadTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setBody(template.body);
      setSelectedTemplateId(templateId);
      if (abTestEnabled) {
        setVariants((prev) =>
          prev.map((v, i) => (i === 0 ? { ...v, subject: template.subject } : v))
        );
      }
      toast({
        title: "Template loaded",
        description: `"${template.name}" has been applied.`,
      });
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!newTemplateName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for the template.",
        variant: "destructive",
      });
      return;
    }

    const effectiveSubject = abTestEnabled ? variants[0]?.subject : subject;
    if (!effectiveSubject?.trim() || !body.trim()) {
      toast({
        title: "Missing content",
        description: "Please fill in subject and body before saving.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingTemplate(true);

    try {
      const { error } = await supabase.from("email_templates").insert({
        name: newTemplateName.trim(),
        subject: effectiveSubject.trim(),
        body: body.trim(),
      });

      if (error) throw error;

      toast({
        title: "Template saved",
        description: `"${newTemplateName}" has been created.`,
      });

      setNewTemplateName("");
      setShowSaveTemplate(false);
      fetchTemplates();
    } catch (error: any) {
      console.error("Error saving template:", error);
      toast({
        title: "Save failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const getScheduledDateTime = () => {
    if (!scheduledDate) return null;
    return setMinutes(setHours(scheduledDate, parseInt(scheduledHour)), parseInt(scheduledMinute));
  };

  const isValidScheduledTime = () => {
    const scheduledFor = getScheduledDateTime();
    if (!scheduledFor) return false;
    return !isBefore(scheduledFor, addMinutes(new Date(), 5));
  };

  const updateVariantSubject = (index: number, newSubject: string) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, subject: newSubject } : v))
    );
  };

  const addVariant = () => {
    if (variants.length >= 4) return;
    const nextName = String.fromCharCode(65 + variants.length); // A, B, C, D
    setVariants((prev) => [...prev, { name: nextName, subject: "" }]);
  };

  const removeVariant = (index: number) => {
    if (variants.length <= 2) return;
    setVariants((prev) => {
      const newVariants = prev.filter((_, i) => i !== index);
      // Rename variants to keep sequential
      return newVariants.map((v, i) => ({
        ...v,
        name: String.fromCharCode(65 + i),
      }));
    });
  };

  const areVariantsValid = () => {
    if (!abTestEnabled) return true;
    return variants.every((v) => v.subject.trim().length > 0);
  };

  const getEffectiveSubject = () => {
    if (abTestEnabled) {
      return variants[0]?.subject || "";
    }
    return subject;
  };

  const handleSend = async () => {
    const effectiveSubject = abTestEnabled ? variants[0]?.subject : subject;
    
    if (!effectiveSubject?.trim() || !body.trim()) {
      toast({
        title: "Missing content",
        description: "Please provide both a subject and message body.",
        variant: "destructive",
      });
      return;
    }

    if (abTestEnabled && !areVariantsValid()) {
      toast({
        title: "Incomplete A/B test",
        description: "Please provide subject lines for all variants.",
        variant: "destructive",
      });
      return;
    }

    if (isScheduled) {
      if (!scheduledDate || !isValidScheduledTime()) {
        toast({
          title: "Invalid schedule time",
          description: "Please select a date and time at least 5 minutes in the future.",
          variant: "destructive",
        });
        return;
      }

      // Note: Scheduled emails with A/B testing would need additional implementation
      // For now, scheduled emails use the primary subject only
      setIsSending(true);

      try {
        const scheduledFor = getScheduledDateTime();
        const { error } = await supabase.from("scheduled_emails").insert({
          emails,
          subject: effectiveSubject.trim(),
          body: body.trim(),
          scheduled_for: scheduledFor!.toISOString(),
        });

        if (error) throw error;

        toast({
          title: "Email scheduled",
          description: `Email will be sent to ${emails.length} subscriber${emails.length !== 1 ? "s" : ""} on ${format(scheduledFor!, "PPP 'at' p")}.${abTestEnabled ? " Note: A/B testing is not yet supported for scheduled emails." : ""}`,
        });

        resetForm();
      } catch (error: any) {
        console.error("Error scheduling email:", error);
        toast({
          title: "Failed to schedule email",
          description: error.message || "Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsSending(false);
      }
      return;
    }

    setIsSending(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-bulk-email", {
        body: {
          emails,
          subject: effectiveSubject.trim(),
          body: body.trim(),
          abTestEnabled,
          variants: abTestEnabled ? variants.map((v) => ({ name: v.name, subject: v.subject.trim() })) : undefined,
        },
      });

      if (error) throw error;

      const abMessage = data.abTest 
        ? ` A/B test with ${data.variants?.length || 2} variants.` 
        : "";

      toast({
        title: "Emails sent",
        description: `Successfully sent to ${data.sent} recipient${data.sent !== 1 ? "s" : ""}${data.failed > 0 ? `. ${data.failed} failed.` : "."}${abMessage}`,
      });

      resetForm();
    } catch (error: any) {
      console.error("Error sending bulk email:", error);
      toast({
        title: "Failed to send emails",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const resetForm = () => {
    setSubject("");
    setBody("");
    setIsScheduled(false);
    setScheduledDate(undefined);
    setScheduledHour("09");
    setScheduledMinute("00");
    setAbTestEnabled(false);
    setVariants([
      { name: "A", subject: "" },
      { name: "B", subject: "" },
    ]);
    setOpen(false);
  };

  const recipientsPerVariant = abTestEnabled 
    ? Math.floor(emails.length / variants.length) 
    : emails.length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || emails.length === 0}>
          <Mail className="w-4 h-4 mr-1" />
          Send Email
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Send Bulk Email
          </DialogTitle>
          <DialogDescription>
            Compose an email to send to all {emails.length} early access subscriber{emails.length !== 1 ? "s" : ""}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Template Selector */}
          {templates.length > 0 && (
            <div className="space-y-2">
              <Label>Load Template</Label>
              <div className="flex gap-2">
                <Select value={selectedTemplateId} onValueChange={loadTemplate}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Choose a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        <div className="flex items-center gap-2">
                          <FileText className="h-3 w-3" />
                          {t.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Warning for large sends */}
          {emails.length > 100 && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <p className="text-sm">
                Sending to {emails.length} recipients may take a few minutes. Please don't close this window until complete.
              </p>
            </div>
          )}

          {/* A/B Test Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/30">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="ab-test-toggle" className="font-medium">A/B Test Subject Lines</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Test different subject lines to see which performs best
              </p>
            </div>
            <Switch
              id="ab-test-toggle"
              checked={abTestEnabled}
              onCheckedChange={setAbTestEnabled}
              disabled={isSending}
            />
          </div>

          {/* Subject Line(s) */}
          {abTestEnabled ? (
            <div className="space-y-3 rounded-lg border p-4 bg-muted/20">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Subject Line Variants</Label>
                <p className="text-xs text-muted-foreground">
                  ~{recipientsPerVariant} recipients each
                </p>
              </div>
              
              {variants.map((variant, index) => (
                <div key={variant.name} className="flex items-center gap-2">
                  <Badge variant="outline" className="shrink-0 w-8 justify-center">
                    {variant.name}
                  </Badge>
                  <Input
                    placeholder={`Subject for variant ${variant.name}`}
                    value={variant.subject}
                    onChange={(e) => updateVariantSubject(index, e.target.value)}
                    disabled={isSending}
                    className="flex-1"
                  />
                  {variants.length > 2 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => removeVariant(index)}
                      disabled={isSending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              {variants.length < 4 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addVariant}
                  disabled={isSending}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Variant {String.fromCharCode(65 + variants.length)}
                </Button>
              )}

              <p className="text-xs text-muted-foreground">
                Recipients will be evenly split between variants. View results in Campaign Analytics.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="e.g., Exciting news from Buoyancis"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={isSending}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              placeholder="Write your message here. Use blank lines to separate paragraphs."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              disabled={isSending}
              className="resize-none"
            />
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Merge tags:</span>
              <Badge 
                variant="secondary" 
                className="cursor-pointer font-mono text-xs"
                onClick={() => setBody(prev => prev + "{{first_name}}")}
              >
                {"{{first_name}}"}
              </Badge>
              <Badge 
                variant="secondary" 
                className="cursor-pointer font-mono text-xs"
                onClick={() => setBody(prev => prev + "{{name}}")}
              >
                {"{{name}}"}
              </Badge>
              <Badge 
                variant="secondary" 
                className="cursor-pointer font-mono text-xs"
                onClick={() => setBody(prev => prev + "{{email}}")}
              >
                {"{{email}}"}
              </Badge>
              <span className="text-muted-foreground/70">— Click to insert</span>
            </div>
          </div>

          {/* Schedule Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/30">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="schedule-toggle" className="font-medium">Schedule for later</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Send this email at a specific date and time
              </p>
            </div>
            <Switch
              id="schedule-toggle"
              checked={isScheduled}
              onCheckedChange={setIsScheduled}
              disabled={isSending}
            />
          </div>

          {/* Schedule Date/Time Picker */}
          {isScheduled && (
            <div className="space-y-3 rounded-lg border p-4 bg-muted/20">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !scheduledDate && "text-muted-foreground"
                      )}
                      disabled={isSending}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {scheduledDate ? format(scheduledDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={scheduledDate}
                      onSelect={setScheduledDate}
                      disabled={(date) => isBefore(date, new Date(new Date().setHours(0, 0, 0, 0)))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Hour</Label>
                  <Select value={scheduledHour} onValueChange={setScheduledHour} disabled={isSending}>
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
                  <Select value={scheduledMinute} onValueChange={setScheduledMinute} disabled={isSending}>
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

              {scheduledDate && (
                <p className="text-sm text-muted-foreground">
                  Scheduled for: {format(getScheduledDateTime()!, "PPP 'at' p")}
                </p>
              )}
            </div>
          )}

          {/* Save as Template */}
          {(body.trim() && (abTestEnabled ? variants[0]?.subject?.trim() : subject.trim())) && (
            <div className="rounded-lg border p-4 bg-muted/20">
              {showSaveTemplate ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4 text-muted-foreground" />
                    <Label className="font-medium">Save as Template</Label>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Template name..."
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      disabled={isSavingTemplate}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={handleSaveAsTemplate}
                      disabled={isSavingTemplate || !newTemplateName.trim()}
                    >
                      {isSavingTemplate ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Save"
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setShowSaveTemplate(false);
                        setNewTemplateName("");
                      }}
                      disabled={isSavingTemplate}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                  onClick={() => setShowSaveTemplate(true)}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save as Template
                </Button>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSending}>
            Cancel
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={
              isSending || 
              !body.trim() || 
              (abTestEnabled ? !areVariantsValid() : !subject.trim()) ||
              (isScheduled && (!scheduledDate || !isValidScheduledTime()))
            }
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isScheduled ? "Scheduling..." : "Sending..."}
              </>
            ) : isScheduled ? (
              <>
                <Clock className="w-4 h-4 mr-2" />
                Schedule for {emails.length} subscriber{emails.length !== 1 ? "s" : ""}
              </>
            ) : abTestEnabled ? (
              <>
                <FlaskConical className="w-4 h-4 mr-2" />
                Send A/B Test to {emails.length}
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send to {emails.length} subscriber{emails.length !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkEmailDialog;
