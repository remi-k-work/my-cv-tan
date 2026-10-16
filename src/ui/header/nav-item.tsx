// tanstack
import { Link, useLocation } from "@tanstack/react-router";

// services, features, and other libraries
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

// types
import type { ReactNode } from "react";

interface NavItemProps {
  href: string;
  title: string;
  icon: ReactNode;
  isExternal?: boolean;
  index: number;
}

// constants
import { MOTION_TOKENS, SPRINGS } from "@/lib/motion-tokens";

// The four animated spark segments running along the item's edges
function Sparks({ animDelay }: { animDelay: number }) {
  const style = { animationDelay: `${-animDelay}s` };

  return (
    <span className="contents" aria-hidden="true">
      <span
        className="absolute top-0 left-0 h-px w-full animate-spark-h-l bg-linear-to-r from-transparent via-accent via-5% to-transparent to-10% bg-size-[800%]"
        style={style}
      />
      <span
        className="absolute top-0 left-0 h-full w-px animate-spark-v-l bg-linear-to-b from-transparent via-accent via-5% to-transparent to-10% bg-size-[100%_800%] [animation-direction:reverse]!"
        style={style}
      />
      <span
        className="absolute bottom-0 left-0 h-px w-full animate-spark-h-l bg-linear-to-r from-transparent via-accent via-5% to-transparent to-10% bg-size-[800%] [animation-direction:reverse]!"
        style={style}
      />
      <span
        className="absolute top-0 right-0 h-full w-px animate-spark-v-l bg-linear-to-b from-transparent via-accent via-5% to-transparent to-10% bg-size-[100%_800%]"
        style={style}
      />
    </span>
  );
}

export function NavItem({ href, title, icon, isExternal = false, index }: NavItemProps) {
  const { pathname } = useLocation();
  const isActive = href === pathname;

  const className = cn(
    "relative isolate animate-rise border bg-surface-1 p-3 text-text-2 hover:text-accent",
    isActive ? "border-text-1 transition-colors [&_svg]:size-13 [&_svg]:text-text-1" : "hover:scale-110 hover:border-accent"
  );

  // Inline style, so the stagger survives no matter how the animation utility is ordered
  const style = { animationDelay: `${index * MOTION_TOKENS.duration.normal}s` };

  const content = (
    <>
      {/* The accent halo only ever exists on the active item; the shared layout id lets it spring across the
          row on navigation instead of blinking out on one tile and into the next */}
      {isActive && (
        <motion.span
          className="absolute inset-0 -z-1 bg-accent/10 shadow-[0_0_10px_var(--accent)]"
          layoutId="nav-active-glow"
          transition={SPRINGS.snappy}
          aria-hidden="true"
        />
      )}
      <span className="contents [&_svg]:size-11" aria-hidden="true">
        {icon}
      </span>
      <Sparks animDelay={index ** 2} />
    </>
  );

  if (isExternal)
    return (
      <a className={className} style={style} href={href} title={title} aria-label={title} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );

  return (
    <Link className={className} style={style} to={href} title={title} aria-label={title} aria-current={isActive ? "page" : undefined}>
      {content}
    </Link>
  );
}
