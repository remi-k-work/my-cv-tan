"use client";

// other libraries
import useEmblaCarousel from "embla-carousel-react";

// components
import Slide from "./slide";
import Prev from "./buttons/Prev";
import Next from "./buttons/Next";
import Dot from "./buttons/Dot";

// types
import type { JobExperience, LocalizedContent } from "@/types/shared";

interface ExperienceSliderProps {
  localizedContent: LocalizedContent;
  allExperiences: [JobExperience[], JobExperience[]];
  type: "e" | "p";
}

export default function ExperienceSlider({ localizedContent, allExperiences, type }: ExperienceSliderProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel();

  return (
    <article className="grid grid-cols-[auto_1fr] grid-rows-[1fr_auto] gap-4 [grid-template-areas:'viewport_viewport''prevnext_dots']">
      <section ref={emblaRef} className="overflow-hidden [grid-area:viewport]">
        <div className="-ms-4 flex touch-pan-y touch-pinch-zoom">
          {allExperiences[type === "e" ? 0 : 1].map((singleJobExperience, jobIndex) => (
            <div key={jobIndex} className="min-w-0 shrink-0 grow-0 basis-full ps-4">
              <Slide localizedContent={localizedContent} type={type} index={jobIndex} experience={singleJobExperience} />
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
