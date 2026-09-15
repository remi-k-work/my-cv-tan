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

export default function NavItem({ href, title, icon, isExternal = false, animDelay }: NavItemProps) {
  const { pathname } = useLocation();
  const isActive = href === pathname;

  if (isExternal) {
    return (
      <a
        href={href}
        title={title}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "relative isolate",
          "[&>svg]:size-11",
          isActive
            ? "border-foreground transition-colors [&>svg]:size-13 [&>svg]:text-foreground"
            : "border-primary-foreground hover:scale-110 hover:border-accent-foreground"
        )}
      >
        {icon}
        <span
          className="absolute top-0 left-0 h-px w-full animate-spark-h-l bg-linear-to-r from-transparent via-accent-foreground via-5% to-transparent to-10% bg-size-[800%]"
          style={{ animationDelay: `${-animDelay}s` }}
        />
        <span
          className="absolute top-0 left-0 h-full w-px animate-spark-v-l bg-linear-to-b from-transparent via-accent-foreground via-5% to-transparent to-10% bg-size-[100%_800%] direction-[reverse]"
          style={{ animationDelay: `${-animDelay}s` }}
        />
        <span
          className="absolute bottom-0 left-0 h-px w-full animate-spark-h-l bg-linear-to-r from-transparent via-accent-foreground via-5% to-transparent to-10% bg-size-[800%] direction-[reverse]"
          style={{ animationDelay: `${-animDelay}s` }}
        />
        <span
          className="absolute top-0 right-0 h-full w-px animate-spark-v-l bg-linear-to-b from-transparent via-accent-foreground via-5% to-transparent to-10% bg-size-[100%_800%]"
          style={{ animationDelay: `${-animDelay}s` }}
        />
      </a>
    );
  }

  return (
    <Link
      to={href}
      title={title}
      preload={false}
      className={cn(
        "relative isolate",
        "[&>svg]:size-11",
        isActive
          ? "border-foreground transition-colors [&>svg]:size-13 [&>svg]:text-foreground"
          : "border-primary-foreground hover:scale-110 hover:border-accent-foreground"
      )}
    >
      {icon}
      <span
        className="absolute top-0 left-0 h-px w-full animate-spark-h-l bg-linear-to-r from-transparent via-accent-foreground via-5% to-transparent to-10% bg-size-[800%]"
        style={{ animationDelay: `${-animDelay}s` }}
      />
      <span
        className="absolute top-0 left-0 h-full w-px animate-spark-v-l bg-linear-to-b from-transparent via-accent-foreground via-5% to-transparent to-10% bg-size-[100%_800%] direction-[reverse]"
        style={{ animationDelay: `${-animDelay}s` }}
      />
      <span
        className="absolute bottom-0 left-0 h-px w-full animate-spark-h-l bg-linear-to-r from-transparent via-accent-foreground via-5% to-transparent to-10% bg-size-[800%] direction-[reverse]"
        style={{ animationDelay: `${-animDelay}s` }}
      />
      <span
        className="absolute top-0 right-0 h-full w-px animate-spark-v-l bg-linear-to-b from-transparent via-accent-foreground via-5% to-transparent to-10% bg-size-[100%_800%]"
        style={{ animationDelay: `${-animDelay}s` }}
      />
    </Link>
  );
}
