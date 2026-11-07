// The one experience-listing line projection every Markdown surface prints: the home twin's two
// sections and the AI index's grouped lists are built from these lines, so the two surfaces cannot
// group, order, trim or escape an experience differently. Only the lead URL each line carries
// differs, because that is the one thing the two surfaces exist to advertise — the twin points at
// the twin route to fetch, the index at the canonical HTML URL to cite. The section titles each
// document prints over these lines are its own, so each keeps the wording its readers expect.

// services, features, and other libraries
import { excerpt, experienceHeadline } from "@/features/experience/domain/helpers";

// meta (shared)
import { absoluteUrl, experienceMarkdownPath, experiencePath, markdownTwinUrl } from "@/features/meta/domain/urls";

// formatting primitives
import { escapeMdInline } from "./escape";
import { mdBulletList, mdEmptyMarker, mdIndexEntry, mdLink } from "./format";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { Experience } from "@/features/experience/domain/models";
import type { ExperienceLinesInput } from "./models";

const LIST_EXCERPT_LENGTH = 140;

// One listing line: headline, a bounded summary, and either the twin route to fetch or the
// canonical HTML URL the twin's own document names as the citation target.
const experienceLine = (experience: Experience, preferredLanguage: PreferredLanguage, entry: ExperienceLinesInput["entry"]) => {
  const headline = experienceHeadline(experience, preferredLanguage);
  const summary = `${excerpt(experience.txt, LIST_EXCERPT_LENGTH)} (${experience.year})`;
  const twin = markdownTwinUrl(experienceMarkdownPath(experience.slug), preferredLanguage);

  return entry === "twin" ? `${mdLink(headline, twin)}: ${escapeMdInline(summary)}` : mdIndexEntry(headline, absoluteUrl(experiencePath(experience.slug)), twin, summary);
};

// The lines one section prints, or an empty marker when that kind has no items. The caller hands
// over the kind's own split rather than the mixed list, so a document printing both kinds splits
// once and the two listings cannot group an experience differently.
export const experienceLines = ({ experiences, entry, translate, preferredLanguage }: ExperienceLinesInput) =>
  experiences.length === 0 ? mdEmptyMarker(translate) : mdBulletList(experiences.map((experience) => experienceLine(experience, preferredLanguage, entry)));
