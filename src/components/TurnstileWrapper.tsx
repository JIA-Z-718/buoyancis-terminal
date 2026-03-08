import { forwardRef, useEffect, useState, type ForwardedRef, useCallback } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";

interface TurnstileWrapperProps {
  siteKey: string;
  onSuccess: (token: string) => void;
  onError: () => void;
  onExpire: () => void;
  options?: {
    theme?: "light" | "dark" | "auto";
    size?: "normal" | "compact";
  };
}

const TurnstileWrapper = forwardRef<TurnstileInstance, TurnstileWrapperProps>(
  ({ siteKey, onSuccess, onError, onExpire, options }, ref: ForwardedRef<TurnstileInstance>) => {
    const [scriptReady, setScriptReady] = useState(false);
    const [shouldRender, setShouldRender] = useState(true);

    // Check if Turnstile script is loaded
    const checkScript = useCallback(() => {
      if (window.turnstile && typeof window.turnstile.render === "function") {
        setScriptReady(true);
        return true;
      }
      return false;
    }, []);

    useEffect(() => {
      // Immediately check if script is already loaded
      if (checkScript()) return;

      // Poll for script to be loaded (Turnstile loads async)
      const interval = setInterval(() => {
        if (checkScript()) {
          clearInterval(interval);
        }
      }, 100);

      // Cleanup - mark as should not render to prevent errors
      return () => {
        clearInterval(interval);
        setShouldRender(false);
      };
    }, [checkScript]);

    // Don't render if component is unmounting or script not ready
    if (!shouldRender || !scriptReady) {
      return (
        <div className="h-[65px] w-[300px] bg-muted/20 rounded animate-pulse flex items-center justify-center">
          <span className="text-xs text-muted-foreground">Loading verification...</span>
        </div>
      );
    }

    return (
      <Turnstile
        ref={ref}
        siteKey={siteKey}
        onSuccess={onSuccess}
        onError={onError}
        onExpire={onExpire}
        options={options}
      />
    );
  }
);

TurnstileWrapper.displayName = "TurnstileWrapper";

export default TurnstileWrapper;
