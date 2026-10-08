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
  return (
    <section className="rounded-xl bg-surface-2 p-4">
      <figure className="mx-auto w-full max-w-4xl">
        <PanelCaption>{title}</PanelCaption>
        <ExperienceSlider experienceList={experienceList} />
      </figure>
    </section>
  );
}
