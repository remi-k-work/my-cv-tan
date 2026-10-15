// react
import { useId } from "react";

// components
import { PanelCaption } from "@/ui/panel-caption";
import { ExperienceSlider } from "./experience-slider";

// types
import type { ExperienceList } from "@/features/experience/domain";

interface SliderPanelProps {
  title: string;
  experienceList: ExperienceList;
}

export function SliderPanel({ title, experienceList }: SliderPanelProps) {
  const headingId = useId();

  return (
    <section className="rounded-xl bg-surface-2 p-4" aria-labelledby={headingId}>
      <div className="mx-auto w-full max-w-4xl">
        <PanelCaption id={headingId}>{title}</PanelCaption>
        <ExperienceSlider experienceList={experienceList} />
      </div>
    </section>
  );
}
