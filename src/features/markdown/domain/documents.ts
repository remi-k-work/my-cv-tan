// Markdown twin documents: page and experience builders, fallback documents, and the publication catalogue.

// services, features, and other libraries
import { Array, Effect, Option, pipe } from "effect";
import { msg } from "gt-tanstack-start";
import { matchPreferredLanguage } from "@/domain/helpers";
import { excerpt, experienceHeadline } from "@/features/experience/domain/helpers";
import { staticPageCopy, STATIC_PAGE_PATHS, STATIC_PAGES } from "@/features/meta/domain/static-pages";
import { absoluteUrl, AI_INDEXES, experienceMarkdownPath, experiencePath, LLMS_TXT_INDEX, markdownTwinUrl } from "@/features/meta/domain/helpers";
import {
  escapeMd,
  escapeMdInline,
  frontmatter,
  mdBody,
  mdBulletList,
  mdDocument,
  mdDocumentLinks,
  mdEmptyMarker,
  mdExternalLink,
  mdFact,
  mdHeading,
  mdIndexEntry,
  mdLink,
  mdProfileLinks,
  mdQuote,
  mdTitledSection,
  SOURCE_COPY,
  translatedLink,
  twinIdentity,
} from "./formatting";

// types
import type { PagePath, PageTitles, PreferredLanguage, Translate } from "@/domain/models";
import type { EducationList } from "@/features/education/domain/models";
import type { Experience, ExperienceList } from "@/features/experience/domain/models";
import type { StaticPageCopy } from "@/features/meta/domain/models";
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

// constants
import {
  CONTACT_PATH,
  DEFAULT_LANGUAGE,
  DOWNLOADABLE_DOCUMENTS,
  EDUCATION_PATH,
  HOME_PATH,
  META_DESCRIPTION_LENGTH,
  SITE_NAME,
  SOCIAL_PROFILES,
} from "@/features/meta/domain/constants";

// --- Twin navigation ---

export const AI_INDEX_MARKDOWN_LINKS: ReadonlyArray<string> = AI_INDEXES.map(({ name, url }) => mdLink(name, url));

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
  return `${escapeMdInline(translate(msg("See")))} ${homeLink(preferredLanguage, translate)} ${escapeMdInline(translate(msg("or")))} ${indexLink}.`;
};

// --- Experience documents ---

const LIST_EXCERPT_LENGTH = 140;

// Formats an optional web link as a bullet item; non-http/https URLs are omitted.
const optionalBulletLink = (label: string, href: string | undefined) =>
  pipe(
    Option.fromNullishOr(href),
    Option.flatMap((validHref) => mdExternalLink(label, validHref))
  );

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
    optionalBulletLink(translate(msg("GitHub Repo")), experience.gitHubLink),
    optionalBulletLink(translate(msg("Live Link")), experience.liveLink),
    optionalBulletLink(translate(msg("Watch Video")), experience.videoLink),
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
    mdTitledSection(translate(msg("Overview")), escapeMd(txt)),
    mdTitledSection(
      translate(msg("Details")),
      mdBulletList([mdFact(translate(msg("Role")), role), mdFact(translate(msg("Company")), company), mdFact(translate(msg("Year")), year)])
    ),
    mdTitledSection(translate(msg("Skills Used")), mdBulletList(skillsUsed.map(escapeMdInline))),
    ...(links.length > 0 ? [mdTitledSection(translate(msg("Links")), mdBulletList(links))] : []),
    mdTitledSection(translate(msg("Pages")), detailIndexLinks(preferredLanguage, translate)),
  ]);
};

// --- Static page documents ---

const profileLinks = (translate: Translate) => [...mdProfileLinks(SOCIAL_PROFILES), mdFact(translate(msg("Base")), translate(msg("Rzeszów, Poland")))];

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
    translate(msg("Education")),
    educationList.length === 0
      ? mdEmptyMarker(translate)
      : mdBody(
          educationList.map(({ name, year, location, info }) =>
            mdBody([mdHeading(3, name), mdBulletList([mdFact(translate(msg("Years")), year), mdFact(translate(msg("Location")), location)]), escapeMd(info)])
          )
        )
  );

const documentsSection = (translate: Translate) => mdTitledSection(translate(msg("Documents")), mdDocumentLinks(DOWNLOADABLE_DOCUMENTS, translate));

