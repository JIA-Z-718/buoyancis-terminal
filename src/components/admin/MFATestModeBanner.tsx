import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FlaskConical, X } from "lucide-react";

interface MFATestModeBannerProps {
  onDisable: () => void;
  testCode: string;
}

export default function MFATestModeBanner({ onDisable, testCode }: MFATestModeBannerProps) {
  return (
    <Alert className="border-purple-500/50 bg-purple-500/10 mb-4">
      <FlaskConical className="h-4 w-4 text-purple-600" />
      <AlertTitle className="text-purple-700 dark:text-purple-400 flex items-center justify-between">
        <span>MFA Test Mode Active</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDisable}
          className="h-6 px-2 text-purple-600 hover:text-purple-800 hover:bg-purple-500/20"
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertTitle>
      <AlertDescription className="text-purple-600 dark:text-purple-300">
        This is a simulated MFA flow for development. Use verification code{" "}
        <code className="bg-purple-500/20 px-1.5 py-0.5 rounded font-mono font-bold">
          {testCode}
        </code>{" "}
        to complete enrollment or verification.
      </AlertDescription>
    </Alert>
  );
}
