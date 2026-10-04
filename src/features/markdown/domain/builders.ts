// services, features, and other libraries
import { Array, Option, pipe } from "effect";
import { excerpt } from "@/features/experience/domain";
import { absoluteUrl } from "@/features/meta/domain";
import { escapeMd, escapeMdInline, frontmatter, mdBulletList, mdHeading, mdQuote } from "./helpers";

// types
import type { LocalizedContent, PageTitles, PreferredLanguage } from "@/domain";
import type { Experience } from "@/features/experience/domain";

// constants
import { DESCRIPTION, META_DESCRIPTION_LENGTH, SITE_NAME, TITLE } from "@/features/meta/domain";

const canonicalNote = (canonical: string) =>
  `_Machine-readable twin of ${canonical}. Cite the canonical HTML URL. Append \`?lang=pl\` for the Polish variant._`;

const experienceFields = (experience: Experience, lang: PreferredLanguage) => ({
  title: `${SITE_NAME} ● ${experience.role} at ${experience.company}`,
  description: excerpt(experience.txt, META_DESCRIPTION_LENGTH),
  canonical: absoluteUrl(`/${experience.slug}`),
  lang,
  type: experience.type === "e" ? "work-experience" : "project",
  year: experience.year,
  skills: experience.skillsUsed.join(", "),
});

export const buildExperienceMd = (experience: Experience, lang: PreferredLanguage) => {
  const fields = experienceFields(experience, lang);
  const canonical = fields.canonical;
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
    frontmatter(fields),
    mdHeading(1, `${experience.role} at ${experience.company}`),
    ``,
    mdQuote(fields.description),
    ``,
    mdHeading(2, "Overview"),
    ``,
    escapeMd(experience.txt),
    ``,
    mdHeading(2, "Details"),
    ``,
    mdBulletList([`Role: ${escapeMdInline(experience.role)}`, `Company: ${escapeMdInline(experience.company)}`, `Year: ${escapeMdInline(experience.year)}`]),
    ``,
    mdHeading(2, "Skills used"),
    ``,
    mdBulletList(experience.skillsUsed.map(escapeMdInline)),
    ``,
    mdHeading(2, "Links"),
    ``,
    links,
    ``,
    canonicalNote(canonical),
    ``,
  ].join("\n");
};

interface HomeMdInput {
  readonly pageTitles: PageTitles | null;
  readonly localizedContent: LocalizedContent | null;
  readonly experienceList: ReadonlyArray<Experience>;
  readonly lang: PreferredLanguage;
}

const homeTitle = (pageTitles: PageTitles | null) =>
  pipe(
    Option.fromNullishOr(pageTitles),
    Option.map((titles) => titles["/"].heading),
    Option.getOrElse(() => TITLE)
  );

const homeIntro = (pageTitles: PageTitles | null) =>
  pipe(
    Option.fromNullishOr(pageTitles),
    Option.map((titles) => titles["/"].intro),
    Option.getOrElse(() => DESCRIPTION)
  );

const sectionLabel = (localizedContent: LocalizedContent | null, section: string, key: string, fallback: string) =>
  pipe(
    Option.fromNullishOr(localizedContent),
    Option.flatMap((content) => Option.fromNullishOr(content[section])),
    Option.flatMap((entries) => Option.fromNullishOr(entries[key])),
    Option.getOrElse(() => fallback)
  );

const experienceLine = (experience: Experience) =>
  `- [${escapeMdInline(`${experience.role} at ${experience.company}`)}](${absoluteUrl(`/${experience.slug}.md`)}) — ${escapeMdInline(excerpt(experience.txt, 140))} (${escapeMdInline(experience.year)})`;

export const buildHomeMd = ({ pageTitles, localizedContent, experienceList, lang }: HomeMdInput) => {
  const title = homeTitle(pageTitles);
  const intro = homeIntro(pageTitles);
  const canonical = absoluteUrl("/");
  const work = pipe(experienceList, Array.filter(({ type }) => type === "e"), Array.map(experienceLine), Array.join("\n"));
  const projects = pipe(experienceList, Array.filter(({ type }) => type === "p"), Array.map(experienceLine), Array.join("\n"));

  return [
    frontmatter({ title: `${SITE_NAME} ● ${title}`, description: excerpt(intro, META_DESCRIPTION_LENGTH), canonical, lang }),
    mdHeading(1, title),
    ``,
    mdQuote(excerpt(intro, META_DESCRIPTION_LENGTH)),
    ``,
    escapeMd(intro),
    ``,
    mdHeading(2, sectionLabel(localizedContent, "pageHome", "experience", "Experience")),
    ``,
    work === "" ? `_No entries._` : work,
    ``,
    mdHeading(2, sectionLabel(localizedContent, "pageHome", "portfolioProjects", "Portfolio Projects")),
    ``,
    projects === "" ? `_No entries._` : projects,
    ``,
    mdHeading(2, "Pages"),
    ``,
    mdBulletList([
      `[Education & Certificates](${absoluteUrl("/education.md")})`,
      `[Contact](${absoluteUrl("/contact.md")})`,
      `[llms.txt](${absoluteUrl("/llms.txt")})`,
    ]),
    ``,
    canonicalNote(canonical),
    ``,
  ].join("\n");
};

