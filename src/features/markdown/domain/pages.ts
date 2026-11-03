// Static page Markdown twins: home, education, and contact.
import { Array } from "effect";
import { msg } from "gt-tanstack-start";
import { escapeMd, escapeMdInline } from "./text";
import { frontmatter, mdBody, mdBulletList, mdDocument, mdDocumentLinks, mdEmptyMarker, mdFact, mdHeading, mdProfileLinks, mdQuote, mdTitledSection, twinIdentity } from "./blocks";
import { experienceLines } from "./experience";
import { twinIndexLinks } from "./document-graph";
import { staticPageCopy, CONTACT_PATH, EDUCATION_PATH, HOME_PATH, type StaticPageCopy } from "@/features/meta/domain/static-pages";
import { absoluteUrl } from "@/features/meta/domain/url";

// types
import type { PagePath, PageTitles, PreferredLanguage, Translate } from "@/domain/models";
import type { ContactMdInput, EducationMdInput, HomeMdInput } from "./models";
import type { EducationList } from "@/features/education/domain/models";

// constants
import { SOCIAL_PROFILES } from "@/features/meta/domain/constants";
import { DOWNLOADABLE_DOCUMENTS } from "./constants";

const profileLinks = (translate: Translate) => [
  ...mdProfileLinks(SOCIAL_PROFILES),
  mdFact(translate(msg("Base")), translate(msg("Rzeszów, Poland"))),
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
    translate(msg("Education")),
    Array.match(educationList, {
      onEmpty: () => mdEmptyMarker(translate),
      onNonEmpty: (schools) =>
        mdBody(
          Array.map(schools, ({ name, year, location, info }) =>
            mdBody([mdHeading(3, name), mdBulletList([mdFact(translate(msg("Years")), year), mdFact(translate(msg("Location")), location)]), escapeMd(info)])
          )
        ),
    })
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
const staticTwinDocument = (pageTitles: PageTitles, pagePath: PagePath, preferredLanguage: PreferredLanguage, translate: Translate, sections: ReadonlyArray<string>) => {
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