const contactChannels = (canonical: string, translate: Translate) =>
  mdTitledSection(
    translate(msg("Channels")),
    mdBulletList([
      `${escapeMdInline(translate(msg("Contact Form")))}: ${canonical} (${escapeMdInline(translate(msg("same page in HTML")))})`,
      ...profileLinks(translate),
    ])
  );

const pagesSection = (copy: StaticPageCopy, translate: Translate) =>
  mdTitledSection(translate(msg("Pages")), twinIndexLinks(copy.path, copy.preferredLanguage, translate));

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
    mdTitledSection(translate(msg("Experience")), experienceLines({ experienceList, type: "e", translate, preferredLanguage, entry: "twin" })),
    mdTitledSection(translate(msg("Portfolio Projects")), experienceLines({ experienceList, type: "p", translate, preferredLanguage, entry: "twin" })),
  ]);

export const buildEducationMd = ({ pageTitles, educationList, preferredLanguage, translate }: EducationMdInput) =>
  staticTwinDocument(pageTitles, EDUCATION_PATH, preferredLanguage, translate, [schoolSections(educationList, translate), documentsSection(translate)]);

export const buildContactMd = ({ pageTitles, preferredLanguage, translate }: ContactMdInput) =>
  staticTwinDocument(pageTitles, CONTACT_PATH, preferredLanguage, translate, [contactChannels(absoluteUrl(CONTACT_PATH), translate)]);

const detailOf = (slug: Option.Option<string>) => Option.map(slug, (value) => ({ slug: escapeMdInline(value), path: escapeMdInline(experiencePath(value)) }));

// Builds a structured Markdown 404 document with graph escape links.
export const buildNotFoundMd = ({ slug, preferredLanguage, translate }: NotFoundMdInput) => {
  const title = translate(msg("Not Found"));
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
    mdHeading(1, translate(msg("Content temporarily unavailable"))),
    escapeMd(translate(msg("The required portfolio content could not be loaded. Please try again shortly."))),
  ]);

// --- Twin catalogue ---

const staticTwin = <Data>(pagePath: PagePath, spec: Omit<PageTwin<Data>, "pagePath" | "mdHref">): PageTwin<Data> => ({
  ...spec,
  pagePath,
  mdHref: STATIC_PAGES[pagePath].mdHref,
});

export const HOME_TWIN: PageTwin<{ readonly experienceList: ExperienceList }> = staticTwin(HOME_PATH, {
  name: "Home",
  summary: "portfolio overview with experience and project lists.",
  resolve: (datasets, preferredLanguage) => Effect.map(datasets.experienceList(preferredLanguage), (experienceList) => ({ experienceList })),
  render: (pageTitles, { experienceList }, context) => buildHomeMd({ pageTitles, experienceList, ...context }),
});

export const EDUCATION_TWIN: PageTwin<{ readonly educationList: EducationList }> = staticTwin(EDUCATION_PATH, {
  name: "Education & Certificates",
  summary: "schools, courses and certificates.",
  resolve: (datasets, preferredLanguage) => Effect.map(datasets.educationList(preferredLanguage), (educationList) => ({ educationList })),
  render: (pageTitles, { educationList }, context) => buildEducationMd({ pageTitles, educationList, ...context }),
});

export const CONTACT_TWIN: PageTwin<{}> = staticTwin(CONTACT_PATH, {
  name: "Contact",
  summary: "contact form, location and social profiles.",
  resolve: () => Effect.succeed({}),
  render: (pageTitles, _data, context) => buildContactMd({ pageTitles, ...context }),
});

export const PAGE_TWINS = [HOME_TWIN, EDUCATION_TWIN, CONTACT_TWIN] as const;

const twinEntry = (input: {
  readonly name: string;
  readonly canonicalPath: string;
  readonly mdHref: string;
  readonly summary?: string;
  readonly render: (data: TwinData) => string;
}): TwinEntry => ({
  name: input.name,
  canonical: absoluteUrl(input.canonicalPath),
  twinUrl: markdownTwinUrl(input.mdHref, DEFAULT_LANGUAGE),
  summary: input.summary,
  render: input.render,
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
export const allEntries = (experienceList: ExperienceList): ReadonlyArray<TwinEntry> => [...PAGE_ENTRIES, ...experienceEntries(experienceList)];
