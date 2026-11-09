// services, features, and other libraries
import { excerpt, experienceHeadline } from "@/features/experience/domain/helpers";
import { absoluteUrl, experienceMarkdownPath, experiencePath, markdownTwinUrl } from "@/features/meta/domain/urls";
import { mdBulletList, mdEmptyMarker, mdIndexEntry, mdLink } from "./format";
import { escapeMdInline } from "./escape";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { Experience } from "@/features/experience/domain/models";
import type { ExperienceLinesInput } from "./models";

// constants
const LIST_EXCERPT_LENGTH = 140;

const experienceLine = (experience: Experience, preferredLanguage: PreferredLanguage, entry: ExperienceLinesInput["entry"]) => {
  const headline = experienceHeadline(experience, preferredLanguage);
  const summary = `${excerpt(experience.txt, LIST_EXCERPT_LENGTH)} (${experience.year})`;
  const twin = markdownTwinUrl(experienceMarkdownPath(experience.slug), preferredLanguage);

  return entry === "twin"
    ? `${mdLink(headline, twin)}: ${escapeMdInline(summary)}`
    : mdIndexEntry(headline, absoluteUrl(experiencePath(experience.slug)), twin, summary);
};

export const experienceLines = ({ experiences, entry, translate, preferredLanguage }: ExperienceLinesInput) =>
  experiences.length === 0 ? mdEmptyMarker(translate) : mdBulletList(experiences.map((experience) => experienceLine(experience, preferredLanguage, entry)));
