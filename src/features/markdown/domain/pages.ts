// Page Markdown twins: home, education, contact, and not-found.

// services, features, and other libraries
import { Option } from "effect";
import { msg } from "gt-tanstack-start";
import { matchPreferredLanguage } from "@/domain/helpers";
import {
  escapeMd,
  escapeMdInline,
  deadEndEscapeLine,
  frontmatter,
  mdBody,
  mdBulletList,
  mdDocument,
  mdDocumentLinks,
  mdEmptyMarker,
  mdFact,
  mdHeading,
  mdProfileLinks,
  mdQuote,
  mdTitledSection,
  twinIdentity,
  twinIndexLinks,
} from "./formatting";
import { experienceLines } from "./experience";
import { staticPageCopy } from "@/features/meta/domain/static-pages";
import { absoluteUrl, experiencePath } from "@/features/meta/domain/url";

// types
import type { PagePath, PageTitles, PreferredLanguage, Translate } from "@/domain/models";
import type { BuildNotFoundMdInput, ContactMdInput, EducationMdInput, HomeMdInput } from "./models";
import type { EducationList } from "@/features/education/domain/models";
import type { StaticPageCopy } from "@/features/meta/domain/static-pages";

// constants
import { SITE_NAME, SOCIAL_PROFILES } from "@/features/meta/domain/constants";
import { DOWNLOADABLE_DOCUMENTS } from "./constants";
import { CONTACT_PATH, EDUCATION_PATH, HOME_PATH } from "@/features/meta/domain/static-pages";

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

const pagesSection = (copy: StaticPageCopy, translate: Translate) => mdTitledSection(translate(msg("Pages")), twinIndexLinks(copy, translate));

// Shared document spine for static twins.
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
export const buildNotFoundMd = ({ slug, preferredLanguage, translate }: BuildNotFoundMdInput) => {
  const title = translate(msg("Not Found"));
  const detail = detailOf(slug);

  const description = Option.match(detail, {
    onNone: () => matchPreferredLanguage(preferredLanguage, "No page for this address.", "Nie znaleziono strony dla tego adresu."),
    onSome: ({ slug }) => matchPreferredLanguage(preferredLanguage, `No page for slug "${slug}".`, `Nie znaleziono strony dla identyfikatora "${slug}".`),
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
