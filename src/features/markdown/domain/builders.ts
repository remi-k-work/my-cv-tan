// services, features, and other libraries
import { Array, Option, pipe } from "effect";
import { excerpt } from "@/features/experience/domain";
import { absoluteUrl } from "@/features/meta/domain";
import { escapeMd, escapeMdInline, frontmatter, mdBulletList, mdHeading, mdQuote } from "./helpers";

// types
import type { LocalizedContent, PagePath, PageTitles, PreferredLanguage } from "@/domain";
import type { Experience, ExperienceList } from "@/features/experience/domain";
import type { ContactMdInput, EducationMdInput, HomeMdInput } from "./models";

// constants
import { DESCRIPTION, HOME_MD_HREF, EDUCATION_MD_HREF, CONTACT_MD_HREF, META_DESCRIPTION_LENGTH, SITE_NAME, SOCIAL_LINKS, TITLE } from "@/features/meta/domain";

const canonicalNote = (canonical: string) =>
  `_Machine-readable twin of ${canonical}. Cite the canonical HTML URL. Append \`?lang=pl\` for the Polish variant._`;

// Localized page title/intro with a static fallback when loader data is missing or partial
const pageField = (pageTitles: PageTitles | null, pagePath: PagePath, key: "heading" | "intro", fallback: string) =>
  pipe(
    Option.fromNullishOr(pageTitles),
    Option.flatMap((titles) => Option.fromNullishOr(titles[pagePath])),
    Option.map((page) => page[key]),
    Option.getOrElse(() => fallback)
  );

// Localized section label from the content bundle, e.g. ("pageHome", "experience")
const sectionLabel = (localizedContent: LocalizedContent | null, section: string, key: string, fallback: string) =>
  pipe(
    Option.fromNullishOr(localizedContent),
    Option.flatMap((content) => Option.fromNullishOr(content[section])),
    Option.flatMap((entries) => Option.fromNullishOr(entries[key])),
    Option.getOrElse(() => fallback)
  );

// One line per experience in AI indexes: label links the .md twin, excerpt carries the substance
const experienceLine = (experience: Experience) =>
  `- [${escapeMdInline(`${experience.role} at ${experience.company}`)}](${absoluteUrl(`/${experience.slug}.md`)}) — ${escapeMdInline(excerpt(experience.txt, 140))} (${escapeMdInline(experience.year)})`;

// Section body lines for one experience type, or an explicit empty marker (never a bare heading)
const experienceLines = (experienceList: ExperienceList, type: Experience["type"]) =>
  pipe(
    experienceList,
    Array.filter((experience) => experience.type === type),
    Array.map(experienceLine),
    Array.join("\n"),
    (lines) => (lines === "" ? `_No entries._` : lines)
  );

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

export const buildHomeMd = ({ pageTitles, localizedContent, experienceList, preferredLanguage }: HomeMdInput) => {
  const title = pageField(pageTitles, "/", "heading", TITLE);
  const intro = pageField(pageTitles, "/", "intro", DESCRIPTION);
  const canonical = absoluteUrl("/");

  return [
    frontmatter({ title: `${SITE_NAME} ● ${title}`, description: excerpt(intro, META_DESCRIPTION_LENGTH), canonical, lang: preferredLanguage }),
    mdHeading(1, title),
    ``,
    mdQuote(excerpt(intro, META_DESCRIPTION_LENGTH)),
    ``,
    escapeMd(intro),
    ``,
    mdHeading(2, sectionLabel(localizedContent, "pageHome", "experience", "Experience")),
    ``,
    experienceLines(experienceList, "e"),
    ``,
    mdHeading(2, sectionLabel(localizedContent, "pageHome", "portfolioProjects", "Portfolio Projects")),
    ``,
    experienceLines(experienceList, "p"),
    ``,
    mdHeading(2, "Pages"),
    ``,
    mdBulletList([
      `[Education & Certificates](${absoluteUrl(EDUCATION_MD_HREF)})`,
      `[Contact](${absoluteUrl(CONTACT_MD_HREF)})`,
      `[llms.txt](${absoluteUrl("/llms.txt")})`,
    ]),
    ``,
    canonicalNote(canonical),
    ``,
  ].join("\n");
};

