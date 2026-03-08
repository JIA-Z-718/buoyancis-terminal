import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import { supabase } from "@/integrations/supabase/client";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  author_name: string;
  author_role: string | null;
  published_at: string | null;
  cover_image_url: string | null;
}

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, slug, title, excerpt, author_name, author_role, published_at, cover_image_url")
        .eq("is_published", true)
        .order("published_at", { ascending: false });

      if (!error && data) {
        setPosts(data);
      }
      setIsLoading(false);
    };

    fetchPosts();
  }, []);

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="pt-24 pb-16">
          <div className="container-narrow">
            {/* Header */}
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-serif text-foreground mb-4">
                Insights
              </h1>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Thoughts on trust, credibility, and building systems that reward signal over noise.
              </p>
            </div>

            {/* Posts grid */}
            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-48 bg-muted rounded-xl mb-4" />
                    <div className="h-4 bg-muted rounded w-1/4 mb-3" />
                    <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-full" />
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground">No posts yet. Check back soon.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((post, index) => (
                  <Link
                    key={post.id}
                    to={`/blog/${post.slug}`}
                    className="group block"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <article className="h-full flex flex-col">
                      {/* Cover image placeholder */}
                      <div className="aspect-[16/10] rounded-xl bg-gradient-to-br from-olive-light/30 to-sage/20 mb-4 overflow-hidden">
                        {post.cover_image_url ? (
                          <img
                            src={post.cover_image_url}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-4xl font-serif text-primary/40">
                              {post.title.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Meta */}
                      <div className="text-xs text-muted-foreground mb-2">
                        {post.published_at && format(new Date(post.published_at), "MMM d, yyyy")}
                        {post.author_name && ` · ${post.author_name}`}
                      </div>

                      {/* Title */}
                      <h2 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-2 flex-grow">
                        {post.title}
                      </h2>

                      {/* Excerpt */}
                      {post.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {post.excerpt}
                        </p>
                      )}

                      {/* Read more */}
                      <div className="flex items-center gap-1 text-sm text-primary font-medium">
                        Read more
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </PageTransition>
  );
};

export default Blog;
