import { Button } from "@/components/ui/button";
import { FlaskConical } from "lucide-react";
import { isDevelopment } from "@/hooks/useMFATestMode";

interface MFATestModeToggleProps {
  isTestMode: boolean;
  onEnable: () => void;
}

export default function MFATestModeToggle({ isTestMode, onEnable }: MFATestModeToggleProps) {
  // Only show in development mode and when not already in test mode
  if (!isDevelopment || isTestMode) {
    return null;
  }

  return (
    <div className="mt-4 pt-4 border-t border-dashed border-muted">
      <Button
        variant="outline"
        size="sm"
        onClick={onEnable}
        className="w-full border-purple-500/50 text-purple-600 hover:bg-purple-500/10 hover:text-purple-700"
      >
        <FlaskConical className="mr-2 h-4 w-4" />
        Enable Test Mode (Development Only)
      </Button>
      <p className="text-xs text-muted-foreground text-center mt-2">
        Simulates MFA enrollment without a real authenticator app
      </p>
    </div>
  );
}
