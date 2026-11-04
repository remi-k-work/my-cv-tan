// Markdown twin declarations, document builders, and SEO identity helpers.
// Low-level Markdown formatting primitives are defined in this module.

// services, features, and other libraries
import { Array, Effect, Option, pipe } from "effect";
import { matchPreferredLanguage } from "@/domain/helpers";
import { excerpt, experienceHeadline } from "@/features/experience/domain/helpers";

// meta (shared)
import { STATIC_PAGES, STATIC_PAGE_PATHS, staticPageCopy } from "@/features/meta/domain/pages";
import {
  DEFAULT_LANGUAGE,
  BRANDED_TITLE,
  CONTACT_PATH,
  DOWNLOADABLE_DOCUMENTS,
  EDUCATION_PATH,
  HOME_COUNTRY_NAME,
  HOME_LOCALITY,
  HOME_PATH,
  META_DESCRIPTION_LENGTH,
  SITE_NAME,
  SOCIAL_PROFILES,
} from "@/features/meta/domain/constants";
import {
  AI_INDEXES,
  absoluteUrl,
  experienceMarkdownPath,
  experiencePath,
  LLMS_TXT_INDEX,
  markdownTwinUrl,
  decodeUrlOption,
} from "@/features/meta/domain/links";

// types
import type { PagePath, PageTitles, PreferredLanguage, Translate } from "@/domain/models";
import type { EducationList } from "@/features/education/domain/models";
import type { Experience, ExperienceList } from "@/features/experience/domain/models";
import type { StaticPageCopy } from "@/features/meta/domain/pages";
import type {
  ContactMdInput,
  EducationMdInput,
  ExperienceLinesInput,
  ExperienceMdInput,
  HomeMdInput,
  NotFoundMdInput,
  PageTwin,
  TwinData,
  TwinEntry,
} from "./models";

// --- Markdown formatting primitives ---

const NORMALIZE_RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [/\r\n?/g, "\n"],
  [/\\/g, "\\\\"],
];

