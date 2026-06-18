"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

function RouteTransitionLoaderInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [visible, setVisible] = React.useState(false);

  // When pathname or search parameters change, finish transition
  React.useEffect(() => {
    if (loading) {
      setProgress(100);
      const timer = setTimeout(() => {
        setLoading(false);
        setVisible(false);
        setProgress(0);
      }, 300); // Wait for the transition to finish
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams, loading]);

  // Handle simulating progress increments
  React.useEffect(() => {
    if (!visible) return;

    setProgress(15);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        // Increment slower as it gets closer to 90
        const step = (90 - prev) * 0.15;
        return prev + step;
      });
    }, 120);

    return () => clearInterval(interval);
  }, [visible]);

  React.useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");

      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Skip external links, mailto, tel, hashes, target blanks, and modifier keys
      if (
        href.startsWith("http") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("#") ||
        anchor.target === "_blank" ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      // If navigating to the same URL path + search params, ignore
      const currentUrl = window.location.pathname + window.location.search;
      try {
        const url = new URL(href, window.location.href);
        const targetUrl = url.pathname + url.search;
        if (targetUrl === currentUrl) return;
      } catch {
        // Fallback for relative paths that fail to parse
        if (href === currentUrl) return;
      }

      // Start transition state after a small delay to avoid flickering on fast pages
      setLoading(true);
      const timer = setTimeout(() => {
        setVisible(true);
      }, 80); // 80ms delay

      // Clean up timer if navigation finishes before the delay
      return () => clearTimeout(timer);
    };

    document.addEventListener("click", handleAnchorClick);
    return () => document.removeEventListener("click", handleAnchorClick);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.25 } }}
          className="fixed top-0 left-0 right-0 h-1.5 z-99999 bg-slate-950 pointer-events-none"
        >
          {/* Glowing bar fill */}
          <motion.div
            className="h-full rounded-r-full bg-linear-to-r from-blue-500 via-cyan-400 to-indigo-500"
            style={{
              boxShadow: "0 0 10px rgba(56,189,248,0.7), 0 0 20px rgba(99,102,241,0.4)",
            }}
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{
              type: "tween",
              ease: progress === 100 ? "easeOut" : "linear",
              duration: progress === 100 ? 0.25 : 0.4,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function RouteTransitionLoader() {
  return (
    <React.Suspense fallback={null}>
      <RouteTransitionLoaderInner />
    </React.Suspense>
  );
}

export default RouteTransitionLoader;
