// react
import { useCallback, useEffect, useState } from "react";

// components
import { Button } from "@/components/ui/custom/button";

// assets
import PrevIcon from "@/assets/icons/Prev";

// types
import type { EmblaCarouselType } from "embla-carousel";

interface PrevProps {
  emblaApi?: EmblaCarouselType;
}

export default function Prev({ emblaApi }: PrevProps) {
  const [isDisabled, setIsDisabled] = useState(true);

  const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
    setIsDisabled(!emblaApi.canScrollPrev());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    onSelect(emblaApi);
    emblaApi.on("reInit", onSelect).on("select", onSelect);

    return () => {
      emblaApi.off("reInit", onSelect).off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <Button type="button" disabled={isDisabled} onClick={() => emblaApi?.scrollPrev()}>
      <PrevIcon className="size-9" />
    </Button>
  );
}
