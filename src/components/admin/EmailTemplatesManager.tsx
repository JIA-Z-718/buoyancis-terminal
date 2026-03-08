import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Copy,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  created_at: string;
  updated_at: string;
}

const EmailTemplatesManager = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [deleteTemplate, setDeleteTemplate] = useState<EmailTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formBody, setFormBody] = useState("");

  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast({
        title: "Error",
        description: "Failed to load email templates.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingTemplate(null);
    setFormName("");
    setFormSubject("");
    setFormBody("");
    setIsCreating(true);
  };

  const openEditDialog = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormName(template.name);
    setFormSubject(template.subject);
    setFormBody(template.body);
    setIsCreating(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formSubject.trim() || !formBody.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      if (editingTemplate) {
        // Update existing
        const { error } = await supabase
          .from("email_templates")
          .update({
            name: formName.trim(),
            subject: formSubject.trim(),
            body: formBody.trim(),
          })
          .eq("id", editingTemplate.id);

        if (error) throw error;

        toast({
          title: "Template updated",
          description: `"${formName}" has been updated.`,
        });
      } else {
        // Create new
        const { error } = await supabase.from("email_templates").insert({
          name: formName.trim(),
          subject: formSubject.trim(),
          body: formBody.trim(),
        });

        if (error) throw error;

        toast({
          title: "Template created",
          description: `"${formName}" has been saved.`,
        });
      }

      setIsCreating(false);
      setEditingTemplate(null);
      fetchTemplates();
    } catch (error: any) {
      console.error("Error saving template:", error);
      toast({
        title: "Save failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTemplate) return;

    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from("email_templates")
        .delete()
        .eq("id", deleteTemplate.id);

      if (error) throw error;

      toast({
        title: "Template deleted",
        description: `"${deleteTemplate.name}" has been removed.`,
      });

      setDeleteTemplate(null);
      fetchTemplates();
    } catch (error: any) {
      console.error("Error deleting template:", error);
      toast({
        title: "Delete failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicate = async (template: EmailTemplate) => {
    try {
      const { error } = await supabase.from("email_templates").insert({
        name: `${template.name} (Copy)`,
        subject: template.subject,
        body: template.body,
      });

      if (error) throw error;

      toast({
        title: "Template duplicated",
        description: `A copy of "${template.name}" has been created.`,
      });

      fetchTemplates();
    } catch (error: any) {
      console.error("Error duplicating template:", error);
      toast({
        title: "Duplication failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

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
            <FileText className="h-4 w-4" />
            Email Templates
            {templates.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({templates.length})
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-1" />
              New Template
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
            {templates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>No templates saved yet</p>
                <p className="text-sm mb-4">Create templates to reuse common email content.</p>
                <Button variant="outline" size="sm" onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-1" />
                  Create Your First Template
                </Button>
              </div>
            ) : (
              <div className="grid gap-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-start justify-between p-4 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{template.name}</h4>
                      <p className="text-sm text-muted-foreground truncate mt-0.5">
                        Subject: {template.subject}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Updated {format(new Date(template.updated_at), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDuplicate(template)}
                        title="Duplicate"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(template)}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTemplate(template)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreating} onOpenChange={(open) => !open && setIsCreating(false)}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {editingTemplate ? "Edit Template" : "Create Template"}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate
                ? "Update your email template."
                : "Create a reusable email template for bulk emails."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                placeholder="e.g., Monthly Newsletter"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-subject">Subject Line</Label>
              <Input
                id="template-subject"
                placeholder="e.g., Your monthly update from Buoyancis"
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-body">Email Body</Label>
              <Textarea
                id="template-body"
                placeholder="Write your email content here..."
                value={formBody}
                onChange={(e) => setFormBody(e.target.value)}
                rows={8}
                disabled={isSaving}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Use blank lines to separate paragraphs.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreating(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !formName.trim() || !formSubject.trim() || !formBody.trim()}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingTemplate ? (
                "Save Changes"
              ) : (
                "Create Template"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTemplate} onOpenChange={(open) => !open && setDeleteTemplate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteTemplate?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EmailTemplatesManager;
