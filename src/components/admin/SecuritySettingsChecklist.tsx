import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface SecuritySetting {
  id: string;
  label: string;
  description: string;
  status: "enabled" | "disabled" | "manual";
  helpText?: string;
}

const securitySettings: SecuritySetting[] = [
  {
    id: "leaked-password",
    label: "Leaked Password Protection (HIBP)",
    description: "Checks passwords against known data breaches",
    status: "manual",
    helpText: "This setting must be enabled manually in the backend Auth settings → Password protection",
  },
  {
    id: "email-confirm",
    label: "Email Confirmation Required",
    description: "Users must verify email before sign-in",
    status: "enabled",
    helpText: "Enabled by default - prevents unverified account access",
  },
  {
    id: "mfa-available",
    label: "MFA/Passkey Support",
    description: "Multi-factor authentication is available",
    status: "enabled",
    helpText: "TOTP and Passkey authentication are configured",
  },
];

export default function SecuritySettingsChecklist() {
  const [isExpanded, setIsExpanded] = useState(true);

  const getStatusIcon = (status: SecuritySetting["status"]) => {
    switch (status) {
      case "enabled":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "disabled":
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case "manual":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    }
  };

  const getStatusBadge = (status: SecuritySetting["status"]) => {
    switch (status) {
      case "enabled":
        return (
          <Badge variant="outline" className="text-xs text-green-600 border-green-200 bg-green-50">
            Enabled
          </Badge>
        );
      case "disabled":
        return (
          <Badge variant="destructive" className="text-xs">
            Disabled
          </Badge>
        );
      case "manual":
        return (
          <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 border-amber-200">
            Manual Check Required
          </Badge>
        );
    }
  };

  const manualCheckCount = securitySettings.filter(s => s.status === "manual").length;

  return (
    <Card>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base font-medium">
                Security Settings Checklist
              </CardTitle>
              {manualCheckCount > 0 && (
                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">
                  {manualCheckCount} action needed
                </Badge>
              )}
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-3 pt-0">
            {securitySettings.map((setting) => (
              <div
                key={setting.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border",
                  setting.status === "manual" && "border-amber-200 bg-amber-50/50",
                  setting.status === "enabled" && "border-green-200/50 bg-green-50/30",
                  setting.status === "disabled" && "border-destructive/30 bg-destructive/5"
                )}
              >
                <div className="mt-0.5">
                  {getStatusIcon(setting.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{setting.label}</span>
                    {getStatusBadge(setting.status)}
                    {setting.helpText && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>{setting.helpText}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {setting.description}
                  </p>
                </div>
              </div>
            ))}

            {/* Action Button */}
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-2">
                Some security settings require manual configuration in the backend.
                Navigate to <strong>Cloud → Auth → Settings → Password protection</strong> to enable leaked password checks.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  // Open backend button will be shown in the UI - user can click Cloud tab
                  window.dispatchEvent(new CustomEvent('open-backend-settings'));
                }}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View Auth Settings Guide
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
