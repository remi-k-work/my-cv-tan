// Markdown twin document builders: the shared source-language context, SEO identity, twin
// navigation, and the per-page documents. The twin catalogue lives in ./catalogue; the
// security-sensitive formatting primitives live in ./format.

// services, features, and other libraries
import { Array, Option, pipe } from "effect";
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
  SITE_NAME,
  SOCIAL_PROFILES,
} from "@/features/meta/domain/constants";
import { experienceSeo } from "@/features/meta/domain/experience-seo";
import {
  absoluteUrl,
  decodeUrlOption,
  experienceMarkdownPath,
  experiencePath,
  LLMS_TXT_INDEX,
  markdownTwinUrl,
} from "@/features/meta/domain/links";

// formatting primitives
import {
  AI_INDEX_MARKDOWN_LINKS,
  escapeMd,
  escapeMdInline,
  frontmatter,
  mdBody,
  mdBulletList,
  mdDocument,
  mdDocumentLinks,
  mdEmptyMarker,
  mdFact,
  mdHeading,
  mdIndexEntry,
  mdLink,
  mdProfileLinks,
  mdQuote,
  mdTitledSection,
  translatedLink,
} from "./format";

// types
import type { PagePath, PageTitles, PreferredLanguage, Translate } from "@/domain/models";
import type { EducationList } from "@/features/education/domain/models";
import type { Experience } from "@/features/experience/domain/models";
import type { StaticPageCopy } from "@/features/meta/domain/models";
import type {
  ContactMdInput,
  EducationMdInput,
  ExperienceLinesInput,
  ExperienceMdInput,
  HomeMdInput,
  NotFoundMdInput,
} from "./models";

// --- Source-language copy context ---

// Identity translate used for the English source documents published in AI indexes.
export const translateSource: Translate = (source) => source;

// English source rendering context (preferredLanguage + identity translate).
export const SOURCE_COPY = { preferredLanguage: DEFAULT_LANGUAGE, translate: translateSource };

// --- SEO / GEO identity helpers ---

const twinIdentity = ({
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

// Formats an optional web link as a bullet item; non-http/https URLs are omitted.
const optionalBulletLink = (label: string, href: string | undefined) =>
  pipe(
    Option.fromNullishOr(href),
    Option.flatMap((validHref) => externalLink(label, validHref))
  );

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
  const indexLink = mdLink(LLMS_TXT_INDEX.name, LLMS_TXT_INDEX.url);
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
  const { role, company, txt, skillsUsed, year } = experience;
  const { canonical, headline, description } = experienceSeo({ experience, preferredLanguage });

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

// The raw slug is quoted inside YAML frontmatter; the path is escaped for the Markdown body.
const detailOf = (slug: Option.Option<string>) => Option.map(slug, (value) => ({ slug: value, path: escapeMdInline(experiencePath(value)) }));

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
