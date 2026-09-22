// services, features, and other libraries
import { cn } from "@/lib/utils";

// types
import type { PageTitles } from "@/types/shared";

interface PageTitleProps {
  titleTheme: number;
  pathname: string;
  pageTitles: PageTitles[];
}

export default function PageTitle({ titleTheme, pathname, pageTitles }: PageTitleProps) {
  const { eyebrow, heading, intro } = pageTitles[titleTheme][pathname];

  return (
    <section className="mx-4 my-3 lg:mx-0">
      <p className="inline-grid overflow-clip text-lg tracking-widest text-secondary-foreground uppercase">
        <span className="col-span-full row-span-full animate-reveal-text [clip-path:inset(0_0_0_100%)]">{eyebrow}</span>
        <span
          className={cn(
            "col-span-full row-span-full flex animate-sweep-light-bar-r",
            "after:h-full after:w-2 after:flex-none after:rounded-lg after:bg-accent-foreground after:shadow-[0_0_6px_#DFFF00,0_0_12px_#DFFF00] after:content-['']",
            "before:-z-1 before:flex-1 before:bg-background before:content-['']"
          )}
        />
      </p>
      <br />
      <h1 className="inline-grid overflow-clip text-3xl uppercase">
        <span className="col-span-full row-span-full animate-reveal-text [clip-path:inset(0_100%_0_0)]">{heading}</span>
        <span
          className={cn(
            "col-span-full row-span-full flex animate-sweep-light-bar",
            "before:h-full before:w-2 before:flex-none before:rounded-lg before:bg-accent-foreground before:shadow-[0_0_6px_#DFFF00,0_0_12px_#DFFF00] before:content-['']",
            "after:-z-1 after:flex-1 after:bg-background after:content-['']"
          )}
        />
      </h1>
      <p>{intro}</p>
    </section>
  );
}
