// services, features, and other libraries
import { Array } from "effect";
import { partitionExperiences } from "@/features/experience/domain/helpers";
import { staticPageCopy } from "@/features/meta/domain/pages";
import { pagesSection } from "./twin-nav";
import { mdBody, mdBulletList, mdDocument, mdDocumentLinks, mdEmptyMarker, mdFact, mdHeading, mdProfileLinks, mdQuote, mdTitledSection } from "./format";
import { escapeMd } from "./escape";
import { pageFacts } from "./identity";
import { experienceLines } from "./listings";

// types
import type { StaticPageCopy } from "@/features/meta/domain/models";
import type { PagePath, PageTitles, Translate } from "@/domain/models";
import type { EducationList } from "@/features/education/domain/models";
import type { ExperienceList } from "@/features/experience/domain/models";
import type { TwinContext } from "./models";

// What each twin builder reads, named so the tests and any other caller can spell the input
// without recomputing it from the builder's own signature
export type HomeMdInput = TwinContext & { readonly pageTitles: PageTitles; readonly experienceList: ExperienceList };
export type EducationMdInput = TwinContext & { readonly pageTitles: PageTitles; readonly educationList: EducationList };
export type ContactMdInput = TwinContext & { readonly pageTitles: PageTitles };

// constants
import { CONTACT_PATH, EDUCATION_PATH, HOME_PATH } from "@/domain/constants";
import { DOWNLOADABLE_DOCUMENTS } from "@/features/meta/domain/discovery";
import { HOME_LOCATION, SOCIAL_PROFILES } from "@/features/meta/domain/site";

const profileLinks = (translate: Translate) => [...mdProfileLinks(SOCIAL_PROFILES), mdFact(translate("Base"), translate(HOME_LOCATION))];

const schoolSections = (educationList: EducationList, translate: Translate) =>
  mdTitledSection(
    translate("Education"),
    // The two arms are the whole decision, so matching on emptiness names it instead of leaving a
    // length read for the reader to interpret
    Array.match(educationList, {
      onEmpty: () => mdEmptyMarker(translate),
      onNonEmpty: (entries) =>
        mdBody(
          Array.map(entries, ({ name, year, location, info }) =>
            mdBody([mdHeading(3, name), mdBulletList([mdFact(translate("Years"), year), mdFact(translate("Location"), location)]), escapeMd(info)])
          )
        ),
    })
  );

const documentsSection = (translate: Translate) => mdTitledSection(translate("Documents"), mdDocumentLinks(DOWNLOADABLE_DOCUMENTS, translate));

const contactChannels = (canonical: string, translate: Translate) =>
  mdTitledSection(
    translate("Channels"),
    mdBulletList([mdFact(translate("Contact Form"), `${canonical} (${translate("same page in HTML")})`), ...profileLinks(translate)])
  );

const staticTwinDocument = (
  input: TwinContext & { readonly pageTitles: PageTitles },
  pagePath: PagePath,
  sections: (copy: StaticPageCopy) => ReadonlyArray<string>
) => {
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

export const buildHomeMd = (input: HomeMdInput) => {
  const { translate, experienceList, preferredLanguage } = input;
  const [employment, projects] = partitionExperiences(experienceList);

  return staticTwinDocument(input, HOME_PATH, () => [
    mdTitledSection(translate("Experience"), experienceLines({ experiences: employment, translate, preferredLanguage, mode: "twin" })),
    mdTitledSection(translate("Portfolio Projects"), experienceLines({ experiences: projects, translate, preferredLanguage, mode: "twin" })),
  ]);
};

export const buildEducationMd = (input: EducationMdInput) => {
  const { translate, educationList } = input;
  return staticTwinDocument(input, EDUCATION_PATH, () => [schoolSections(educationList, translate), documentsSection(translate)]);
};

export const buildContactMd = (input: ContactMdInput) => {
  const { translate } = input;
  return staticTwinDocument(input, CONTACT_PATH, (copy) => [contactChannels(copy.canonical, translate)]);
};

// 503 fallback body served when required portfolio data is unavailable
export const unavailableMarkdownBody = (translate: Translate) =>
  mdDocument([
    mdHeading(1, translate("Content temporarily unavailable")),
    escapeMd(translate("The required portfolio content could not be loaded. Please try again shortly.")),
  ]);
