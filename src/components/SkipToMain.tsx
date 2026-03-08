import { cn } from "@/lib/utils";

interface SkipToMainProps {
  mainId?: string;
  className?: string;
}

export default function SkipToMain({ mainId = "main-content", className }: SkipToMainProps) {
  return (
    <a
      href={`#${mainId}`}
      className={cn(
        "fixed top-0 left-0 z-[100] px-4 py-2 m-2 rounded-md",
        "bg-primary text-primary-foreground font-medium text-sm",
        "transform -translate-y-full focus:translate-y-0",
        "transition-transform duration-200 ease-in-out",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "sr-only focus:not-sr-only",
        className
      )}
    >
      Skip to main content
    </a>
  );
}
