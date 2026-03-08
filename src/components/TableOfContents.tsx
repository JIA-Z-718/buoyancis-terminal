import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

export interface TocItem {
  id: string;
  title: string;
  level: number;
}

interface TableOfContentsProps {
  items: TocItem[];
  className?: string;
}

export default function TableOfContents({ items, className }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");

  const handleScroll = useCallback(() => {
    const scrollPosition = window.scrollY + 120; // Offset for header

    // Find the section that is currently in view
    let currentId = "";
    for (const item of items) {
      const element = document.getElementById(item.id);
      if (element) {
        const { top } = element.getBoundingClientRect();
        const absoluteTop = top + window.scrollY;
        
        if (absoluteTop <= scrollPosition) {
          currentId = item.id;
        }
      }
    }
    
    setActiveId(currentId);
  }, [items]);

  useEffect(() => {
    handleScroll(); // Initial check
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: "smooth"
      });
    }
  };

  if (items.length === 0) return null;

  return (
    <nav 
      className={cn(
        "hidden lg:block sticky top-24 h-fit max-h-[calc(100vh-8rem)] overflow-y-auto",
        "w-56 shrink-0 pr-4",
        className
      )}
      aria-label="Table of contents"
    >
      <div className="pb-2 mb-3 border-b border-border/60">
        <h4 className="text-sm font-medium text-foreground">On this page</h4>
      </div>
      
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => scrollToSection(item.id)}
              className={cn(
                "block w-full text-left text-sm py-1.5 px-2 rounded-md transition-colors duration-200",
                "hover:bg-muted/50 hover:text-foreground",
                item.level === 2 && "pl-2",
                item.level === 3 && "pl-4 text-xs",
                activeId === item.id
                  ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                  : "text-muted-foreground"
              )}
            >
              {item.title}
            </button>
          </li>
        ))}
      </ul>
      
      {/* Scroll progress indicator */}
      <div className="mt-6 pt-4 border-t border-border/60">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          ↑ Back to top
        </button>
      </div>
    </nav>
  );
}
