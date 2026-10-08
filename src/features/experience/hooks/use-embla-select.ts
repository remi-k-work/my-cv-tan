// react
import { useEffect, useState } from "react";

// types
import type { EmblaCarouselType } from "embla-carousel";

interface EmblaSelectState {
  selectedIndex: number;
  snapCount: number;
  canScrollPrev: boolean;
  canScrollNext: boolean;
}

// Tracks the navigation state of an Embla carousel in a single subscription,
// so the controls that consume it re-render on scroll without making the
// slide viewport re-render.
export function useEmblaSelect(emblaApi: EmblaCarouselType | undefined): EmblaSelectState {
  const [state, setState] = useState<EmblaSelectState>({ selectedIndex: 0, snapCount: 0, canScrollPrev: false, canScrollNext: true });

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = (api: EmblaCarouselType) =>
      setState({
        selectedIndex: api.selectedScrollSnap(),
        snapCount: api.scrollSnapList().length,
        canScrollPrev: api.canScrollPrev(),
        canScrollNext: api.canScrollNext(),
      });

    onSelect(emblaApi);
    emblaApi.on("reInit", onSelect).on("select", onSelect);

    return () => {
      emblaApi.off("reInit", onSelect).off("select", onSelect);
    };
  }, [emblaApi]);

  return state;
}
