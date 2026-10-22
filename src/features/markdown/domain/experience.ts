// services, features, and other libraries
import { Array, Option, pipe, Result } from "effect";
import { msg } from "gt-tanstack-start";
import { matchPreferredLanguage } from "@/domain/helpers";
import { experienceHeadline, excerpt } from "@/features/experience/domain/helpers";
import { absoluteUrl, experienceMarkdownHref, experiencePath } from "@/features/meta/domain/url";
import {
  escapeMd,
  escapeMdInline,
  frontmatter,
  mdBulletList,
  mdDocument,
  mdEmptyMarker,
  mdExternalLink,
  mdHeading,
  mdQuote,
  mdSection,
  translateSource,
} from "./helpers";

// types
import type { ExperienceList } from "@/features/experience/domain/models";
import type { BuildNotFoundMdInput, ExperienceLinesInput, ExperienceMdInput } from "./models";

// constants
import { HOME_MD_HREF, LLMS_TXT_HREF, META_DESCRIPTION_LENGTH, BRANDED_TITLE, DEFAULT_LANGUAGE, SITE_NAME } from "@/features/meta/domain/constants";
import { LIST_EXCERPT_LENGTH } from "./constants";

// Locate one experience by slug inside a decoded list (None = clean 404 candidate);
// a failed decode stays an error in the caller via requireData
export const experienceFromList = (experienceList: ExperienceList, slug: string) => Array.findFirst(experienceList, (experience) => experience.slug === slug);

// Optional link bullet: an absent href or a non-web URL (rejected by mdExternalLink) drops the line
const optionalBulletLink = (label: string, href: string | undefined) =>
  pipe(
    Option.fromNullishOr(href),
    Option.flatMap((href) => mdExternalLink(label, href)),
    Option.map((link) => `- ${link}`)
  );

// Section body lines for one experience type, or an explicit empty marker (never a bare heading)
export const experienceLines = ({ experienceList, type, translate = translateSource, preferredLanguage = DEFAULT_LANGUAGE }: ExperienceLinesInput) =>
  pipe(
    experienceList,
    // Filter and format in one pass: only this experience type contributes a line
    Array.filterMap((experience) =>
      experience.type === type
        ? // One line per experience in AI indexes: label links the .md twin, excerpt carries the substance
          Result.succeed(
            `- [${escapeMdInline(experienceHeadline(experience, preferredLanguage))}](${experienceMarkdownHref(experience.slug)}) — ${escapeMdInline(excerpt(experience.txt, LIST_EXCERPT_LENGTH))} (${escapeMdInline(experience.year)})`
          )
        : Result.failVoid
    ),
    Array.join("\n"),
    (lines) => (lines === "" ? mdEmptyMarker(translate) : lines)
  );

export const buildExperienceMd = ({ experience, preferredLanguage, translate }: ExperienceMdInput) => {
  const { role, company, txt, skillsUsed, year, slug } = experience;
  const canonical = absoluteUrl(experiencePath(slug));
  const headline = experienceHeadline(experience, preferredLanguage);
  const description = excerpt(txt, META_DESCRIPTION_LENGTH);

  const links = pipe(
    [
      optionalBulletLink("GitHub", experience.gitHubLink),
      optionalBulletLink(translate(msg("Live")), experience.liveLink),
      optionalBulletLink(translate(msg("Video")), experience.videoLink),
    ],
    Array.getSomes,
    Array.join("\n")
  );

  return mdDocument([
    frontmatter({
      title: BRANDED_TITLE(headline),
      description,
      // author mirrors the HTML author meta: authoritative attribution is a GEO signal
      author: SITE_NAME,
      canonical,
      lang: preferredLanguage,
      // Machine-classifiable entry type (frontmatter mirrors <head> meta for AI indexers)
      type: experience.type === "e" ? "work-experience" : "project",
      role,
      company,
      year,
      skills: Array.join(skillsUsed, ", "),
    }),
    mdHeading(1, headline),
    mdQuote(description),
    mdSection(mdHeading(2, translate(msg("Overview"))), escapeMd(txt)),
    mdSection(
      mdHeading(2, translate(msg("Details"))),
      mdBulletList([
        `${translate(msg("Role"))}: ${escapeMdInline(role)}`,
        `${translate(msg("Company"))}: ${escapeMdInline(company)}`,
        `${translate(msg("Year"))}: ${escapeMdInline(year)}`,
      ])
    ),
    mdSection(mdHeading(2, translate(msg("Skills Used"))), mdBulletList(Array.map(skillsUsed, escapeMdInline))),
    // A linkless experience omits the section entirely instead of rendering an empty heading
    ...(links === "" ? [] : [mdSection(mdHeading(2, translate(msg("Links"))), links)]),
  ]);
};

// Explicit, parseable not-found document rather than an HTML error page: AI fetchers
// get an honest answer and stay on the llms.txt graph of valid documents
export const buildNotFoundMd = ({ slug, preferredLanguage, translate }: BuildNotFoundMdInput) => {
  const title = translate(msg("Not Found"));
  const safeSlug = escapeMdInline(slug);
  const safePath = escapeMdInline(experiencePath(slug));
  const description = matchPreferredLanguage(preferredLanguage, `No page for slug "${safeSlug}".`, `Nie znaleziono strony dla identyfikatora "${safeSlug}".`);

  return mdDocument([
    frontmatter({ title, description, lang: preferredLanguage }),
    mdHeading(1, title),
    matchPreferredLanguage(preferredLanguage, `No Markdown document exists for ${safePath}.`, `Dokument Markdown dla adresu ${safePath} nie istnieje.`),
    `${translate(msg("See"))} [${translate(msg("Home page"))}](${absoluteUrl(HOME_MD_HREF)}) ${translate(msg("or"))} [llms.txt](${absoluteUrl(LLMS_TXT_HREF)}).`,
  ]);
};
