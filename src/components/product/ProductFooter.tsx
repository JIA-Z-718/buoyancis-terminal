import { useLanguage } from "@/contexts/LanguageContext";
import NewsletterForm from "@/components/NewsletterForm";

const LINKEDIN_URL = "https://www.linkedin.com/in/jiahao-zhang718";

const ProductFooter = () => {
  const { t, lang } = useLanguage();

  return (
    <footer className="border-t border-border/40 py-10 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Newsletter CTA */}
        <div className="text-center mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-1">
            {lang === "cn" ? "訂閱更新" : "Stay Updated"}
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            {lang === "cn"
              ? "搶先獲得新地區上線通知。"
              : "Be the first to know when we launch in your city."}
          </p>
          <NewsletterForm />
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border/20 text-xs text-muted-foreground">
          <span>{t("footer.tagline")}</span>
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            LinkedIn →
          </a>
        </div>
      </div>
    </footer>
  );
};

export default ProductFooter;
