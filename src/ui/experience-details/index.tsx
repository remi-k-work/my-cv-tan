// components
import { Header } from "./header";
import { ScreenShots } from "./screen-shots";
import { SkillsUsed } from "./skills-used";
import { TypeWriterOutput } from "@/ui/typewriter-output";

// types
import type { Experience, LocalizedContent } from "@/domain";

interface ExperienceDetailsProps {
  localizedContent: LocalizedContent;
  experience: Experience;
}

// constants
const MAX_CHUNK_LENGTH = 80;

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
      <p className="sr-only">{txt}</p>
      {paras.map((para, index) => (
        <TypeWriterOutput key={index} fullText={para} />
      ))}
    </article>
  );
}

// A helper function to split text while respecting word boundaries
function chunkTextByWords(text: string, maxLength: number): string[] {
  const chunks: string[] = [];
  // First, split the entire text into individual words
  const words = text.split(" ");
  let currentChunk = "";

  for (const word of words) {
    // If adding the next word doesn't exceed the max length, add it
    if ((currentChunk + " " + word).length <= maxLength) {
      currentChunk += (currentChunk ? " " : "") + word;
    } else {
      // Otherwise, push the current chunk to the array and start a new one
      chunks.push(currentChunk);
      currentChunk = word;
    }
  }

  // Add the last remaining chunk
  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}
