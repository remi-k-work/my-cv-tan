// services, features, and other libraries
import { cn } from "@/lib/utils";
import { motion, useScroll, useSpring } from "motion/react";

// constants
import { SPRINGS } from "@/lib/motion-tokens";

// A hairline of accent light across the top of the viewport that fills with the scroll
// Pure decoration: it simply stays empty when there is no JavaScript to drive it, and it never hides content
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();

  // The spring lets the bar settle instead of jittering on every scroll frame
  const scaleX = useSpring(scrollYProgress, SPRINGS.snappy);

  return (
    <motion.div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-20 h-0.5 origin-left",
        "bg-linear-to-r from-secondary via-accent to-secondary",
        "shadow-[0_0_8px_var(--accent)]"
      )}
      style={{ scaleX }}
    />
  );
}