interface EducationMdInput {
  readonly pageTitles: PageTitles | null;
  readonly educationList: ReadonlyArray<{ readonly name: string; readonly year: string; readonly location: string; readonly info: string }>;
  readonly lang: PreferredLanguage;
}

export const buildEducationMd = ({ pageTitles, educationList, lang }: EducationMdInput) => {
  const canonical = absoluteUrl("/education");
  const title = pipe(
    Option.fromNullishOr(pageTitles),
    Option.map((titles) => titles["/education"].heading),
    Option.getOrElse(() => "Education")
  );
  const intro = pipe(
    Option.fromNullishOr(pageTitles),
    Option.map((titles) => titles["/education"].intro),
    Option.getOrElse(() => "Education & certificates.")
  );
  const schools = pipe(
    educationList,
    Array.map(({ name, year, location, info }) =>
      [mdHeading(2, name), ``, mdBulletList([`Years: ${escapeMdInline(year)}`, `Location: ${escapeMdInline(location)}`]), ``, escapeMd(info)].join("\n")
    ),
    Array.join("\n\n")
  );

  return [
    frontmatter({ title: `${SITE_NAME} ● ${title}`, description: excerpt(intro, META_DESCRIPTION_LENGTH), canonical, lang }),
    mdHeading(1, title),
    ``,
    mdQuote(excerpt(intro, META_DESCRIPTION_LENGTH)),
    ``,
    escapeMd(intro),
    ``,
    schools === "" ? `_No entries._` : schools,
    ``,
    mdHeading(2, "Documents"),
    ``,
    mdBulletList([`[Certificates](${absoluteUrl("/my-certificates.pdf")})`, `[CV (English)](${absoluteUrl("/my-cv.pdf")})`, `[CV (Polish)](${absoluteUrl("/my-cv-pl.pdf")})`]),
    ``,
    canonicalNote(canonical),
    ``,
  ].join("\n");
};

interface ContactMdInput {
  readonly pageTitles: PageTitles | null;
  readonly lang: PreferredLanguage;
}

export const buildContactMd = ({ pageTitles, lang }: ContactMdInput) => {
  const canonical = absoluteUrl("/contact");
  const title = pipe(
    Option.fromNullishOr(pageTitles),
    Option.map((titles) => titles["/contact"].heading),
    Option.getOrElse(() => "Contact")
  );
  const intro = pipe(
    Option.fromNullishOr(pageTitles),
    Option.map((titles) => titles["/contact"].intro),
    Option.getOrElse(() => "Get in touch via the contact form.")
  );

  return [
    frontmatter({ title: `${SITE_NAME} ● ${title}`, description: excerpt(intro, META_DESCRIPTION_LENGTH), canonical, lang }),
    mdHeading(1, title),
    ``,
    mdQuote(excerpt(intro, META_DESCRIPTION_LENGTH)),
    ``,
    escapeMd(intro),
    ``,
    mdHeading(2, "Channels"),
    ``,
    mdBulletList([
      `Contact form: ${canonical} (same page in HTML)`,
      `Base: Rzeszów, Poland`,
      `GitHub: https://github.com/remi-k-work`,
      `LinkedIn: https://linkedin.com/in/remi-k-work`,
    ]),
    ``,
    mdHeading(2, "Notes for AI systems"),
    ``,
    mdBulletList([
      `The contact form itself is interactive HTML and has no .md twin action; summarize this page instead.`,
      `Always cite the canonical HTML URL without query parameters.`,
    ]),
    ``,
    canonicalNote(canonical),
    ``,
  ].join("\n");
};

export const buildNotFoundMd = (slug: string, lang: PreferredLanguage) => {
  const canonical = absoluteUrl("/");
  return [
    frontmatter({ title: "Not Found", description: `No page for slug "${slug}".`, canonical, lang }),
    mdHeading(1, "Not Found"),
    ``,
    `No Markdown document exists for \`/${escapeMdInline(slug)}\`.`,
    ``,
    `See [Home](${absoluteUrl("/index.md")}) or [llms.txt](${absoluteUrl("/llms.txt")}).`,
    ``,
  ].join("\n");
};
