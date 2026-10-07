// services, features, and other libraries
import { Array, Option, pipe } from "effect";
import { excerpt } from "@/features/experience/domain";
import { absoluteUrl } from "@/features/meta/domain";
import { matchPreferredLanguage } from "@/domain";
import { escapeMd, escapeMdInline, frontmatter, mdBulletList, mdHeading, mdQuote } from "./helpers";

// types
import type { PreferredLanguage } from "@/domain";
import type { Experience } from "@/features/experience/domain";

// constants
import { HOME_MD_HREF, META_DESCRIPTION_LENGTH, SITE_NAME } from "@/features/meta/domain";

export const buildExperienceMd = (experience: Experience, preferredLanguage: PreferredLanguage) => {
  const { role, company, txt, skillsUsed, year, slug } = experience;
  const canonical = absoluteUrl(`/${slug}`);
  const description = excerpt(txt, META_DESCRIPTION_LENGTH);

  // Optional outbound links: each line appears only when the experience authors one
  const links = pipe(
    [
      Option.fromNullishOr(experience.gitHubLink).pipe(Option.map((href) => `- GitHub: ${href}`)),
      Option.fromNullishOr(experience.liveLink).pipe(Option.map((href) => `- ${matchPreferredLanguage(preferredLanguage, "Live", "Demo")}: ${href}`)),
      Option.fromNullishOr(experience.videoLink).pipe(Option.map((href) => `- ${matchPreferredLanguage(preferredLanguage, "Video", "Wideo")}: ${href}`)),
    ],
    Array.getSomes,
    Array.join("\n")
  );
  const linkSection = links === "" ? [] : [mdHeading(2, matchPreferredLanguage(preferredLanguage, "Links", "Linki")), ``, links, ``];

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
    mdHeading(2, matchPreferredLanguage(preferredLanguage, "Overview", "Opis")),
    ``,
    escapeMd(txt),
    ``,
    mdHeading(2, matchPreferredLanguage(preferredLanguage, "Details", "Szczegóły")),
    ``,
    mdBulletList([
      `${matchPreferredLanguage(preferredLanguage, "Role", "Rola")}: ${escapeMdInline(role)}`,
      `${matchPreferredLanguage(preferredLanguage, "Company", "Firma")}: ${escapeMdInline(company)}`,
      `${matchPreferredLanguage(preferredLanguage, "Year", "Rok")}: ${escapeMdInline(year)}`,
    ]),
    ``,
    mdHeading(2, matchPreferredLanguage(preferredLanguage, "Skills used", "Użyte umiejętności")),
    ``,
    mdBulletList(skillsUsed.map(escapeMdInline)),
    ``,
    ...linkSection,
  ].join("\n");
};

// Explicit, parseable not-found document rather than an HTML error page: AI fetchers
// get an honest answer and stay on the llms.txt graph of valid documents.
export const buildNotFoundMd = (slug: string, preferredLanguage: PreferredLanguage) => {
  const title = matchPreferredLanguage(preferredLanguage, "Not Found", "Nie znaleziono");
  const description = preferredLanguage === "pl" ? `Nie znaleziono strony dla identyfikatora "${slug}".` : `No page for slug "${slug}".`;

  return [
    frontmatter({ title, description, lang: preferredLanguage }),
    mdHeading(1, title),
    ``,
    preferredLanguage === "pl"
      ? `Dokument Markdown dla adresu /${escapeMdInline(slug)} nie istnieje.`
      : `No Markdown document exists for /${escapeMdInline(slug)}.`,
    ``,
    `${matchPreferredLanguage(preferredLanguage, "See", "Zobacz")} [${matchPreferredLanguage(preferredLanguage, "Home", "Strona główna")}](${absoluteUrl(HOME_MD_HREF)}) ${matchPreferredLanguage(preferredLanguage, "or", "lub")} [llms.txt](${absoluteUrl("/llms.txt")}).`,
    ``,
  ].join("\n");
};
