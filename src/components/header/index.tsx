// services, features, and other libraries
import { cn } from "@/lib/utils";

// components
import NavItem from "./NavItem";
import LangChanger from "@/features/data/ui/lang-changer";

// types
import type { LocalizedContent, PreferredLanguage } from "@/domain";

interface HeaderProps {
  preferredLanguage: PreferredLanguage;
  localizedContent: LocalizedContent;
}

// constants
import { NAV_ITEMS } from "./constants";

export default function Header({ preferredLanguage, localizedContent }: HeaderProps) {
  return (
    <header
      className={cn(
        "z-10 bg-clr-primary-800 [grid-area:header]",
        "lg:sticky lg:top-0",
        "before:absolute before:top-12 before:left-0 before:-z-1 before:h-px before:w-full before:content-['']",
        "before:animate-spark-h before:bg-linear-to-r before:from-primary-foreground before:via-accent-foreground before:via-5% before:to-primary-foreground before:to-10% before:bg-size-[200%]",
        "lg:before:fixed lg:before:top-14",
        "max-lg:after:absolute max-lg:after:top-34 max-lg:after:left-0 max-lg:after:-z-1 max-lg:after:h-px max-lg:after:w-full max-lg:after:content-['']",
        "max-lg:after:direction-[reverse] max-lg:after:animate-spark-h max-lg:after:bg-linear-to-r max-lg:after:from-primary-foreground max-lg:after:via-accent-foreground max-lg:after:via-5% max-lg:after:to-primary-foreground max-lg:after:to-10% max-lg:after:bg-size-[200%]"
      )}
    >
      <nav
        className={cn(
          "mx-2 grid place-content-evenly place-items-center gap-x-4 gap-y-1",
          "h-44 grid-flow-row grid-cols-4",
          "lg:h-28 lg:grid-flow-col lg:grid-cols-none",
          "*:border *:bg-background *:p-3 *:text-clr-primary-200 *:hover:text-accent-foreground"
        )}
      >
        {NAV_ITEMS(localizedContent).map((navItem, index) => (
          <NavItem key={index} {...navItem} animDelay={index ** 2} />
        ))}
        <LangChanger preferredLanguage={preferredLanguage} />
      </nav>
    </header>
  );
}
