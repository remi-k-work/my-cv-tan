// components
import { RevealText } from "@/ui/reveal-text";

// types
import type { PagePath, PageTitles } from "@/domain";

interface PageTitleProps {
  pagePath: PagePath;
  pageTitles: PageTitles;
}

export function PageTitle({ pagePath, pageTitles }: PageTitleProps) {
  const { eyebrow, heading, intro } = pageTitles[pagePath];

  return (
    <section className="mx-4 my-3 lg:mx-0">
      <p className="inline-grid overflow-clip text-lg tracking-widest text-text-2 uppercase">
        <RevealText reverse>{eyebrow}</RevealText>
      </p>
      <br />
      <h1 className="inline-grid overflow-clip text-3xl uppercase">
        <RevealText>{heading}</RevealText>
      </h1>
      <p>{intro}</p>
    </section>
  );
}
