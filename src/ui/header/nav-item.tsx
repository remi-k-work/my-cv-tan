// tanstack
import { Link, useLocation } from "@tanstack/react-router";

// services, features, and other libraries
import { cn } from "@/lib/utils";

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
// How much later each nav item enters, so the row assembles itself instead of popping in all at once
const ENTER_STAGGER_SECONDS = 0.08;

// The four animated spark segments running along the item's edges
function Sparks({ animDelay }: { animDelay: number }) {
  const style = { animationDelay: `${-animDelay}s` };

  return (
    <>
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
    </>
  );
}

export function NavItem({ href, title, icon, isExternal = false, index }: NavItemProps) {
  const { pathname } = useLocation();
  const isActive = href === pathname;

  const className = cn(
    "relative isolate animate-rise",
    "[&>svg]:size-11",
    isActive ? "border-text-1 transition-colors [&>svg]:size-13 [&>svg]:text-text-1" : "hover:scale-110 hover:border-accent"
  );

  // Inline style, so the stagger survives no matter how the animation utility is ordered
  const style = { animationDelay: `${index * ENTER_STAGGER_SECONDS}s` };

  const content = (
    <>
      {icon}
      <Sparks animDelay={index ** 2} />
    </>
  );

  if (isExternal) {
    return (
      <a href={href} title={title} target="_blank" rel="noopener noreferrer" className={className} style={style}>
        {content}
      </a>
    );
  }

  return (
    <Link to={href} title={title} preload={false} className={className} style={style}>
      {content}
    </Link>
  );
}
