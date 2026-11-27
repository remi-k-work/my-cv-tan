// services, features, and other libraries
import { Array, Match } from "effect";
import { excerpt } from "@/features/experience/domain/helpers";
import { experienceIdentity, inlineText } from "@/features/meta/domain/seo";
import { absoluteUrl, markdownTwinUrl } from "@/domain/urls";
import { escapeMdInline } from "./escape";
import { mdBulletList, mdEmptyMarker, mdIndexEntry, mdLink } from "./format";

// types
import type { PagePath } from "@/domain/models";
import type { Experience, ExperienceList } from "@/features/experience/domain/models";
import type { ExperienceIdentity } from "@/features/meta/domain/models";
import type { TwinContext } from "./models";

// The metadata every indexed document carries; URLs are computed with an explicit language at use
export interface IndexEntry {
  readonly name: string;
  readonly canonical: string;
  readonly mdHref: string;
  readonly summary?: string;
}

interface ExperienceLinesInput extends TwinContext {
  readonly experiences: ExperienceList;
  readonly mode: "twin" | "index";
}

// constants
import { STATIC_PAGES, STATIC_PAGE_PATHS } from "@/domain/pages";

const LIST_EXCERPT_LENGTH = 140;

export const pageEntry = (pagePath: PagePath): IndexEntry => {
  const { label, mdHref, indexSummary } = STATIC_PAGES[pagePath];

  return { name: label, canonical: absoluteUrl(pagePath), mdHref, summary: indexSummary };
};

export const PAGE_ENTRIES: ReadonlyArray<IndexEntry> = Array.map(STATIC_PAGE_PATHS, pageEntry);

export const experienceEntry = (identity: ExperienceIdentity): IndexEntry => ({
  name: identity.headline,
  canonical: identity.canonical,
  mdHref: identity.markdownPath,
});

const experienceLine = (experience: Experience, preferredLanguage: TwinContext["preferredLanguage"], mode: ExperienceLinesInput["mode"]) => {
  const identity = experienceIdentity({ experience, preferredLanguage });
  const summary = `${excerpt(inlineText(experience.txt), LIST_EXCERPT_LENGTH)} (${inlineText(experience.year)})`;
  const twin = markdownTwinUrl(identity.markdownPath, preferredLanguage);

  return Match.value(mode).pipe(
    Match.when("twin", () => `${mdLink(identity.headline, twin)}: ${escapeMdInline(summary)}`),
    Match.when("index", () => mdIndexEntry(identity.headline, identity.canonical, twin, summary)),
    Match.exhaustive
  );
};

// One projection shared by the index and home twin; only the index adds the canonical citation link
export const experienceLines = ({ experiences, mode, translate, preferredLanguage }: ExperienceLinesInput) =>
  Array.match(experiences, {
    onEmpty: () => mdEmptyMarker(translate),
    onNonEmpty: (entries) => mdBulletList(Array.map(entries, (experience) => experienceLine(experience, preferredLanguage, mode))),
  });
