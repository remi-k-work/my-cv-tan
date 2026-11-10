// services, features, and other libraries
import { absoluteUrl, experienceMarkdownPath, experiencePath, markdownTwinUrl } from "@/features/meta/domain/urls";
import { excerpt, experienceHeadline } from "@/features/experience/domain/helpers";
import { mdBulletList, mdEmptyMarker, mdIndexEntry, mdLink } from "./format";
import { escapeMdInline } from "./escape";

// types
import type { Experience, ExperienceList } from "@/features/experience/domain/models";
import type { TwinContext } from "./models";

interface ExperienceLinesInput extends TwinContext {
  readonly experiences: ExperienceList;
  readonly mode: "twin" | "index";
}

// constants
const LIST_EXCERPT_LENGTH = 140;

const experienceLine = (experience: Experience, preferredLanguage: TwinContext["preferredLanguage"], mode: ExperienceLinesInput["mode"]) => {
  const headline = experienceHeadline(experience, preferredLanguage);
  const summary = `${excerpt(experience.txt, LIST_EXCERPT_LENGTH)} (${experience.year})`;
  const twin = markdownTwinUrl(experienceMarkdownPath(experience.slug), preferredLanguage);

  return mode === "twin"
    ? `${mdLink(headline, twin)}: ${escapeMdInline(summary)}`
    : mdIndexEntry(headline, absoluteUrl(experiencePath(experience.slug)), twin, summary);
};

// One projection of the experience list, shared by the index and the home twin; only the lead URL differs
export const experienceLines = ({ experiences, mode, translate, preferredLanguage }: ExperienceLinesInput) =>
  experiences.length === 0 ? mdEmptyMarker(translate) : mdBulletList(experiences.map((experience) => experienceLine(experience, preferredLanguage, mode)));
