import { useState, useRef } from "react";
import { format } from "date-fns";
import { ArrowLeft, Save, Calendar, Clock, X, Plus, Upload, ImageIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import RichTextEditor from "./RichTextEditor";
import "./RichTextEditorStyles.css";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  author_name: string;
  author_role: string | null;
  is_published: boolean;
  published_at: string | null;
  scheduled_publish_at: string | null;
  tags: string[] | null;
  cover_image_url: string | null;
}

interface BlogPostEditorProps {
  post: BlogPost | null;
  onSave: () => void;
  onCancel: () => void;
}

const BlogPostEditor = ({ post, onSave, onCancel }: BlogPostEditorProps) => {
  const [formData, setFormData] = useState({
    title: post?.title || "",
    slug: post?.slug || "",
    excerpt: post?.excerpt || "",
    content: post?.content || "",
    author_name: post?.author_name || "Buoyancis Team",
    author_role: post?.author_role || "",
    is_published: post?.is_published || false,
  });
  const [tags, setTags] = useState<string[]>(post?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(post?.cover_image_url || null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(
    post?.scheduled_publish_at ? new Date(post.scheduled_publish_at) : undefined
  );
  const [scheduledTime, setScheduledTime] = useState(
    post?.scheduled_publish_at 
      ? format(new Date(post.scheduled_publish_at), "HH:mm") 
      : "09:00"
  );
  const [useScheduledPublish, setUseScheduledPublish] = useState(!!post?.scheduled_publish_at);
  const [isSaving, setIsSaving] = useState(false);

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImage(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `covers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("blog-images")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("blog-images")
        .getPublicUrl(filePath);

      setCoverImageUrl(publicUrl);
      toast({
        title: "Image uploaded",
        description: "Cover image has been uploaded successfully.",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveCoverImage = () => {
    setCoverImageUrl(null);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
    }));
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for the post.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.slug.trim()) {
      toast({
        title: "Slug required",
        description: "Please enter a URL slug for the post.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.content.trim()) {
      toast({
        title: "Content required",
        description: "Please add some content to the post.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    // Calculate scheduled_publish_at if enabled
    let scheduledPublishAt: string | null = null;
    if (useScheduledPublish && scheduledDate && !formData.is_published) {
      const [hours, minutes] = scheduledTime.split(":").map(Number);
      const scheduledDateTime = new Date(scheduledDate);
      scheduledDateTime.setHours(hours, minutes, 0, 0);
      scheduledPublishAt = scheduledDateTime.toISOString();
    }

    const postData = {
      title: formData.title.trim(),
      slug: formData.slug.trim(),
      excerpt: formData.excerpt.trim() || null,
      content: formData.content,
      author_name: formData.author_name.trim() || "Buoyancis Team",
      author_role: formData.author_role.trim() || null,
      is_published: formData.is_published,
      published_at: formData.is_published && !post?.published_at
        ? new Date().toISOString()
        : post?.published_at || null,
      scheduled_publish_at: scheduledPublishAt,
      tags: tags.length > 0 ? tags : [],
      cover_image_url: coverImageUrl,
    };

    let error;
    if (post) {
      ({ error } = await supabase
        .from("blog_posts")
        .update(postData)
        .eq("id", post.id));
    } else {
      ({ error } = await supabase.from("blog_posts").insert(postData));
    }

    setIsSaving(false);

    if (error) {
      toast({
        title: "Error saving post",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: post ? "Post updated" : "Post created",
        description: `"${formData.title}" has been saved.`,
      });
      onSave();
    }
  };


  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <CardTitle>{post ? "Edit Post" : "New Post"}</CardTitle>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="publish"
              checked={formData.is_published}
              onCheckedChange={(checked) => {
                setFormData((prev) => ({ ...prev, is_published: checked }));
                if (checked) {
                  setUseScheduledPublish(false);
                }
              }}
            />
            <Label htmlFor="publish" className="text-sm">
              {formData.is_published ? "Published" : "Draft"}
            </Label>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cover Image */}
        <div className="space-y-2">
          <Label>Cover Image</Label>
          {coverImageUrl ? (
            <div className="relative group">
              <img
                src={coverImageUrl}
                alt="Cover preview"
                className="w-full h-48 object-cover rounded-lg border"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Replace
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveCoverImage}
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingImage}
              className="w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
            >
              {isUploadingImage ? (
                <>
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <ImageIcon className="h-8 w-8" />
                  <span>Click to upload cover image</span>
                  <span className="text-xs">PNG, JPG, WEBP up to 5MB</span>
                </>
              )}
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* Title and Slug */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Post title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">/blog/</span>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, slug: e.target.value }))
                }
                placeholder="post-url-slug"
              />
            </div>
          </div>
        </div>

        {/* Author info */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="author">Author Name</Label>
            <Input
              id="author"
              value={formData.author_name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, author_name: e.target.value }))
              }
              placeholder="Author name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Author Role (optional)</Label>
            <Input
              id="role"
              value={formData.author_role}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, author_role: e.target.value }))
              }
              placeholder="e.g., Founder, Editor"
            />
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="Add a tag..."
              className="flex-1"
            />
            <Button type="button" variant="outline" size="icon" onClick={handleAddTag}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Press Enter or click + to add tags. Tags help organize and filter posts.
          </p>
        </div>

        {/* Excerpt */}
        <div className="space-y-2">
          <Label htmlFor="excerpt">Excerpt (optional)</Label>
          <Textarea
            id="excerpt"
            value={formData.excerpt}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, excerpt: e.target.value }))
            }
            placeholder="Brief summary for the blog listing page"
            rows={2}
          />
        </div>

        {/* Scheduled Publishing */}
        {!formData.is_published && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="schedule" className="text-base font-medium">Schedule Publishing</Label>
                <p className="text-sm text-muted-foreground">
                  Set a future date and time to automatically publish this post
                </p>
              </div>
              <Switch
                id="schedule"
                checked={useScheduledPublish}
                onCheckedChange={setUseScheduledPublish}
              />
            </div>
            
            {useScheduledPublish && (
              <div className="grid md:grid-cols-2 gap-4">
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
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {scheduledDate ? format(scheduledDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={scheduledDate}
                        onSelect={setScheduledDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="time"
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            )}
            
            {useScheduledPublish && scheduledDate && (
              <p className="text-sm text-muted-foreground">
                This post will be automatically published on{" "}
                <span className="font-medium text-foreground">
                  {format(scheduledDate, "MMMM d, yyyy")} at {scheduledTime}
                </span>
              </p>
            )}
          </div>
        )}

        {/* Content with rich text editor */}
        <div className="space-y-2">
          <Label>Content</Label>
          <RichTextEditor
            content={formData.content}
            onChange={(content) =>
              setFormData((prev) => ({ ...prev, content }))
            }
            placeholder="Write your post content here..."
          />
          <p className="text-xs text-muted-foreground">
            Use the toolbar to format text, add headings, lists, links, and images.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default BlogPostEditor;
