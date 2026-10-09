// services, features, and other libraries
import { cn } from "@/lib/utils";
import { useGT, useLocale } from "gt-tanstack-start";
import { cvPdfHref } from "@/features/meta/domain";
import { preferredLanguageFromLocale } from "@/features/data/domain";

// components
import { NavItem } from "./nav-item";
import { LangChanger } from "@/features/data/ui/lang-changer";

// constants
import { NAV_ITEMS } from "./constants";

export function Header() {
  const gt = useGT();
  const locale = useLocale();

  return (
    <header
      className={cn(
        "z-10 bg-surface-2 [grid-area:header]",
        "lg:sticky lg:top-0",
        "before:absolute before:top-12 before:left-0 before:-z-1 before:h-px before:w-full before:content-['']",
        "before:animate-spark-h before:bg-linear-to-r before:from-primary before:via-accent before:via-5% before:to-primary before:to-10% before:bg-size-[200%]",
        "lg:before:fixed lg:before:top-14",
        "max-lg:after:absolute max-lg:after:top-34 max-lg:after:left-0 max-lg:after:-z-1 max-lg:after:h-px max-lg:after:w-full max-lg:after:content-['']",
        "max-lg:after:direction-[reverse] max-lg:after:animate-spark-h max-lg:after:bg-linear-to-r max-lg:after:from-primary max-lg:after:via-accent max-lg:after:via-5% max-lg:after:to-primary max-lg:after:to-10% max-lg:after:bg-size-[200%]"
      )}
    >
      <nav
        className={cn(
          "mx-2 grid place-content-evenly place-items-center gap-x-4 gap-y-1",
          "h-44 grid-flow-row grid-cols-4",
          "lg:h-28 lg:grid-flow-col lg:grid-cols-none",
          "*:border *:bg-surface-1 *:p-3 *:text-text-2 *:hover:text-accent"
        )}
      >
        {NAV_ITEMS(cvPdfHref(preferredLanguageFromLocale(locale)), gt).map((navItem, index) => (
          <NavItem key={navItem.href} {...navItem} animDelay={index ** 2} />
        ))}
        <LangChanger />
      </nav>
    </header>
  );
}
