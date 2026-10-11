// services, features, and other libraries
import { Array, Option, pipe } from "effect";
import { msg } from "gt-tanstack-start";
import { matchPreferredLanguage } from "@/domain";
import { experienceHeadline, excerpt } from "@/features/experience/domain";
import { absoluteUrl, experiencePath } from "@/features/meta/domain";
import { escapeMd, escapeMdInline, frontmatter, mdBulletList, mdExternalLink, mdHeading, mdQuote } from "./helpers";

// types
import type { ExperienceList } from "@/features/experience/domain";
import type { BuildNotFoundMdInput, ExperienceMdInput } from "./models";

// constants
import { HOME_MD_HREF, LLMS_TXT_HREF, META_DESCRIPTION_LENGTH, BRANDED_TITLE } from "@/features/meta/domain";

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
  const linkSection = links === "" ? [] : [mdHeading(2, translate(msg("Links"))), ``, links, ``];

  return [
    frontmatter({
      title: BRANDED_TITLE(headline),
      description,
      canonical,
      lang: preferredLanguage,
      // Machine-classifiable entry type (frontmatter mirrors <head> meta for AI indexers)
      type: experience.type === "e" ? "work-experience" : "project",
      role,
      company,
      year,
      skills: skillsUsed.join(", "),
    }),
    mdHeading(1, headline),
    ``,
    mdQuote(description),
    ``,
    mdHeading(2, translate(msg("Overview"))),
    ``,
    escapeMd(txt),
    ``,
    mdHeading(2, translate(msg("Details"))),
    ``,
    mdBulletList([
      `${translate(msg("Role"))}: ${escapeMdInline(role)}`,
      `${translate(msg("Company"))}: ${escapeMdInline(company)}`,
      `${translate(msg("Year"))}: ${escapeMdInline(year)}`,
    ]),
    ``,
    mdHeading(2, translate(msg("Skills Used"))),
    ``,
    mdBulletList(skillsUsed.map(escapeMdInline)),
    ``,
    ...linkSection,
  ].join("\n");
};

// Explicit, parseable not-found document rather than an HTML error page: AI fetchers
// get an honest answer and stay on the llms.txt graph of valid documents
export const buildNotFoundMd = ({ slug, preferredLanguage, translate }: BuildNotFoundMdInput) => {
  const title = translate(msg("Not Found"));
  const safeSlug = escapeMdInline(slug);
  const safePath = escapeMdInline(experiencePath(slug));
  const description = matchPreferredLanguage(preferredLanguage, `No page for slug "${safeSlug}".`, `Nie znaleziono strony dla identyfikatora "${safeSlug}".`);

  return [
    frontmatter({ title, description, lang: preferredLanguage }),
    mdHeading(1, title),
    ``,
    matchPreferredLanguage(preferredLanguage, `No Markdown document exists for ${safePath}.`, `Dokument Markdown dla adresu ${safePath} nie istnieje.`),
    ``,
    `${translate(msg("See"))} [${translate(msg("Home page"))}](${absoluteUrl(HOME_MD_HREF)}) ${translate(msg("or"))} [llms.txt](${absoluteUrl(LLMS_TXT_HREF)}).`,
    ``,
  ].join("\n");
};
