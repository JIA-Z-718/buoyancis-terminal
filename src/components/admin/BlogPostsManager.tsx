import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Plus, Pencil, Trash2, Eye, EyeOff, ExternalLink, Clock, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "@/hooks/use-toast";
import BlogPostEditor from "./BlogPostEditor";

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
  created_at: string;
  updated_at: string;
}

const BlogPostsManager = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchPosts = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error fetching posts",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setPosts(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleTogglePublish = async (post: BlogPost) => {
    const newPublishedState = !post.is_published;
    const { error } = await supabase
      .from("blog_posts")
      .update({
        is_published: newPublishedState,
        published_at: newPublishedState ? new Date().toISOString() : null,
      })
      .eq("id", post.id);

    if (error) {
      toast({
        title: "Error updating post",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: newPublishedState ? "Post published" : "Post unpublished",
        description: `"${post.title}" has been ${newPublishedState ? "published" : "unpublished"}.`,
      });
      fetchPosts();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error deleting post",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Post deleted",
        description: "The blog post has been permanently deleted.",
      });
      fetchPosts();
    }
    setDeleteConfirmId(null);
  };

  const handleSaveComplete = () => {
    setEditingPost(null);
    setIsCreating(false);
    fetchPosts();
  };

  if (isCreating || editingPost) {
    return (
      <BlogPostEditor
        post={editingPost}
        onSave={handleSaveComplete}
        onCancel={() => {
          setEditingPost(null);
          setIsCreating(false);
        }}
      />
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Blog Posts</CardTitle>
          <CardDescription>Create and manage blog articles</CardDescription>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Post
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No blog posts yet</p>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create your first post
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{post.title}</p>
                      <p className="text-xs text-muted-foreground">/blog/{post.slug}</p>
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          <Tag className="h-3 w-3 text-muted-foreground" />
                          {post.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs py-0">
                              {tag}
                            </Badge>
                          ))}
                          {post.tags.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{post.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{post.author_name}</p>
                      {post.author_role && (
                        <p className="text-xs text-muted-foreground">{post.author_role}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {post.is_published ? (
                      <Badge variant="default">Published</Badge>
                    ) : post.scheduled_publish_at ? (
                      <Badge variant="outline" className="gap-1">
                        <Clock className="w-3 h-3" />
                        Scheduled
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Draft</Badge>
                    )}
                    {post.scheduled_publish_at && !post.is_published && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(post.scheduled_publish_at), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(post.updated_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      {post.is_published && (
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          title="View post"
                        >
                          <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleTogglePublish(post)}
                        title={post.is_published ? "Unpublish" : "Publish"}
                      >
                        {post.is_published ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingPost(post)}
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirmId(post.id)}
                        title="Delete"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete blog post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The post will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default BlogPostsManager;
