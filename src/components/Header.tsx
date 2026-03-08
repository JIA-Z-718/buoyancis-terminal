import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, Sparkles } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { handleAnchorClick } from "@/lib/smoothScroll";

interface NavLink {
  href: string;
  label: string;
  sectionId: string;
  isRoute?: boolean;
}

// Simplified navigation - Philosophy & Access only
const primaryLinks: NavLink[] = [
  { href: "#about", label: "Philosophy", sectionId: "about" },
  { href: "#trust-matrix", label: "Architecture", sectionId: "trust-matrix" },
];

const secondaryLinks: NavLink[] = [
  { href: "#team", label: "Team", sectionId: "team" },
  { href: "#faq", label: "FAQ", sectionId: "faq" },
  { href: "#contact", label: "Contact", sectionId: "contact" },
  { href: "/tools/decoder", label: "Decoder", sectionId: "decoder", isRoute: true },
  { href: "/blog", label: "Blog", sectionId: "blog", isRoute: true },
];

const allLinks: NavLink[] = [...primaryLinks, ...secondaryLinks];

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const closeMenu = () => setIsMenuOpen(false);
  const closeDropdown = () => setIsDropdownOpen(false);

  const onNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    handleAnchorClick(e, href, () => {
      closeMenu();
      closeDropdown();
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    allLinks.forEach((link) => {
      const element = document.getElementById(link.sectionId);
      if (element) {
        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              setActiveSection(link.sectionId);
            }
          },
          { threshold: 0.3, rootMargin: "-80px 0px -50% 0px" }
        );
        observer.observe(element);
        observers.push(observer);
      }
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  const isSecondaryActive = secondaryLinks.some((link) => link.sectionId === activeSection);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b transition-shadow duration-300 ${
        isScrolled ? "border-border/40 shadow-sm" : "border-transparent"
      }`}
    >
      <div className="container-narrow">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="text-xl font-serif text-foreground hover:text-primary transition-colors">
            Buoyancis
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {/* Vernissage Z Event Link */}
            <Link
              to="/"
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Vernissage Z
            </Link>

            {/* Check-in Registration Link */}
            <Link
              to="/tools/checkin"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Check-in
            </Link>

            {primaryLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => onNavClick(e, link.href)}
                className={`text-sm transition-colors relative group ${
                  activeSection === link.sectionId
                    ? "text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
                {activeSection === link.sectionId && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full animate-fade-in" />
                )}
                {activeSection !== link.sectionId && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary/60 rounded-full origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
                )}
              </a>
            ))}

            {/* More dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`text-sm transition-colors flex items-center gap-1 ${
                  isSecondaryActive
                    ? "text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                More
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown menu */}
              <div
                className={`absolute top-full right-0 mt-2 w-44 py-2 bg-card border border-border rounded-lg shadow-lg z-50 transition-all duration-200 origin-top-right ${
                  isDropdownOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
                }`}
              >
                {secondaryLinks.map((link) => (
                  link.isRoute ? (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={closeDropdown}
                      className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={(e) => onNavClick(e, link.href)}
                      className={`block px-4 py-2 text-sm transition-colors ${
                        activeSection === link.sectionId
                          ? "text-primary font-medium bg-primary/5"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      {link.label}
                    </a>
                  )
                ))}
              </div>
            </div>
          </nav>

          {/* Desktop CTA & Theme Toggle */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <a href="#early-access" onClick={(e) => onNavClick(e, "#early-access")}>
              <Button variant="hero" size="sm">
                Request Access
              </Button>
            </a>
          </div>

          {/* Mobile Theme Toggle & Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-out bg-background/95 backdrop-blur-md border-b border-border/40 ${
          isMenuOpen ? "max-h-[32rem]" : "max-h-0"
        }`}
      >
        <nav className="container-narrow py-4 flex flex-col gap-1">
          {/* Vernissage Z Event Link - Mobile */}
          <Link
            to="/"
            onClick={closeMenu}
            className={`text-base py-3 px-3 rounded-lg transition-all duration-300 font-medium text-primary bg-primary/10 flex items-center gap-2 ${
              isMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
            }`}
            style={{ transitionDelay: isMenuOpen ? "100ms" : "0ms" }}
          >
            <Sparkles className="w-4 h-4" />
            Vernissage Z
          </Link>

          {allLinks.map((link, index) => (
            link.isRoute ? (
              <Link
                key={link.href}
                to={link.href}
                onClick={closeMenu}
                className={`text-base py-3 px-3 rounded-lg transition-all duration-300 text-muted-foreground hover:text-foreground hover:bg-muted/50 ${
                  isMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                }`}
                style={{ transitionDelay: isMenuOpen ? `${150 + index * 50}ms` : "0ms" }}
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => onNavClick(e, link.href)}
                className={`text-base py-3 px-3 rounded-lg transition-all duration-300 ${
                  activeSection === link.sectionId
                    ? "text-primary font-medium bg-primary/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                } ${isMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
                style={{ transitionDelay: isMenuOpen ? `${150 + index * 50}ms` : "0ms" }}
              >
                {link.label}
              </a>
            )
          ))}
          <a 
            href="#early-access" 
            onClick={(e) => onNavClick(e, "#early-access")} 
            className={`mt-3 transition-all duration-300 ${
              isMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
            }`}
            style={{ transitionDelay: isMenuOpen ? `${100 + allLinks.length * 50}ms` : "0ms" }}
          >
            <Button variant="hero" size="sm" className="w-full">
              Request Access
            </Button>
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Header;
