import { useState } from "react";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import CookiePreferencesModal from "./CookiePreferencesModal";

export default function FloatingCookieButton() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowModal(true)}
              className="fixed bottom-4 left-4 z-40 h-10 w-10 rounded-full shadow-lg border-border/60 bg-card hover:bg-muted transition-all hover:scale-105 print:hidden"
              aria-label="Cookie preferences"
            >
              <Cookie className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Cookie preferences</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <CookiePreferencesModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
