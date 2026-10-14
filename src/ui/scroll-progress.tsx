// oxlint-disable react/set-state-in-effect

// react
import { useEffect, useState } from "react";

// tanstack
import { useRouterState } from "@tanstack/react-router";

// services, features, and other libraries
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useScroll, useSpring } from "motion/react";

// constants
import { MOTION_TOKENS, SPRINGS } from "@/lib/motion-tokens";

// A hairline of accent light across the top of the viewport that fills with the scroll
// Pure decoration: it simply stays empty when there is no JavaScript to drive it, and it never hides content
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();

  // The spring lets the bar settle instead of jittering on every scroll frame
  const scaleX = useSpring(scrollYProgress, SPRINGS.snappy);

  // While a route is loading, an indeterminate shimmer runs over the same hairline, so navigation feedback
  // lives exactly where the reading progress already is
  const isLoading = useRouterState({ select: (state) => state.isLoading });

  // Gated like the typewriter's cursor: the server markup (and the hydration render matching it) stays empty,
  // and the shimmer only ever becomes an option once the page is interactive
  const [isMounted, setIsMounted] = useState(false);

  // The post-mount render is the point of this gate: it opts the shimmer in only once the page is interactive
  useEffect(() => setIsMounted(true), []);

  return (
    <>
      <motion.div
        aria-hidden
        className={cn(
          "pointer-events-none fixed inset-x-0 top-0 z-20 h-0.5 origin-left",
          "bg-linear-to-r from-secondary via-accent to-secondary",
          "shadow-[0_0_8px_var(--accent)]"
        )}
        style={{ scaleX }}
      />
      <AnimatePresence>
        {isMounted && isLoading && (
          <motion.div
            key="loading"
            aria-hidden
            className={cn(
              "pointer-events-none fixed inset-x-0 top-0 z-20 h-0.5",
              "bg-linear-to-r from-transparent via-accent to-transparent",
              "shadow-[0_0_8px_var(--accent)]"
            )}
            initial={{ opacity: 0, x: "-100%" }}
            animate={{
              opacity: 1,
              x: ["-100%", "100%"],
              transition: { repeat: Infinity, duration: MOTION_TOKENS.duration.crawl, ease: MOTION_TOKENS.easing.linear },
            }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
