// services, features, and other libraries
import { Array, Option, pipe } from "effect";
import { msg } from "gt-tanstack-start";
import { experienceHeadline, excerpt } from "@/features/experience/domain";
import { absoluteUrl, experiencePath } from "@/features/meta/domain";
import { escapeMd, escapeMdInline, frontmatter, mdBulletList, mdExternalLink, mdHeading, mdQuote } from "./helpers";

// types
import type { PreferredLanguage } from "@/domain";
import type { Experience, ExperienceList } from "@/features/experience/domain";
import type { Translate } from "./models";

// constants
import { HOME_MD_HREF, META_DESCRIPTION_LENGTH, SITE_NAME } from "@/features/meta/domain";

// Locate one experience by slug inside a decoded list (None = clean 404 candidate);
// a failed decode stays an error in the caller via requireData
export const experienceFromList = (experienceList: ExperienceList, slug: string) => Array.findFirst(experienceList, (experience) => experience.slug === slug);

export const buildExperienceMd = (experience: Experience, preferredLanguage: PreferredLanguage, translate: Translate) => {
  const { role, company, txt, skillsUsed, year, slug } = experience;
  const canonical = absoluteUrl(experiencePath(slug));
  const headline = experienceHeadline(experience, preferredLanguage);
  const description = excerpt(txt, META_DESCRIPTION_LENGTH);

  // Ignore non-web URLs so untrusted content never becomes an active Markdown link
  const links = pipe(
    [
      Option.fromNullishOr(experience.gitHubLink).pipe(Option.flatMap((href) => mdExternalLink("GitHub", href))),
      Option.fromNullishOr(experience.liveLink).pipe(Option.flatMap((href) => mdExternalLink(translate(msg("Live")), href))),
      Option.fromNullishOr(experience.videoLink).pipe(Option.flatMap((href) => mdExternalLink(translate(msg("Video")), href))),
    ],
    Array.getSomes,
    Array.map((link) => `- ${link}`),
    Array.join("\n")
  );
  const linkSection = links === "" ? [] : [mdHeading(2, translate(msg("Links"))), ``, links, ``];

  return [
    frontmatter({
      title: `${SITE_NAME} ● ${headline}`,
      description,
      canonical,
      lang: preferredLanguage,
      // Machine-classifiable entry type (frontmatter mirrors <head> meta for AI indexers)
      type: experience.type === "e" ? "work-experience" : "project",
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
export const buildNotFoundMd = (slug: string, preferredLanguage: PreferredLanguage, translate: Translate) => {
  const title = translate(msg("Not Found"));
  const safeSlug = escapeMdInline(slug);
  const safePath = escapeMdInline(experiencePath(slug));
  const description = preferredLanguage === "pl" ? `Nie znaleziono strony dla identyfikatora "${safeSlug}".` : `No page for slug "${safeSlug}".`;

  return [
    frontmatter({ title, description, lang: preferredLanguage }),
    mdHeading(1, title),
    ``,
    preferredLanguage === "pl"
      ? `Dokument Markdown dla adresu ${safePath} nie istnieje.`
      : `No Markdown document exists for ${safePath}.`,
    ``,
    `${translate(msg("See"))} [${translate(msg("Home page"))}](${absoluteUrl(HOME_MD_HREF)}) ${translate(msg("or"))} [llms.txt](${absoluteUrl("/llms.txt")}).`,
    ``,
  ].join("\n");
};
