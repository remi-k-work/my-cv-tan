// services, features, and other libraries
import { chunkTextByWords } from "@/features/typewriter/domain";

// components
import { Header } from "./header";
import { ScreenShots } from "@/features/experience/ui/screen-shots";
import { SkillsUsed } from "./skills-used";
import { Typewriter } from "@/features/typewriter/ui/typewriter";

// types
import type { LocalizedContent } from "@/domain";
import type { Experience } from "@/features/experience/domain";

interface ExperienceDetailsProps {
  localizedContent: LocalizedContent;
  experience: Experience;
}

// constants
import { MAX_CHUNK_LENGTH } from "@/features/typewriter/domain";

export function ExperienceDetails({ localizedContent, experience, experience: { txt } }: ExperienceDetailsProps) {
  // Use the helper function to create perfectly chunked paragraphs
  const paras = chunkTextByWords(txt, MAX_CHUNK_LENGTH);

  return (
    <article className="mx-auto w-full max-w-4xl rounded-xl bg-surface-2 p-3">
      <Header localizedContent={localizedContent} experience={experience} />
      <ScreenShots experience={experience} />
      <SkillsUsed localizedContent={localizedContent} experience={experience} />
      {paras.map((para, index) => (
        <Typewriter key={index} fullText={para} />
      ))}
    </article>
  );
}