const INLINE_RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [/!(?=\[)/g, "\\!"],
  [/([`*[\]<])/g, "\\$1"],
];

const BLOCK_RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [/^(\s*)([#>])/gm, "$1\\$2"],
  [/^(\s*)([-+])(?=\s|$)/gm, "$1\\$2"],
  [/^(\s*)(\d+)([.)])(?=\s|$)/gm, "$1$2\\$3"],
  [/^(\s{0,3})([-_])(?=(?:\s*\2){2,}\s*$)/gm, "$1\\$2"],
  [/^(\s{0,3})([-=])(?=\2*\s*$)/gm, "$1\\$2"],
  [/^([\s|:]*?)(-)/gm, "$1\\$2"],
];

const WORD_RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [/(?<![\p{L}\p{N}])_|_(?![\p{L}\p{N}])/gu, "\\$&"],
  [/~~/g, "\\~\\~"],
  [/\n{3,}/g, "\n\n"],
];

const MD_ESCAPE_RULES = [...NORMALIZE_RULES, ...INLINE_RULES, ...BLOCK_RULES, ...WORD_RULES];
const DEMOTE_HEADINGS = /^(#{1,4})(?= )/gm;

export const escapeMd = (text: string) => {
  let result = text;
  for (const [pattern, replacement] of MD_ESCAPE_RULES) {
    result = result.replace(pattern, replacement);
  }
  return result.trim();
};

export const escapeMdInline = (text: string) => escapeMd(text.replace(/\n+/g, " "));
export const demoteHeadings = (markdown: string) => markdown.replace(DEMOTE_HEADINGS, (hashes) => `${hashes}##`);

const FRONTMATTER_DELIMITER = "---";
const YAML_UNSAFE_CHARACTERS = /[\u007f-\u009f\u2028\u2029]/g;

const yamlValue = (value: string) =>
  JSON.stringify(value).replace(YAML_UNSAFE_CHARACTERS, (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`);

export const frontmatter = (fields: Readonly<Record<string, string>>) => {
  const body = Object.entries(fields)
    .map(([key, value]) => `${key}: ${yamlValue(value)}`)
    .join("\n");
  return [FRONTMATTER_DELIMITER, body, FRONTMATTER_DELIMITER].join("\n");
};

export const mdHeading = (level: 1 | 2 | 3, text: string) => `${"#".repeat(level)} ${escapeMdInline(text)}`;
export const mdQuote = (text: string) => `> ${escapeMdInline(text)}`;
export const mdBulletList = (items: ReadonlyArray<string>) => items.map((item) => `- ${item}`).join("\n");
export const mdFact = (label: string, value: string) => `${escapeMdInline(label)}: ${escapeMdInline(value)}`;
export const mdBody = (blocks: ReadonlyArray<string>) => blocks.filter(Boolean).join("\n\n");
export const mdTitledSection = (title: string, body: string) => mdBody([mdHeading(2, title), body]);
export const mdDocument = (blocks: ReadonlyArray<string>) => `${mdBody(blocks)}\n`;
export const mdEmptyMarker = (translate: Translate) => `_${escapeMdInline(translate("No entries."))}_`;

export const mdLink = (label: string, href: string) => `[${escapeMdInline(label)}](${href})`;

export const translatedLink = (label: string, href: string, translate: Translate) => mdLink(translate(label), href);

export const mdIndexEntry = (label: string, canonical: string, twinUrl: string, summary?: string) => {
  const beforeTwin = summary === undefined ? "" : `${escapeMdInline(summary)} `;
  return `${mdLink(label, canonical)}: ${beforeTwin}Markdown: ${twinUrl}`;
};

// --- Source-language copy context ---

// Identity translate used for the English source documents published in AI indexes.
export const translateSource: Translate = (source) => source;

// English source rendering context (preferredLanguage + identity translate).
export const SOURCE_COPY = { preferredLanguage: DEFAULT_LANGUAGE, translate: translateSource };

// --- SEO / GEO identity helpers ---

export const twinIdentity = ({
  title,
  description,
  canonical,
  preferredLanguage,
}: {
  readonly title: string;
  readonly description: string;
  readonly canonical: string;
  readonly preferredLanguage: PreferredLanguage;
}) => ({
  title: BRANDED_TITLE(title),
  description,
  author: SITE_NAME,
  canonical,
  lang: preferredLanguage,
});

const externalLink = (label: string, href: string): Option.Option<string> =>
  pipe(
    decodeUrlOption(href),
    Option.filter((url) => url.protocol === "http:" || url.protocol === "https:"),
    Option.map((url) => mdLink(label, url.href))
  );

export const mdDocumentLinks = (documents: ReadonlyArray<{ readonly label: string; readonly href: string }>, translate: Translate) =>
  mdBulletList(documents.map(({ label, href }) => translatedLink(label, absoluteUrl(href), translate)));

export const mdProfileLinks = (profiles: ReadonlyArray<{ readonly name: string; readonly href: string }>) =>
  profiles.map(({ name, href }) => mdFact(name, href));

export const AI_INDEX_MARKDOWN_LINKS: ReadonlyArray<string> = AI_INDEXES.map(({ name, url }) => mdLink(name, url));

// --- Twin catalogue ---

const staticTwin = <Data>(pagePath: PagePath, spec: Omit<PageTwin<Data>, "pagePath" | "mdHref">): PageTwin<Data> => ({
  ...spec,
  pagePath,
  mdHref: STATIC_PAGES[pagePath].mdHref,
});

export const HOME_TWIN: PageTwin<{ readonly experienceList: ExperienceList }> = staticTwin(HOME_PATH, {
  name: "Home",
  summary: "portfolio overview with experience and project lists.",
  resolve: (datasets, preferredLanguage) =>
    Effect.map(datasets.experienceList(preferredLanguage), (experienceList) => ({ experienceList })),
  render: (pageTitles, { experienceList }, context) => buildHomeMd({ pageTitles, experienceList, ...context }),
});

export const EDUCATION_TWIN: PageTwin<{ readonly educationList: EducationList }> = staticTwin(EDUCATION_PATH, {
  name: "Education & Certificates",
  summary: "schools, courses and certificates.",
  resolve: (datasets, preferredLanguage) =>
    Effect.map(datasets.educationList(preferredLanguage), (educationList) => ({ educationList })),
  render: (pageTitles, { educationList }, context) => buildEducationMd({ pageTitles, educationList, ...context }),
});

export const CONTACT_TWIN: PageTwin<{}> = staticTwin(CONTACT_PATH, {
  name: "Contact",
  summary: "contact form, location and social profiles.",
  resolve: () => Effect.succeed({}),
  render: (pageTitles, _data, context) => buildContactMd({ pageTitles, ...context }),
});

export const PAGE_TWINS = [HOME_TWIN, EDUCATION_TWIN, CONTACT_TWIN] as const;

const twinEntry = ({
  name,
  canonicalPath,
  mdHref,
  summary,
  render,
}: {
  readonly name: string;
  readonly canonicalPath: string;
  readonly mdHref: string;
  readonly summary?: string;
  readonly render: (data: TwinData) => string;
}): TwinEntry => ({
  name,
  canonical: absoluteUrl(canonicalPath),
  twinUrl: markdownTwinUrl(mdHref, DEFAULT_LANGUAGE),
  summary,
  render,
});

// Static page entries for AI index publication.
export const PAGE_ENTRIES: ReadonlyArray<TwinEntry> = PAGE_TWINS.map((twin) =>
  twinEntry({
    name: twin.name,
    canonicalPath: twin.pagePath,
    mdHref: twin.mdHref,
    summary: twin.summary,
    render: (data) => twin.render(data.pageTitles, data, SOURCE_COPY),
  })
);

const experienceEntries = (experienceList: ExperienceList): ReadonlyArray<TwinEntry> =>
  experienceList.map((experience) =>
    twinEntry({
      name: experienceHeadline(experience, DEFAULT_LANGUAGE),
      canonicalPath: experiencePath(experience.slug),
      mdHref: experienceMarkdownPath(experience.slug),
      render: () => buildExperienceMd({ experience, ...SOURCE_COPY }),
    })
  );

// All static and detail entries in index order.
export const allEntries = (experienceList: ExperienceList): ReadonlyArray<TwinEntry> => [
  ...PAGE_ENTRIES,
  ...experienceEntries(experienceList),
];

// --- Twin navigation ---

const homeLink = (preferredLanguage: PreferredLanguage, translate: Translate) =>
  translatedLink(STATIC_PAGES[HOME_PATH].label, markdownTwinUrl(STATIC_PAGES[HOME_PATH].mdHref, preferredLanguage), translate);

// Sibling twins for a static page, plus the two AI indexes; a page never links itself.
export const twinIndexLinks = (pagePath: PagePath, preferredLanguage: PreferredLanguage, translate: Translate) =>
  mdBulletList([
    ...STATIC_PAGE_PATHS.filter((path) => path !== pagePath).map((path) =>
      translatedLink(STATIC_PAGES[path].label, markdownTwinUrl(STATIC_PAGES[path].mdHref, preferredLanguage), translate)
    ),
    ...AI_INDEX_MARKDOWN_LINKS,
  ]);

const detailIndexLinks = (preferredLanguage: PreferredLanguage, translate: Translate) =>
  mdBulletList([homeLink(preferredLanguage, translate), ...AI_INDEX_MARKDOWN_LINKS]);

const deadEndEscapeLine = (preferredLanguage: PreferredLanguage, translate: Translate) => {
  const indexLink = mdLink("llms.txt", LLMS_TXT_INDEX.url);
  return `${escapeMdInline(translate("See"))} ${homeLink(preferredLanguage, translate)} ${escapeMdInline(translate("or"))} ${indexLink}.`;
};

// --- Experience documents ---

const LIST_EXCERPT_LENGTH = 140;

// Builds a list line for a twin page or a canonical HTML index entry.
const experienceLine = (experience: Experience, preferredLanguage: PreferredLanguage, entry: ExperienceLinesInput["entry"]) => {
  const headline = experienceHeadline(experience, preferredLanguage);
  const summary = `${excerpt(experience.txt, LIST_EXCERPT_LENGTH)} (${experience.year})`;
  const twin = markdownTwinUrl(experienceMarkdownPath(experience.slug), preferredLanguage);

  return entry === "twin"
    ? `${mdLink(headline, twin)}: ${escapeMdInline(summary)}`
    : mdIndexEntry(headline, absoluteUrl(experiencePath(experience.slug)), twin, summary);
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
    optionalBulletLink(translate("GitHub Repo"), experience.gitHubLink),
    optionalBulletLink(translate("Live Link"), experience.liveLink),
    optionalBulletLink(translate("Watch Video"), experience.videoLink),
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
    mdTitledSection(translate("Overview"), escapeMd(txt)),
    mdTitledSection(
      translate("Details"),
      mdBulletList([mdFact(translate("Role"), role), mdFact(translate("Company"), company), mdFact(translate("Year"), year)])
    ),
    mdTitledSection(translate("Skills Used"), mdBulletList(skillsUsed.map(escapeMdInline))),
    ...(links.length > 0 ? [mdTitledSection(translate("Links"), mdBulletList(links))] : []),
    mdTitledSection(translate("Pages"), detailIndexLinks(preferredLanguage, translate)),
  ]);
};

// --- Static page documents ---

const profileLinks = (translate: Translate) => [
  ...mdProfileLinks(SOCIAL_PROFILES),
  mdFact(translate("Base"), translate(`${HOME_LOCALITY}, ${HOME_COUNTRY_NAME}`)),
];

// Shared identity header and pull quote for static page twins.
const pageOpening = (copy: StaticPageCopy) => [
  frontmatter({
    ...twinIdentity({
      title: copy.seoTitle,
      description: copy.description,
      canonical: copy.canonical,
      preferredLanguage: copy.preferredLanguage,
    }),
    type: copy.type,
  }),
  mdHeading(1, copy.pageName),
  mdQuote(copy.description),
];

const schoolSections = (educationList: EducationList, translate: Translate) =>
  mdTitledSection(
    translate("Education"),
    educationList.length === 0
      ? mdEmptyMarker(translate)
      : mdBody(
          educationList.map(({ name, year, location, info }) =>
            mdBody([mdHeading(3, name), mdBulletList([mdFact(translate("Years"), year), mdFact(translate("Location"), location)]), escapeMd(info)])
          )
        )
  );

const documentsSection = (translate: Translate) => mdTitledSection(translate("Documents"), mdDocumentLinks(DOWNLOADABLE_DOCUMENTS, translate));

const contactChannels = (canonical: string, translate: Translate) =>
  mdTitledSection(
    translate("Channels"),
    mdBulletList([
      `${escapeMdInline(translate("Contact Form"))}: ${canonical} (${escapeMdInline(translate("same page in HTML"))})`,
      ...profileLinks(translate),
    ])
  );

const pagesSection = (copy: StaticPageCopy, translate: Translate) =>
  mdTitledSection(translate("Pages"), twinIndexLinks(copy.path, copy.preferredLanguage, translate));

const staticTwinDocument = (
  pageTitles: PageTitles,
  pagePath: PagePath,
  preferredLanguage: PreferredLanguage,
  translate: Translate,
  sections: ReadonlyArray<string>
) => {
  const copy = staticPageCopy(pageTitles, pagePath, preferredLanguage);

  return mdDocument([...pageOpening(copy), escapeMd(copy.intro), ...sections, pagesSection(copy, translate)]);
};

export const buildHomeMd = ({ pageTitles, experienceList, preferredLanguage, translate }: HomeMdInput) =>
  staticTwinDocument(pageTitles, HOME_PATH, preferredLanguage, translate, [
    mdTitledSection(translate("Experience"), experienceLines({ experienceList, type: "e", translate, preferredLanguage, entry: "twin" })),
    mdTitledSection(translate("Portfolio Projects"), experienceLines({ experienceList, type: "p", translate, preferredLanguage, entry: "twin" })),
  ]);

export const buildEducationMd = ({ pageTitles, educationList, preferredLanguage, translate }: EducationMdInput) =>
  staticTwinDocument(pageTitles, EDUCATION_PATH, preferredLanguage, translate, [schoolSections(educationList, translate), documentsSection(translate)]);

export const buildContactMd = ({ pageTitles, preferredLanguage, translate }: ContactMdInput) =>
  staticTwinDocument(pageTitles, CONTACT_PATH, preferredLanguage, translate, [contactChannels(absoluteUrl(CONTACT_PATH), translate)]);

const detailOf = (slug: Option.Option<string>) => Option.map(slug, (value) => ({ slug: escapeMdInline(value), path: escapeMdInline(experiencePath(value)) }));

// Builds a structured Markdown 404 document with graph escape links.
export const buildNotFoundMd = ({ slug, preferredLanguage, translate }: NotFoundMdInput) => {
  const title = translate("Not Found");
  const detail = detailOf(slug);

  const description = Option.match(detail, {
    onNone: () => matchPreferredLanguage(preferredLanguage, "No page for this address.", "Nie znaleziono strony dla tego adresu."),
    onSome: ({ slug: s }) => matchPreferredLanguage(preferredLanguage, `No page for slug "${s}".`, `Nie znaleziono strony dla identyfikatora "${s}".`),
  });

  const missing = Option.match(detail, {
    onNone: () => matchPreferredLanguage(preferredLanguage, "No Markdown document exists for this address.", "Dokument Markdown dla tego adresu nie istnieje."),
    onSome: ({ path }) =>
      matchPreferredLanguage(preferredLanguage, `No Markdown document exists for ${path}.`, `Dokument Markdown dla adresu ${path} nie istnieje.`),
  });

  return mdDocument([
    frontmatter({ title, description, lang: preferredLanguage, author: SITE_NAME }),
    mdHeading(1, title),
    missing,
    deadEndEscapeLine(preferredLanguage, translate),
  ]);
};

// 503 fallback body for Markdown twins when required portfolio data is unavailable.
export const unavailableMarkdownBody = (translate: Translate) =>
  mdDocument([
    mdHeading(1, translate("Content temporarily unavailable")),
    escapeMd(translate("The required portfolio content could not be loaded. Please try again shortly.")),
  ]);

// Formats an optional web link as a bullet item; non-http/https URLs are omitted.
const optionalBulletLink = (label: string, href: string | undefined) =>
  pipe(
    Option.fromNullishOr(href),
    Option.flatMap((validHref) => externalLink(label, validHref))
  );
