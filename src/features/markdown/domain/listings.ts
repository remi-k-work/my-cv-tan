// services, features, and other libraries
import { Array } from "effect";
import { markdownTwinUrl } from "@/features/meta/domain/urls";
import { experienceSeo } from "@/features/meta/domain/seo";
import { excerpt } from "@/features/experience/domain/helpers";
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
  const seo = experienceSeo({ experience, preferredLanguage });
  const summary = `${excerpt(experience.txt, LIST_EXCERPT_LENGTH)} (${experience.year})`;
  const twin = markdownTwinUrl(seo.markdownPath, preferredLanguage);

  return mode === "twin" ? `${mdLink(seo.headline, twin)}: ${escapeMdInline(summary)}` : mdIndexEntry(seo.headline, seo.canonical, twin, summary);
};

// One projection shared by the index and home twin; only the index adds the canonical citation link
export const experienceLines = ({ experiences, mode, translate, preferredLanguage }: ExperienceLinesInput) =>
  Array.match(experiences, {
    onEmpty: () => mdEmptyMarker(translate),
    onNonEmpty: (entries) => mdBulletList(Array.map(entries, (experience) => experienceLine(experience, preferredLanguage, mode))),
  });
