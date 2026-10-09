// services, features, and other libraries
import { Array, Option, pipe } from "effect";
import { msg } from "gt-tanstack-start";
import { excerpt } from "@/features/experience/domain";
import { absoluteUrl, experiencePath } from "@/features/meta/domain";
import { escapeMd, escapeMdInline, frontmatter, mdBulletList, mdHeading, mdQuote } from "./helpers";

// types
import type { PreferredLanguage } from "@/domain";
import type { Experience } from "@/features/experience/domain";
import type { Translate } from "./models";

// constants
import { HOME_MD_HREF, META_DESCRIPTION_LENGTH, SITE_NAME } from "@/features/meta/domain";

export const buildExperienceMd = (experience: Experience, preferredLanguage: PreferredLanguage, translate: Translate) => {
  const { role, company, txt, skillsUsed, year, slug } = experience;
  const canonical = absoluteUrl(experiencePath(slug));
  const description = excerpt(txt, META_DESCRIPTION_LENGTH);

  // Optional outbound links: each line appears only when the experience authors one
  const links = pipe(
    [
      Option.fromNullishOr(experience.gitHubLink).pipe(Option.map((href) => `- GitHub: ${href}`)),
      Option.fromNullishOr(experience.liveLink).pipe(Option.map((href) => `- ${translate(msg("Live"))}: ${href}`)),
      Option.fromNullishOr(experience.videoLink).pipe(Option.map((href) => `- ${translate(msg("Video"))}: ${href}`)),
    ],
    Array.getSomes,
    Array.join("\n")
  );
  const linkSection = links === "" ? [] : [mdHeading(2, translate(msg("Links"))), ``, links, ``];

  return [
    frontmatter({
      title: `${SITE_NAME} ● ${role} at ${company}`,
      description,
      canonical,
      lang: preferredLanguage,
      // Machine-classifiable entry type (frontmatter mirrors <head> meta for AI indexers)
      type: experience.type === "e" ? "work-experience" : "project",
      year,
      skills: skillsUsed.join(", "),
    }),
    mdHeading(1, `${role} at ${company}`),
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
// get an honest answer and stay on the llms.txt graph of valid documents.
export const buildNotFoundMd = (slug: string, preferredLanguage: PreferredLanguage, translate: Translate) => {
  const title = translate(msg("Not Found"));
  const description = preferredLanguage === "pl" ? `Nie znaleziono strony dla identyfikatora "${slug}".` : `No page for slug "${slug}".`;

  return [
    frontmatter({ title, description, lang: preferredLanguage }),
    mdHeading(1, title),
    ``,
    preferredLanguage === "pl"
      ? `Dokument Markdown dla adresu ${experiencePath(slug)} nie istnieje.`
      : `No Markdown document exists for ${experiencePath(slug)}.`,
    ``,
    `${translate(msg("See"))} [${translate(msg("Home page"))}](${absoluteUrl(HOME_MD_HREF)}) ${translate(msg("or"))} [llms.txt](${absoluteUrl("/llms.txt")}).`,
    ``,
  ].join("\n");
};
