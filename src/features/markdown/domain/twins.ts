// services, features, and other libraries
import { partitionExperiences } from "@/features/experience/domain/helpers";
import { staticPageCopy } from "@/features/meta/domain/pages";
import { experienceLines } from "./experience-lines";
import { pageFacts } from "./copy";
import { pagesSection } from "./twin-nav";
import { mdBody, mdBulletList, mdDocument, mdDocumentLinks, mdEmptyMarker, mdFact, mdHeading, mdProfileLinks, mdQuote, mdTitledSection } from "./format";
import { escapeMd } from "./escape";

// types
import type { StaticPageCopy } from "@/features/meta/domain/models";
import type { PagePath, PageTitles, Translate } from "@/domain/models";
import type { EducationList } from "@/features/education/domain/models";
import type { ContactMdInput, EducationMdInput, HomeMdInput, LocalizedMdInput, MarkdownTwin } from "./models";

// constants
import { CONTACT_PATH, EDUCATION_PATH, HOME_PATH } from "@/domain/constants";
import { DOWNLOADABLE_DOCUMENTS, HOME_LOCATION, SOCIAL_PROFILES } from "@/features/meta/domain/constants";

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

export const buildHomeMd = (input: HomeMdInput): MarkdownTwin => {
  const { translate, experienceList, preferredLanguage } = input;
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

// 503 fallback body served when required portfolio data is unavailable
export const unavailableMarkdownBody = (translate: Translate): string =>
  mdDocument([
    mdHeading(1, translate("Content temporarily unavailable")),
    escapeMd(translate("The required portfolio content could not be loaded. Please try again shortly.")),
  ]);
