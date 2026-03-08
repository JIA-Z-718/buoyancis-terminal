import { useEffect } from "react";

/**
 * Hook to intercept Ctrl+P and trigger a custom print preview action
 * instead of the browser's default print dialog.
 */
export function usePrintPreviewShortcut(onPrintPreview: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Intercept Ctrl+P (or Cmd+P on Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        onPrintPreview();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onPrintPreview]);
}
