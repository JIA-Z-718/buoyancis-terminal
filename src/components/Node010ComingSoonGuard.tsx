import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const GUARD_KEY = "buoyancis_node010_comingsoon_reload_v1";

function normalizePathname(pathname: string) {
  return pathname.replace(/\/+$/, "") || "/";
}

function isNode010Path(pathname: string) {
  const p = normalizePathname(pathname);
  return p === "/node/010" || p === "/node-010" || p === "/node010";
}

function domContainsComingSoon() {
  try {
    const text = document?.body?.innerText || "";
    return text.includes("[ COMING SOON ]") || text.includes("COMING SOON");
  } catch {
    return false;
  }
}

/**
 * Route-scoped safety net:
 * If the cached placeholder ever renders on Node 010, reload the page once.
 */
export default function Node010ComingSoonGuard() {
  const location = useLocation();

  useEffect(() => {
    if (!isNode010Path(location.pathname)) return;

    try {
      if (sessionStorage.getItem(GUARD_KEY) === "1") return;

      const triggerReloadOnce = () => {
        try {
          sessionStorage.setItem(GUARD_KEY, "1");
        } catch {
          // best effort
        }
        // The boolean parameter is deprecated; modern browsers ignore it.
        window.location.reload();
      };

      // Fast path
      if (domContainsComingSoon()) {
        triggerReloadOnce();
        return;
      }

      // Watch for late hydration or cached markup being injected.
      const observer = new MutationObserver(() => {
        if (domContainsComingSoon()) {
          observer.disconnect();
          triggerReloadOnce();
        }
      });

      observer.observe(document.documentElement, {
        subtree: true,
        childList: true,
        characterData: true,
      });

      // Last-chance check a moment after mount.
      const timeout = window.setTimeout(() => {
        if (domContainsComingSoon()) {
          observer.disconnect();
          triggerReloadOnce();
        }
      }, 1500);

      return () => {
        observer.disconnect();
        window.clearTimeout(timeout);
      };
    } catch {
      // best effort
    }
  }, [location.pathname]);

  return null;
}
