// services, features, and other libraries
import { chunkTextByWords } from "@/features/typewriter/domain";

// components
import { Header } from "./header";
import { ScreenShots } from "./screen-shots";
import { SkillsUsed } from "./skills-used";
import { TypeWriterOutput } from "@/features/typewriter/ui/typewriter-output";

// types
import type { Experience, LocalizedContent } from "@/domain";

interface ExperienceDetailsProps {
  localizedContent: LocalizedContent;
  experience: Experience;
}

// constants
import { MAX_CHUNK_LENGTH } from "@/features/typewriter/domain";

export function ExperienceDetails({ localizedContent, experience, experience: { txt, liveLink, videoLink } }: ExperienceDetailsProps) {
  // Use the helper function to create perfectly chunked paragraphs
  const paras = chunkTextByWords(txt, MAX_CHUNK_LENGTH);

  return (
    <article className="mx-auto w-full max-w-4xl rounded-xl bg-clr-primary-800 p-3">
      <Header localizedContent={localizedContent} experience={experience} />
      {liveLink || videoLink ? (
        <a href={videoLink ?? liveLink} target="_blank" rel="noopener noreferrer">
          <ScreenShots experience={experience} />
        </a>
      ) : (
        <ScreenShots experience={experience} />
      )}
      <SkillsUsed localizedContent={localizedContent} experience={experience} />
      {paras.map((para, index) => (
        <TypeWriterOutput key={index} fullText={para} />
      ))}
    </article>
  );
}
