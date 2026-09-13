// next
import Link from "next/link";

// components
import Header from "./Header";
import ScreenShots from "./ScreenShots";
import SkillsUsed from "./SkillsUsed";
import TypeWriterOutput from "@/components/TypeWriterOutput";

// types
import type { JobExperience, LocalizedContent } from "@/types/shared";
import type { UrlObject } from "url";

interface ExperienceDetailsProps {
  localizedContent: LocalizedContent;
  allExperiences: [JobExperience[], JobExperience[]];
  type: "e" | "p";
  index: number;
}

// constants
const MAX_CHUNK_LENGTH = 80;

export default function ExperienceDetails({ localizedContent, allExperiences, type, index }: ExperienceDetailsProps) {
  const experience = allExperiences[type === "e" ? 0 : 1][index];
  const { txt, liveLink, videoLink } = experience;

  // Use the helper function to create perfectly chunked paragraphs
  const paras = chunkTextByWords(txt, MAX_CHUNK_LENGTH);

  return (
    <article className="bg-clr-primary-800 mx-auto w-full max-w-4xl rounded-xl p-3">
      <Header localizedContent={localizedContent} experience={experience} />
      {liveLink || videoLink ? (
        <Link href={(videoLink ?? liveLink) as UrlObject} prefetch={false} target="_blank" rel="noopener noreferrer">
          <ScreenShots experience={experience} />
        </Link>
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
