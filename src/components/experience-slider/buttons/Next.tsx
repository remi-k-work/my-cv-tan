// react
import { useCallback, useEffect, useState } from "react";

// components
import { Button } from "@/components/ui/custom/button";

// assets
import NextIcon from "@/assets/icons/Next";

// types
import type { EmblaCarouselType } from "embla-carousel";

interface NextProps {
  emblaApi?: EmblaCarouselType;
}

export default function Next({ emblaApi }: NextProps) {
  const [isDisabled, setIsDisabled] = useState(true);

  const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
    setIsDisabled(!emblaApi.canScrollNext());
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
    <Button type="button" disabled={isDisabled} onClick={() => emblaApi?.scrollNext()}>
      <NextIcon className="size-9" />
    </Button>
  );
}
