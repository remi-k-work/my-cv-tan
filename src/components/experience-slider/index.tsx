// services, features, and other libraries
import useEmblaCarousel from "embla-carousel-react";

// components
import Slide from "./slide";
import { Prev } from "./buttons/prev";
import { Next } from "./buttons/next";
import { Dot } from "./buttons/dot";

// types
import type { ExperienceList, LocalizedContent } from "@/domain";

interface ExperienceSliderProps {
  localizedContent: LocalizedContent;
  experienceList: ExperienceList;
}

export function ExperienceSlider({ localizedContent, experienceList }: ExperienceSliderProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel();

  return (
    <article className="grid grid-cols-[auto_1fr] grid-rows-[1fr_auto] gap-4 [grid-template-areas:'viewport_viewport''prevnext_dots']">
      <section ref={emblaRef} className="overflow-hidden [grid-area:viewport]">
        <div className="-ms-4 flex touch-pan-y touch-pinch-zoom">
          {experienceList.map((experience, index) => (
            <div key={index} className="min-w-0 shrink-0 grow-0 basis-full ps-4">
              <Slide localizedContent={localizedContent} experience={experience} />
            </div>
          ))}
        </div>
      </section>
      <header className="flex items-center gap-4 [grid-area:prevnext]">
        <Prev emblaApi={emblaApi} />
        <Next emblaApi={emblaApi} />
      </header>
      <footer className="flex flex-wrap items-center justify-end gap-1 [grid-area:dots]">
        {emblaApi?.scrollSnapList().map((_, index) => (
          <Dot key={index} emblaApi={emblaApi} index={index} />
        ))}
      </footer>
    </article>
  );
}
