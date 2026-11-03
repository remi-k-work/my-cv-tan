// Markdown twin renderer and index line generator for experience entries.

// services, features, and other libraries
import { Array, Option, pipe } from "effect";
import { msg } from "gt-tanstack-start";
import { experienceHeadline, excerpt } from "@/features/experience/domain/helpers";
import { absoluteUrl, experienceMarkdownPath, experiencePath, markdownTwinUrl } from "@/features/meta/domain/url";
import {
  escapeMd,
  escapeMdInline,
  detailIndexLinks,
  frontmatter,
  mdBulletList,
  mdDocument,
  mdEmptyMarker,
  mdExternalLink,
  mdFact,
  mdHeading,
  mdIndexEntry,
  mdLink,
  mdQuote,
  mdTitledSection,
  twinIdentity,
} from "./formatting";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { Experience } from "@/features/experience/domain/models";
import type { ExperienceEntryLink, ExperienceLinesInput, ExperienceMdInput } from "./models";

// constants
import { META_DESCRIPTION_LENGTH } from "@/features/meta/domain/constants";

const LIST_EXCERPT_LENGTH = 140;

// Formats an optional web link as a bullet item; non-http/https URLs are omitted.
const optionalBulletLink = (label: string, href: string | undefined) =>
  pipe(
    Option.fromNullishOr(href),
    Option.flatMap((href) => mdExternalLink(label, href))
  );

// Formats a single experience line for list views (either twin link or canonical index entry).
const experienceLine = (experience: Experience, preferredLanguage: PreferredLanguage, entry: ExperienceEntryLink) => {
  const headline = experienceHeadline(experience, preferredLanguage);
  const summary = `${escapeMdInline(excerpt(experience.txt, LIST_EXCERPT_LENGTH))} (${escapeMdInline(experience.year)})`;
  const twin = markdownTwinUrl(experienceMarkdownPath(experience.slug), preferredLanguage);

  return entry === "twin" ? `${mdLink(headline, twin)}: ${summary}` : mdIndexEntry(headline, absoluteUrl(experiencePath(experience.slug)), twin, summary);
};

// Builds list lines for an experience type, or an empty marker when no items match.
export const experienceLines = ({ experienceList, type, translate, preferredLanguage, entry }: ExperienceLinesInput) => {
  const experiences = experienceList.filter((experience) => experience.type === type);
  return experiences.length === 0
    ? mdEmptyMarker(translate)
    : mdBulletList(experiences.map((experience) => experienceLine(experience, preferredLanguage, entry)));
};

// Builds the full Markdown twin document for an experience detail page.
export const buildExperienceMd = ({ experience, preferredLanguage, translate }: ExperienceMdInput) => {
  const { role, company, txt, skillsUsed, year, slug } = experience;
  const canonical = absoluteUrl(experiencePath(slug));
  const headline = experienceHeadline(experience, preferredLanguage);
  const description = excerpt(txt, META_DESCRIPTION_LENGTH);

  const links = Array.getSomes([
    optionalBulletLink(translate(msg("GitHub Repo")), experience.gitHubLink),
    optionalBulletLink(translate(msg("Live Link")), experience.liveLink),
    optionalBulletLink(translate(msg("Watch Video")), experience.videoLink),
  ]);

  return mdDocument([
    frontmatter({
      ...twinIdentity({ title: headline, description, canonical, preferredLanguage }),
      type: experience.type === "e" ? "work-experience" : "project",
      role,
      company,
      datePublished: year,
      skills: skillsUsed.join(", "),
    }),
    mdHeading(1, headline),
    mdQuote(description),
    mdTitledSection(translate(msg("Overview")), escapeMd(txt)),
    mdTitledSection(
      translate(msg("Details")),
      mdBulletList([mdFact(translate(msg("Role")), role), mdFact(translate(msg("Company")), company), mdFact(translate(msg("Year")), year)])
    ),
    mdTitledSection(translate(msg("Skills Used")), mdBulletList(skillsUsed.map(escapeMdInline))),
    ...(links.length > 0 ? [mdTitledSection(translate(msg("Links")), mdBulletList(links))] : []),
    mdTitledSection(translate(msg("Pages")), detailIndexLinks(preferredLanguage, translate)),
  ]);
};
