// components
import { RevealText } from "@/ui/reveal-text";

// types
import type { PagePath, PageTitles } from "@/domain/models";

interface PageTitleProps {
  pagePath: PagePath;
  pageTitles: PageTitles;
}

export function PageTitle({ pagePath, pageTitles }: PageTitleProps) {
  const { eyebrow, heading, intro } = pageTitles[pagePath];

  return (
    <header className="mx-4 my-3 animate-rise lg:mx-0">
      <p className="inline-grid overflow-clip text-lg tracking-widest text-text-2 uppercase">
        <RevealText reverse>{eyebrow}</RevealText>
      </p>
      <br />
      <h1 className="inline-grid overflow-clip text-3xl uppercase">
        <RevealText>{heading}</RevealText>
      </h1>
      {/* The intro settles into place a beat after the sweeping reveals, layering the hero entrance instead of popping in */}
      <p className="animate-rise [animation-delay:1s]">{intro}</p>
    </header>
  );
}
