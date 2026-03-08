import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Loader2, ArrowLeft, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type UnsubscribeStatus = "pending" | "confirming" | "success" | "already" | "error" | "invalid";

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<UnsubscribeStatus>("pending");
  const [email, setEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const encodedEmail = searchParams.get("e");
    const confirmed = searchParams.get("confirm") === "true";

    if (!encodedEmail) {
      setStatus("invalid");
      return;
    }

    try {
      const decodedEmail = atob(encodedEmail);
      setEmail(decodedEmail);
      
      if (confirmed) {
        handleUnsubscribe(decodedEmail);
      } else {
        setStatus("confirming");
      }
    } catch {
      setStatus("invalid");
    }
  }, [searchParams]);

  const handleUnsubscribe = async (emailToUnsubscribe: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("email_unsubscribes")
        .insert({ email: emailToUnsubscribe.toLowerCase() });

      if (error) {
        if (error.code === "23505") {
          setStatus("already");
        } else {
          console.error("Unsubscribe error:", error);
          setStatus("error");
        }
      } else {
        setStatus("success");
      }
    } catch (err) {
      console.error("Unsubscribe error:", err);
      setStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (email) {
      handleUnsubscribe(email);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-serif">
            {status === "pending" && "處理中..."}
            {status === "confirming" && "取消訂閱"}
            {status === "success" && "已取消訂閱"}
            {status === "already" && "已取消訂閱"}
            {status === "error" && "發生錯誤"}
            {status === "invalid" && "無效連結"}
          </CardTitle>
          <CardDescription className="text-base">
            {status === "confirming" && (
              <>
                確定要取消 <span className="font-medium text-foreground">{email}</span> 的每日熵減訂閱嗎？
              </>
            )}
            {status === "success" && (
              <>
                <span className="font-medium text-foreground">{email}</span> 已成功取消訂閱，您將不再收到每日熵減郵件。
              </>
            )}
            {status === "already" && (
              <>
                <span className="font-medium text-foreground">{email}</span> 已經取消訂閱。
              </>
            )}
            {status === "error" && "處理您的請求時發生錯誤，請稍後再試。"}
            {status === "invalid" && "此取消訂閱連結無效或已過期。"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {status === "pending" && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {status === "confirming" && (
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleConfirm}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    處理中...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    確認取消訂閱
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                asChild
                className="w-full"
              >
                <Link to="/">
                  <X className="w-4 h-4 mr-2" />
                  取消
                </Link>
              </Button>
            </div>
          )}

          {(status === "success" || status === "already") && (
            <div className="flex flex-col gap-3">
              <div className="flex justify-center py-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Check className="w-8 h-8 text-primary" />
                </div>
              </div>
              <Button variant="outline" asChild className="w-full">
                <Link to="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  返回首頁
                </Link>
              </Button>
            </div>
          )}

          {(status === "error" || status === "invalid") && (
            <div className="flex flex-col gap-3">
              <div className="flex justify-center py-4">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                  <X className="w-8 h-8 text-destructive" />
                </div>
              </div>
              <Button variant="outline" asChild className="w-full">
                <Link to="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  返回首頁
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Unsubscribe;
