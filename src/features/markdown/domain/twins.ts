// Markdown twin documents for the three static pages (home, education, contact): the shared frame
// every static twin renders through and the sections that frame prints. The experience listing lines
// both these twins and the AI indexes render live in ./experience-lines, so the two surfaces cannot
// group, order or trim content differently. The detail twin and the 404 twin live in ./detail-twin,
// the AI index documents in ./indexes, and the crawl graph the twins link through in ./twin-nav.

// services, features, and other libraries
import { CONTACT_PATH, EDUCATION_PATH, HOME_PATH } from "@/domain/constants";
import { partitionExperiences } from "@/features/experience/domain/helpers";

// meta (shared)
import { staticPageCopy } from "@/features/meta/domain/pages";
import type { StaticPageCopy } from "@/features/meta/domain/pages";
import { HOME_LOCATION, SOCIAL_PROFILES } from "@/features/meta/domain/identity";
import { DOWNLOADABLE_DOCUMENTS } from "@/features/meta/domain/discovery";

// domain
import { experienceLines } from "./experience-lines";
import { pageFacts } from "./copy";
import { pagesSection } from "./twin-nav";

// formatting primitives
import { escapeMd } from "./escape";
import { mdBody, mdBulletList, mdDocument, mdDocumentLinks, mdEmptyMarker, mdFact, mdHeading, mdProfileLinks, mdQuote, mdTitledSection } from "./format";

// types
import type { PagePath, PageTitles, Translate } from "@/domain/models";
import type { EducationList } from "@/features/education/domain/models";
import type { ContactMdInput, EducationMdInput, HomeMdInput, LocalizedMdInput, MarkdownTwin } from "./models";

// --- Sections the static twins print ---

const profileLinks = (translate: Translate) => [...mdProfileLinks(SOCIAL_PROFILES), mdFact(translate("Base"), translate(HOME_LOCATION))];

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
    mdBulletList([mdFact(translate("Contact Form"), `${canonical} (${translate("same page in HTML")})`), ...profileLinks(translate)])
  );

// --- Shared static-pages frame ---

// The shared static-pages frame: the identity facts every twin carries, then the page's heading,
// description, intro, its own sections, and the sibling-twin index. Sections render from the copy
// the frame already resolved, so a section that needs the page's canonical reads the one value the
// frontmatter also publishes instead of deriving a second.
const staticTwinDocument = (
  input: LocalizedMdInput & { readonly pageTitles: PageTitles },
  pagePath: PagePath,
  sections: (copy: StaticPageCopy) => ReadonlyArray<string>
): MarkdownTwin => {
  const copy = staticPageCopy(input.pageTitles, pagePath, input.preferredLanguage);

  return {
    facts: pageFacts(copy),
    body: mdBody([
      mdHeading(1, copy.pageName),
      mdQuote(copy.description),
      escapeMd(copy.intro),
      ...sections(copy),
      pagesSection(copy.path, copy.preferredLanguage, input.translate),
    ]),
  };
};

// --- Static page twins ---

export const buildHomeMd = (input: HomeMdInput): MarkdownTwin => {
  const { translate, experienceList, preferredLanguage } = input;
  // One split for both listings — the same one-pass partition the home sliders and the home
  // JSON-LD collections use — so the Markdown listing can never group an experience differently
  // from the page it renders.
  const [employment, projects] = partitionExperiences(experienceList);

  return staticTwinDocument(input, HOME_PATH, () => [
    mdTitledSection(translate("Experience"), experienceLines({ experiences: employment, translate, preferredLanguage, entry: "twin" })),
    mdTitledSection(translate("Portfolio Projects"), experienceLines({ experiences: projects, translate, preferredLanguage, entry: "twin" })),
  ]);
};

export const buildEducationMd = (input: EducationMdInput): MarkdownTwin => {
  const { translate, educationList } = input;

  return staticTwinDocument(input, EDUCATION_PATH, () => [schoolSections(educationList, translate), documentsSection(translate)]);
};

export const buildContactMd = (input: ContactMdInput): MarkdownTwin => {
  const { translate } = input;

  return staticTwinDocument(input, CONTACT_PATH, (copy) => [contactChannels(copy.canonical, translate)]);
};

// 503 fallback body for a Markdown twin when its required portfolio data is unavailable. A degraded
// document is not a twin: it carries no identity facts, only the notice and its escape.
export const unavailableMarkdownBody = (translate: Translate): string =>
  mdDocument([
    mdHeading(1, translate("Content temporarily unavailable")),
    escapeMd(translate("The required portfolio content could not be loaded. Please try again shortly.")),
  ]);
