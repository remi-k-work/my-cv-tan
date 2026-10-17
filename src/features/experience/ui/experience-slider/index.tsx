// react
import { useId } from "react";

// services, features, and other libraries
import useEmblaCarousel from "embla-carousel-react";
import { useEmblaSelect } from "@/features/experience/hooks/use-embla-select";

// components
import { Slide } from "./slide";
import { Dot } from "./buttons/dot";
import { Next } from "./buttons/next";
import { Prev } from "./buttons/prev";

// types
import type { EmblaCarouselType } from "embla-carousel";
import type { ExperienceList } from "@/features/experience/domain/models";

interface ExperienceSliderProps {
  experienceList: ExperienceList;
}

export function ExperienceSlider({ experienceList }: ExperienceSliderProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel();

  // Unique per slider, so the selected dot's frame springs within this carousel and never across the two on the homepage
  const frameLayoutId = useId();

  return (
    <div className="grid grid-cols-[auto_1fr] grid-rows-[1fr_auto] gap-4 [grid-template-areas:'viewport_viewport''prevnext_dots']">
      <div ref={emblaRef} className="overflow-clip [grid-area:viewport]">
        <div className="-ms-4 flex touch-pan-y touch-pinch-zoom">
          {experienceList.map((experience) => (
            <div key={experience.slug} className="min-w-0 shrink-0 grow-0 basis-full ps-4">
              <Slide experience={experience} />
            </div>
          ))}
        </div>
      </div>
      <SliderControls emblaApi={emblaApi} frameLayoutId={frameLayoutId} />
    </div>
  );
}

// Owns the carousel navigation state, so scrolling re-renders only the controls, not every slide
function SliderControls({ emblaApi, frameLayoutId }: { emblaApi: EmblaCarouselType | undefined; frameLayoutId: string }) {
  const { selectedIndex, snapCount, canScrollPrev, canScrollNext } = useEmblaSelect(emblaApi);

  return (
    <>
      <div className="flex items-center gap-4 [grid-area:prevnext]">
        <Prev disabled={!canScrollPrev} onPrev={() => emblaApi?.scrollPrev()} />
        <Next disabled={!canScrollNext} onNext={() => emblaApi?.scrollNext()} />
      </div>
      <ul className="flex flex-wrap items-center justify-end gap-1 [grid-area:dots]">
        {Array.from({ length: snapCount }, (_, index) => (
          <li key={index}>
            <Dot index={index} selected={index === selectedIndex} onSelect={() => emblaApi?.scrollTo(index)} frameLayoutId={frameLayoutId} />
          </li>
        ))}
      </ul>
    </>
  );
}
