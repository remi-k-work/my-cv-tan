import Header from "./Header";
import ScreenShots from "./ScreenShots";
import SkillsUsed from "./SkillsUsed";
import TypeWriterOutput from "@/components/TypeWriterOutput";

import type { JobExperience, LocalizedContent } from "@/types/shared";

interface ExperienceDetailsProps {
  localizedContent: LocalizedContent;
  allExperiences: [JobExperience[], JobExperience[]];
  type: "e" | "p";
  index: number;
}

const MAX_CHUNK_LENGTH = 80;

export default function ExperienceDetails({ localizedContent, allExperiences, type, index }: ExperienceDetailsProps) {
  const experience = allExperiences[type === "e" ? 0 : 1][index];
  const { txt, liveLink, videoLink } = experience;

  const paras = chunkTextByWords(txt, MAX_CHUNK_LENGTH);

  return (
    <article className="bg-clr-primary-800 mx-auto w-full max-w-4xl rounded-xl p-3">
      <Header localizedContent={localizedContent} experience={experience} />
      {liveLink || videoLink ? (
        <a href={videoLink ?? liveLink} target="_blank" rel="noopener noreferrer">
          <ScreenShots experience={experience} />
        </a>
      ) : (
        <ScreenShots experience={experience} />
      )}
      <SkillsUsed localizedContent={localizedContent} experience={experience} />
      <p className="sr-only">{txt}</p>
      {paras.map((para, index) => (
        <TypeWriterOutput key={index} fullText={para} />
      ))}
    </article>
  );
}

function chunkTextByWords(text: string, maxLength: number): string[] {
  const chunks: string[] = [];
  const words = text.split(" ");
  let currentChunk = "";

  for (const word of words) {
    if ((currentChunk + " " + word).length <= maxLength) {
      currentChunk += (currentChunk ? " " : "") + word;
    } else {
      chunks.push(currentChunk);
      currentChunk = word;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}
