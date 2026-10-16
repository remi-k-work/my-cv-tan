// services, features, and other libraries
import { chunkTextByWords } from "@/features/typewriter/domain";

// components
import { ExperienceHeader } from "@/features/experience/ui/experience-header";
import { ExperienceLinks } from "@/features/experience/ui/experience-links";
import { ScreenShots } from "@/features/experience/ui/screen-shots";
import { SkillsUsed } from "./skills-used";
import { Typewriter } from "@/features/typewriter/ui/typewriter";

// types
import type { Experience } from "@/features/experience/domain";

interface ExperienceDetailsProps {
  experience: Experience;
}

// constants
import { MAX_CHUNK_LENGTH } from "@/features/typewriter/domain";

// Chunking is pure and the texts are static content, so repeated opens of the same
// experience reuse the cached paragraphs instead of re-splitting the text
const chunkCache = new Map<string, ReadonlyArray<string>>();
const chunkText = (txt: string): ReadonlyArray<string> => {
  const cached = chunkCache.get(txt);
  if (cached !== undefined) return cached;

  const chunks = chunkTextByWords(txt, MAX_CHUNK_LENGTH);
  chunkCache.set(txt, chunks);
  return chunks;
};

export function ExperienceDetails({ experience, experience: { txt } }: ExperienceDetailsProps) {
  // Use the helper function to create perfectly chunked paragraphs
  const paras = chunkText(txt);

  return (
    // The rise plays on the details page load and again inside the overlay each time it opens
    <article className="mx-auto w-full max-w-4xl animate-rise rounded-xl bg-surface-2 p-3">
      <ExperienceHeader experience={experience}>
        <ExperienceLinks experience={experience} iconClassName="size-11" />
      </ExperienceHeader>
      <ScreenShots experience={experience} priorityFirstFrame />
      <SkillsUsed experience={experience} />
      {paras.map((para, index) => (
        <Typewriter key={index} fullText={para} />
      ))}
    </article>
  );
}
