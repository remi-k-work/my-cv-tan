// services, features, and other libraries
import { Array, Option, pipe } from "effect";
import { excerpt } from "@/features/experience/domain";
import { absoluteUrl } from "@/features/meta/domain";
import { escapeMd, escapeMdInline, frontmatter, mdBulletList, mdHeading, mdLabel, mdQuote } from "./helpers";

// types
import type { PreferredLanguage } from "@/domain";
import type { Experience } from "@/features/experience/domain";

// constants
import { HOME_MD_HREF, META_DESCRIPTION_LENGTH, SITE_NAME } from "@/features/meta/domain";

export const buildExperienceMd = (experience: Experience, preferredLanguage: PreferredLanguage) => {
  const { role, company, txt, skillsUsed, year, slug } = experience;
  const canonical = absoluteUrl(`/${slug}`);
  const description = excerpt(txt, META_DESCRIPTION_LENGTH);

  const links = pipe(
    [
      Option.fromNullishOr(experience.gitHubLink).pipe(Option.map((href) => `- GitHub: ${href}`)),
      Option.fromNullishOr(experience.liveLink).pipe(Option.map((href) => `- ${mdLabel(preferredLanguage, "Live", "Demo")}: ${href}`)),
      Option.fromNullishOr(experience.videoLink).pipe(Option.map((href) => `- ${mdLabel(preferredLanguage, "Video", "Wideo")}: ${href}`)),
    ],
    Array.getSomes,
    Array.join("\n")
  );
  const linkSection = links === "" ? [] : [mdHeading(2, mdLabel(preferredLanguage, "Links", "Linki")), ``, links, ``];

  return [
    frontmatter({
      title: `${SITE_NAME} ● ${role} at ${company}`,
      description,
      canonical,
      lang: preferredLanguage,
      // Frontmatter mirrors <head> meta for AI indexers: machine-classifiable entry type
      type: experience.type === "e" ? "work-experience" : "project",
      year,
      skills: skillsUsed.join(", "),
    }),
    mdHeading(1, `${role} at ${company}`),
    ``,
    mdQuote(description),
    ``,
    mdHeading(2, mdLabel(preferredLanguage, "Overview", "Opis")),
    ``,
    escapeMd(txt),
    ``,
    mdHeading(2, mdLabel(preferredLanguage, "Details", "Szczegóły")),
    ``,
    mdBulletList([
      `${mdLabel(preferredLanguage, "Role", "Rola")}: ${escapeMdInline(role)}`,
      `${mdLabel(preferredLanguage, "Company", "Firma")}: ${escapeMdInline(company)}`,
      `${mdLabel(preferredLanguage, "Year", "Rok")}: ${escapeMdInline(year)}`,
    ]),
    ``,
    mdHeading(2, mdLabel(preferredLanguage, "Skills used", "Użyte umiejętności")),
    ``,
    mdBulletList(skillsUsed.map(escapeMdInline)),
    ``,
    ...linkSection,
  ].join("\n");
};

// Explicit, parseable not-found document rather than an HTML error page: AI fetchers
// get an honest answer and stay on the llms.txt graph of valid documents.
export const buildNotFoundMd = (slug: string, preferredLanguage: PreferredLanguage) => {
  const title = mdLabel(preferredLanguage, "Not Found", "Nie znaleziono");
  const description =
    preferredLanguage === "pl" ? `Nie znaleziono strony dla identyfikatora "${slug}".` : `No page for slug "${slug}".`;

  return [
    frontmatter({ title, description, lang: preferredLanguage }),
    mdHeading(1, title),
    ``,
    preferredLanguage === "pl"
      ? `Dokument Markdown dla adresu /${escapeMdInline(slug)} nie istnieje.`
      : `No Markdown document exists for /${escapeMdInline(slug)}.`,
    ``,
    `${mdLabel(preferredLanguage, "See", "Zobacz")} [${mdLabel(preferredLanguage, "Home", "Strona główna")}](${absoluteUrl(HOME_MD_HREF)}) ${mdLabel(preferredLanguage, "or", "lub")} [llms.txt](${absoluteUrl("/llms.txt")}).`,
    ``,
  ].join("\n");
};
