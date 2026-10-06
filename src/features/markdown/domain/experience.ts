// services, features, and other libraries
import { Array, Option, pipe } from "effect";
import { excerpt } from "@/features/experience/domain";
import { absoluteUrl } from "@/features/meta/domain";
import { canonicalNote, escapeMd, escapeMdInline, frontmatter, mdBulletList, mdHeading, mdQuote } from "./helpers";

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
      Option.fromNullishOr(experience.liveLink).pipe(Option.map((href) => `- Live: ${href}`)),
      Option.fromNullishOr(experience.videoLink).pipe(Option.map((href) => `- Video: ${href}`)),
      Option.some(`- Canonical page: ${canonical}`),
    ],
    Array.getSomes,
    Array.join("\n")
  );

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
    mdHeading(2, "Overview"),
    ``,
    escapeMd(txt),
    ``,
    mdHeading(2, "Details"),
    ``,
    mdBulletList([`Role: ${escapeMdInline(role)}`, `Company: ${escapeMdInline(company)}`, `Year: ${escapeMdInline(year)}`]),
    ``,
    mdHeading(2, "Skills used"),
    ``,
    mdBulletList(skillsUsed.map(escapeMdInline)),
    ``,
    mdHeading(2, "Links"),
    ``,
    links,
    ``,
    canonicalNote(canonical),
    ``,
  ].join("\n");
};

// Explicit, parseable not-found document rather than an HTML error page: AI fetchers
// get an honest answer and stay on the llms.txt graph of valid documents.
export const buildNotFoundMd = (slug: string, preferredLanguage: PreferredLanguage) => {
  const canonical = absoluteUrl("/");
  return [
    frontmatter({ title: "Not Found", description: `No page for slug "${slug}".`, canonical, lang: preferredLanguage }),
    mdHeading(1, "Not Found"),
    ``,
    `No Markdown document exists for \`/${escapeMdInline(slug)}\`.`,
    ``,
    `See [Home](${absoluteUrl(HOME_MD_HREF)}) or [llms.txt](${absoluteUrl("/llms.txt")}).`,
    ``,
  ].join("\n");
};
