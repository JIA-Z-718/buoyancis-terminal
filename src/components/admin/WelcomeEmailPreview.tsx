import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Eye, EyeOff } from "lucide-react";

// Brand colors (matching edge function)
const BRAND = {
  olive: "#5a6f3c",
  oliveLight: "#e8ecd9",
  oliveMuted: "#8fa06f",
  foreground: "#2d2f27",
  muted: "#6b6d64",
  background: "#fcfcfa",
  border: "#e0e2d8",
};

const LOGO_URL = "https://i.imgur.com/nTpVGYt.png";

const WelcomeEmailPreview = () => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Welcome Email Preview
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(!isVisible)}
            className="text-muted-foreground"
          >
            {isVisible ? (
              <>
                <EyeOff className="h-4 w-4 mr-1" />
                Hide
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-1" />
                Show
              </>
            )}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          This email is automatically sent to new early access signups
        </p>
      </CardHeader>
      
      {isVisible && (
        <CardContent>
          <div 
            className="rounded-xl border overflow-hidden"
            style={{ backgroundColor: BRAND.background }}
          >
            {/* Email Header Bar */}
            <div className="border-b px-4 py-3 bg-muted/30">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <span className="font-medium text-foreground">From:</span>
                <span>Buoyancis &lt;onboarding@resend.dev&gt;</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <span className="font-medium text-foreground">To:</span>
                <span>subscriber@example.com</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Subject:</span>
                <span>Welcome to Buoyancis</span>
              </div>
            </div>

            {/* Email Body */}
            <div style={{ maxWidth: 560, margin: "0 auto", padding: "48px 24px" }}>
              {/* Logo */}
              <img 
                src={LOGO_URL} 
                alt="Buoyancis" 
                style={{ height: 40, marginBottom: 32 }} 
              />
              
              {/* Main Content */}
              <h1 
                style={{ 
                  fontFamily: "Georgia, serif", 
                  fontSize: 28, 
                  fontWeight: 400, 
                  color: BRAND.foreground, 
                  margin: "0 0 24px 0", 
                  lineHeight: 1.3 
                }}
              >
                You're on the list
              </h1>
              
              <p 
                style={{ 
                  fontSize: 16, 
                  color: BRAND.muted, 
                  lineHeight: 1.7, 
                  margin: "0 0 20px 0" 
                }}
              >
                Thank you for your interest in Buoyancis — a theory of structure in motion. We're exploring how trust, order, and systems persist or decay over time.
              </p>
              
              {/* What's Next Card */}
              <div 
                style={{ 
                  background: BRAND.oliveLight, 
                  padding: 24, 
                  borderRadius: 12, 
                  margin: "32px 0", 
                  border: `1px solid ${BRAND.border}` 
                }}
              >
                <p 
                  style={{ 
                    margin: "0 0 16px 0", 
                    fontSize: 15, 
                    color: BRAND.foreground, 
                    fontWeight: 500 
                  }}
                >
                  What happens next?
                </p>
                <ul 
                  style={{ 
                    margin: 0, 
                    paddingLeft: 20, 
                    color: BRAND.muted, 
                    fontSize: 15, 
                    lineHeight: 1.8 
                  }}
                >
                  <li style={{ marginBottom: 6 }}>We'll share updates as the work unfolds</li>
                  <li style={{ marginBottom: 6 }}>You'll be among the first to engage with the ideas</li>
                  <li>We may reach out for your perspective</li>
                </ul>
              </div>
              
              <p 
                style={{ 
                  fontSize: 16, 
                  color: BRAND.muted, 
                  lineHeight: 1.7, 
                  margin: "0 0 32px 0" 
                }}
              >
                Feel free to reply to this email if you have questions or thoughts to share. We read every response.
              </p>
              
              <p 
                style={{ 
                  fontSize: 16, 
                  color: BRAND.muted, 
                  lineHeight: 1.7, 
                  margin: 0 
                }}
              >
                Warm regards,<br />
                <span style={{ color: BRAND.foreground }}>The Buoyancis Team</span>
              </p>
              
              {/* Footer */}
              <hr 
                style={{ 
                  border: "none", 
                  borderTop: `1px solid ${BRAND.border}`, 
                  margin: "40px 0 24px 0" 
                }} 
              />
              <p 
                style={{ 
                  fontSize: 12, 
                  color: BRAND.oliveMuted, 
                  margin: 0 
                }}
              >
                You received this email because you signed up at Buoyancis.
              </p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default WelcomeEmailPreview;
