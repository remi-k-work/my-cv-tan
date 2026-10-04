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
  animDelay: number;
}

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
        className="direction-[reverse] absolute top-0 left-0 h-full w-px animate-spark-v-l bg-linear-to-b from-transparent via-accent via-5% to-transparent to-10% bg-size-[100%_800%]"
        style={style}
      />
      <span
        className="direction-[reverse] absolute bottom-0 left-0 h-px w-full animate-spark-h-l bg-linear-to-r from-transparent via-accent via-5% to-transparent to-10% bg-size-[800%]"
        style={style}
      />
      <span
        className="absolute top-0 right-0 h-full w-px animate-spark-v-l bg-linear-to-b from-transparent via-accent via-5% to-transparent to-10% bg-size-[100%_800%]"
        style={style}
      />
    </>
  );
}

export function NavItem({ href, title, icon, isExternal = false, animDelay }: NavItemProps) {
  const { pathname } = useLocation();
  const isActive = href === pathname;

  const className = cn(
    "relative isolate",
    "[&>svg]:size-11",
    isActive ? "border-text-1 transition-colors [&>svg]:size-13 [&>svg]:text-text-1" : "hover:scale-110 hover:border-accent"
  );
  const content = (
    <>
      {icon}
      <Sparks animDelay={animDelay} />
    </>
  );

  if (isExternal) {
    return (
      <a href={href} title={title} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link to={href} title={title} preload={false} className={className}>
      {content}
    </Link>
  );
}
