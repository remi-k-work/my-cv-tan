// other libraries
import { cn } from "@/lib/utils";
import DataLoader from "@/lib/DataLoader";

// types
interface PageTitleProps {
  titleTheme: number;
  pathname: string;
}

export default async function PageTitle({ titleTheme, pathname }: PageTitleProps) {
  // Create an instance of the data loader needed for localization
  const { allPageTitles } = await DataLoader.create();

  // Get the current page title data depending on the theme and pathname
  const { eyebrow, heading, intro } = allPageTitles()[titleTheme][pathname];

  return (
    <section className="mx-4 my-3 lg:mx-0">
      <p className="text-secondary-foreground inline-grid overflow-clip text-lg tracking-widest uppercase">
        <span className="animate-reveal-text col-span-full row-span-full [clip-path:inset(0_0_0_100%)]">{eyebrow}</span>
        <span
          className={cn(
            "animate-sweep-light-bar-r col-span-full row-span-full flex",
            "after:bg-accent-foreground after:h-full after:w-2 after:flex-none after:rounded-lg after:shadow-[0_0_6px_#DFFF00,0_0_12px_#DFFF00] after:content-['']",
            "before:bg-background before:-z-1 before:flex-1 before:content-['']",
          )}
        />
      </p>
      <br />
      <h1 className="inline-grid overflow-clip text-3xl uppercase">
        <span className="animate-reveal-text col-span-full row-span-full [clip-path:inset(0_100%_0_0)]">{heading}</span>
        <span
          className={cn(
            "animate-sweep-light-bar col-span-full row-span-full flex",
            "before:bg-accent-foreground before:h-full before:w-2 before:flex-none before:rounded-lg before:shadow-[0_0_6px_#DFFF00,0_0_12px_#DFFF00] before:content-['']",
            "after:bg-background after:-z-1 after:flex-1 after:content-['']",
          )}
        />
      </h1>
      <p>{intro}</p>
    </section>
  );
}
