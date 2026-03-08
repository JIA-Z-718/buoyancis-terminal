import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import DOMPurify from "dompurify";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import { supabase } from "@/integrations/supabase/client";

interface BlogPostData {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string | null;
  author_name: string;
  author_role: string | null;
  published_at: string | null;
  cover_image_url: string | null;
}

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPostData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setPost(data);
      }
      setIsLoading(false);
    };

    fetchPost();
  }, [slug]);

  // Sanitize and render HTML content
  const renderContent = (content: string) => {
    // Check if content is HTML (starts with a tag) or plain text
    const isHtml = content.trim().startsWith("<") || content.includes("</");
    
    if (isHtml) {
      // Sanitize HTML to prevent XSS attacks
      const sanitizedContent = DOMPurify.sanitize(content, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre', 'hr', 'span', 'div'],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'target', 'rel', 'title', 'width', 'height'],
        ALLOW_DATA_ATTR: false,
      });
      
      return (
        <div 
          className="prose-blog"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }} 
        />
      );
    }

    // Fallback to basic markdown-style rendering for legacy content
    const lines = content.split("\n");
    const elements: JSX.Element[] = [];
    let listItems: string[] = [];
    let inList = false;

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
            {listItems.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        );
        listItems = [];
        inList = false;
      }
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      if (trimmed.startsWith("# ")) {
        flushList();
        elements.push(
          <h1 key={index} className="text-3xl md:text-4xl font-serif text-foreground mb-6 mt-8 first:mt-0">
            {trimmed.slice(2)}
          </h1>
        );
      } else if (trimmed.startsWith("## ")) {
        flushList();
        elements.push(
          <h2 key={index} className="text-2xl font-serif text-foreground mb-4 mt-8">
            {trimmed.slice(3)}
          </h2>
        );
      } else if (trimmed.startsWith("### ")) {
        flushList();
        elements.push(
          <h3 key={index} className="text-xl font-semibold text-foreground mb-3 mt-6">
            {trimmed.slice(4)}
          </h3>
        );
      } else if (trimmed.startsWith("- ") || trimmed.match(/^\d+\.\s/)) {
        inList = true;
        const itemText = trimmed.replace(/^[-\d.]+\s*/, "");
        listItems.push(itemText);
      } else if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
        flushList();
        elements.push(
          <p key={index} className="font-semibold text-foreground mb-2">
            {trimmed.slice(2, -2)}
          </p>
        );
      } else if (trimmed.length > 0) {
        flushList();
        const parts = trimmed.split(/(\*\*[^*]+\*\*)/g);
        elements.push(
          <p key={index} className="text-muted-foreground leading-relaxed mb-4">
            {parts.map((part, i) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return <strong key={i} className="text-foreground">{part.slice(2, -2)}</strong>;
              }
              return part;
            })}
          </p>
        );
      } else {
        flushList();
      }
    });

    flushList();
    return <>{elements}</>;
  };

  if (isLoading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background">
          <Header />
          <main className="pt-24 pb-16">
            <div className="container-narrow max-w-3xl">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-24 mb-8" />
                <div className="h-10 bg-muted rounded w-3/4 mb-4" />
                <div className="h-4 bg-muted rounded w-1/3 mb-8" />
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </PageTransition>
    );
  }

  if (notFound || !post) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background">
          <Header />
          <main className="pt-24 pb-16">
            <div className="container-narrow text-center py-16">
              <h1 className="text-2xl font-serif text-foreground mb-4">Post not found</h1>
              <p className="text-muted-foreground mb-6">
                The article you're looking for doesn't exist or has been removed.
              </p>
              <Link to="/blog" className="text-primary hover:underline">
                ← Back to all posts
              </Link>
            </div>
          </main>
          <Footer />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="pt-24 pb-16">
          <article className="container-narrow max-w-3xl">
            {/* Back link */}
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              All posts
            </Link>

            {/* Header */}
            <header className="mb-10">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif text-foreground mb-4">
                {post.title}
              </h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-olive-light to-sage flex items-center justify-center text-primary font-medium">
                  {post.author_name.charAt(0)}
                </div>
                <div>
                  <p className="text-foreground font-medium">{post.author_name}</p>
                  <p>
                    {post.author_role}
                    {post.published_at && ` · ${format(new Date(post.published_at), "MMMM d, yyyy")}`}
                  </p>
                </div>
              </div>
            </header>

            {/* Content */}
            <div className="prose-custom">
              {renderContent(post.content)}
            </div>

            {/* Footer */}
            <footer className="mt-16 pt-8 border-t border-border">
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to all posts
              </Link>
            </footer>
          </article>
        </main>
        <Footer />
      </div>
    </PageTransition>
  );
};

export default BlogPost;
