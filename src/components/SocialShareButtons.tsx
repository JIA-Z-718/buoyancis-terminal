import { Twitter, Linkedin, MessageCircle, Send, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SocialShareButtonsProps {
  url?: string;
  title?: string;
  description?: string;
  className?: string;
}

export default function SocialShareButtons({
  url,
  title = "Compliance & Security Report",
  description = "View our comprehensive compliance and security documentation.",
  className = "",
}: SocialShareButtonsProps) {
  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  
  const handleTwitterShare = () => {
    const text = encodeURIComponent(`${title}\n\n${description}`);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, "_blank", "width=550,height=420,noopener,noreferrer");
  };

  const handleLinkedInShare = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(linkedInUrl, "_blank", "width=550,height=420,noopener,noreferrer");
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`${title}\n${description}\n${shareUrl}`);
    const whatsappUrl = `https://wa.me/?text=${text}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const handleTelegramShare = () => {
    const text = encodeURIComponent(`${title}\n${description}`);
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${text}`;
    window.open(telegramUrl, "_blank", "noopener,noreferrer");
  };

  const handleLineShare = () => {
    const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`;
    window.open(lineUrl, "_blank", "width=550,height=420,noopener,noreferrer");
  };

  const handleWeChatShare = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert("連結已複製！請在微信中分享此連結。\nLink copied! Share this link in WeChat.");
    });
  };

  const [copied, setCopied] = useState(false);
  
  const handleCopyText = () => {
    const plainText = `${title}\n\n${description}\n\n${shareUrl}`;
    navigator.clipboard.writeText(plainText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={handleTwitterShare}
              className="hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2] hover:border-[#1DA1F2]/30"
            >
              <Twitter className="w-4 h-4" />
              <span className="sr-only">Share on X (Twitter)</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Share on X (Twitter)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={handleLinkedInShare}
              className="hover:bg-[#0A66C2]/10 hover:text-[#0A66C2] hover:border-[#0A66C2]/30"
            >
              <Linkedin className="w-4 h-4" />
              <span className="sr-only">Share on LinkedIn</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Share on LinkedIn</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={handleWhatsAppShare}
              className="hover:bg-[#25D366]/10 hover:text-[#25D366] hover:border-[#25D366]/30"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="sr-only">Share on WhatsApp</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Share on WhatsApp</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={handleTelegramShare}
              className="hover:bg-[#0088cc]/10 hover:text-[#0088cc] hover:border-[#0088cc]/30"
            >
              <Send className="w-4 h-4" />
              <span className="sr-only">Share on Telegram</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Share on Telegram</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={handleLineShare}
              className="hover:bg-[#00B900]/10 hover:text-[#00B900] hover:border-[#00B900]/30"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
              </svg>
              <span className="sr-only">Share on Line</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Share on Line</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={handleWeChatShare}
              className="hover:bg-[#07C160]/10 hover:text-[#07C160] hover:border-[#07C160]/30"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.407-.032zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/>
              </svg>
              <span className="sr-only">Share on WeChat</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>微信分享 (複製連結)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyText}
              className={copied 
                ? "bg-green-500/20 text-green-500 border-green-500/30" 
                : "hover:bg-muted"
              }
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span className="sr-only">Copy as plain text</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{copied ? "已複製！" : "複製純文字"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