export const buildEducationMd = ({ pageTitles, educationList, preferredLanguage }: EducationMdInput) => {
  const title = pageField(pageTitles, "/education", "heading", "Education");
  const intro = pageField(pageTitles, "/education", "intro", "Education & certificates.");
  const canonical = absoluteUrl("/education");

  const schools = pipe(
    educationList,
    Array.map(({ name, year, location, info }) =>
      [mdHeading(2, name), ``, mdBulletList([`Years: ${escapeMdInline(year)}`, `Location: ${escapeMdInline(location)}`]), ``, escapeMd(info)].join("\n")
    ),
    Array.join("\n\n")
  );

  return [
    frontmatter({ title: `${SITE_NAME} ● ${title}`, description: excerpt(intro, META_DESCRIPTION_LENGTH), canonical, lang: preferredLanguage }),
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
    mdBulletList([
      `[Certificates](${absoluteUrl("/my-certificates.pdf")})`,
      `[CV (English)](${absoluteUrl("/my-cv.pdf")})`,
      `[CV (Polish)](${absoluteUrl("/my-cv-pl.pdf")})`,
    ]),
    ``,
    canonicalNote(canonical),
    ``,
  ].join("\n");
};

export const buildContactMd = ({ pageTitles, preferredLanguage }: ContactMdInput) => {
  const title = pageField(pageTitles, "/contact", "heading", "Contact");
  const intro = pageField(pageTitles, "/contact", "intro", "Get in touch via the contact form.");
  const canonical = absoluteUrl("/contact");

  return [
    frontmatter({ title: `${SITE_NAME} ● ${title}`, description: excerpt(intro, META_DESCRIPTION_LENGTH), canonical, lang: preferredLanguage }),
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

// Machine-readable site index for AI systems (GEO). Every entry points at a `.md`
// twin (never raw HTML) so crawlers fetch exactly one Markdown page at a time.
export const buildLlmsTxt = (experienceList: ExperienceList) =>
  [
    `# ${SITE_NAME}`,
    ``,
    `> ${excerpt(TITLE, META_DESCRIPTION_LENGTH)}`,
    ``,
    DESCRIPTION,
    ``,
    `Self-taught web developer portfolio. Every page below has a machine-readable Markdown twin; fetch one linked \`.md\` page at a time.`,
    ``,
    `## Pages`,
    ``,
    `- [Home](${absoluteUrl(HOME_MD_HREF)}): portfolio overview with experience and project lists.`,
    `- [Education & Certificates](${absoluteUrl(EDUCATION_MD_HREF)}): schools, courses and certificates.`,
    `- [Contact](${absoluteUrl(CONTACT_MD_HREF)}): contact form, location and social profiles.`,
    ``,
    `## Work Experience`,
    ``,
    experienceLines(experienceList, "e"),
    ``,
    `## Portfolio Projects`,
    ``,
    experienceLines(experienceList, "p"),
    ``,
    `## Documents`,
    ``,
    `- CV (English): ${absoluteUrl("/my-cv.pdf")}`,
    `- CV (Polish): ${absoluteUrl("/my-cv-pl.pdf")}`,
    `- Certificates: ${absoluteUrl("/my-certificates.pdf")}`,
    ``,
    `## Profiles`,
    ``,
    ...SOCIAL_LINKS.map((link) => `- ${link}`),
    ``,
    `## Notes for AI systems`,
    ``,
    `- Append \`?lang=pl\` to any \`.md\` URL for the Polish variant (default is English). Cookie and Accept-Language are also respected.`,
    `- Always cite the clean canonical HTML URL from each document's frontmatter (\`canonical:\`), not the \`.md\` URL.`,
    `- Structured data (JSON-LD) is embedded in every page head.`,
    ``,
  ].join("\n");
