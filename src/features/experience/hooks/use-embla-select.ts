// react
import { useEffect, useState } from "react";

// types
import type { EmblaCarouselType } from "embla-carousel";

interface EmblaSelectState {
  selectedIndex: number;
  canScrollPrev: boolean;
  canScrollNext: boolean;
}

// Tracks the active slide and scroll "reachability" of an Embla carousel in a
// single subscription, so it can be lifted to the parent instead of repeated
// in every button/dot.
export function useEmblaSelect(emblaApi: EmblaCarouselType | undefined): EmblaSelectState {
  const [state, setState] = useState<EmblaSelectState>({ selectedIndex: 0, canScrollPrev: false, canScrollNext: true });

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = (api: EmblaCarouselType) =>
      setState({ selectedIndex: api.selectedScrollSnap(), canScrollPrev: api.canScrollPrev(), canScrollNext: api.canScrollNext() });

    onSelect(emblaApi);
    emblaApi.on("reInit", onSelect).on("select", onSelect);

    return () => {
      emblaApi.off("reInit", onSelect).off("select", onSelect);
    };
  }, [emblaApi]);

  return state;
}
