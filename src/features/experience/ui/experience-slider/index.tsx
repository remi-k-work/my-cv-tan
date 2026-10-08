// react
import { useCallback } from "react";

// services, features, and other libraries
import useEmblaCarousel from "embla-carousel-react";
import { useEmblaSelect } from "@/features/experience/hooks";

// components
import { Slide } from "./slide";
import { Dot, Next, Prev } from "./buttons";

// types
import type { EmblaCarouselType } from "embla-carousel";
import type { LocalizedContent } from "@/domain";
import type { ExperienceList } from "@/features/experience/domain";

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
          {experienceList.map((experience) => (
            <div key={experience.slug} className="min-w-0 shrink-0 grow-0 basis-full ps-4">
              <Slide localizedContent={localizedContent} experience={experience} />
            </div>
          ))}
        </div>
      </section>
      <SliderControls emblaApi={emblaApi} />
    </article>
  );
}

// Owns the carousel navigation state, so scrolling re-renders only the controls, not every slide
function SliderControls({ emblaApi }: { emblaApi: EmblaCarouselType | undefined }) {
  const { selectedIndex, snapCount, canScrollPrev, canScrollNext } = useEmblaSelect(emblaApi);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => () => emblaApi?.scrollTo(index), [emblaApi]);

  return (
    <>
      <header className="flex items-center gap-4 [grid-area:prevnext]">
        <Prev disabled={!canScrollPrev} onPrev={scrollPrev} />
        <Next disabled={!canScrollNext} onNext={scrollNext} />
      </header>
      <footer className="flex flex-wrap items-center justify-end gap-1 [grid-area:dots]">
        {Array.from({ length: snapCount }, (_, index) => (
          <Dot key={index} selected={index === selectedIndex} onSelect={scrollTo(index)} />
        ))}
      </footer>
    </>
  );
}
