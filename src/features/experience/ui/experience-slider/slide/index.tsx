// services, features, and other libraries
import { motion } from "motion/react";
import { excerpt } from "@/features/experience/domain";
import { useTilt } from "@/features/experience/hooks";

// components
import { SlideHeader } from "./header";
import { ScreenShots } from "@/features/experience/ui/screen-shots";

// types
import type { Experience } from "@/features/experience/domain";

interface SlideProps {
  experience: Experience;
}

export function Slide({ experience, experience: { txt } }: SlideProps) {
  const { style, handlers } = useTilt();

  return (
    <motion.article className="@container relative rounded-xl bg-surface-1 p-3 select-none" style={style} {...handlers}>
      <SlideHeader experience={experience} />
      <ScreenShots experience={experience} />
      <p className="mx-auto mt-3 text-justify text-sm">{excerpt(txt, 240)}</p>
    </motion.article>
  );
}
