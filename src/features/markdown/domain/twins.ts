// services, features, and other libraries
import { Array, Option, pipe } from "effect";
import { msg } from "gt-i18n";
import { isEmployment, partitionExperiences } from "@/features/experience/domain/helpers";
import { staticPageCopy } from "@/features/meta/domain/pages";
import { experienceKeywords, experienceLinks, inlineText } from "@/features/meta/domain/seo";
import { experienceLines } from "./catalogue";
import { escapeMd, escapeMdInline } from "./escape";
import { mdBody, mdBulletList, mdDocumentLinks, mdEmptyMarker, mdFact, mdHeading, mdLink, mdProfileLinks, mdQuote, mdTitledSection } from "./format";
import { pageFacts, twinIdentity } from "./models";
import { canonicalSourceLink, detailPagesSection, pagesSection } from "./twin-nav";

// types
import type { PagePath, PageTitles, Translate } from "@/domain/models";
import type { EducationList } from "@/features/education/domain/models";
import type { ExperienceList } from "@/features/experience/domain/models";
import type { ExperienceContent, StaticPageCopy } from "@/features/meta/domain/models";
import type { MarkdownTwin, PageDocumentContent, TwinContext } from "./models";

export type HomeMdInput = TwinContext & { readonly pageTitles: PageTitles; readonly experienceList: ExperienceList };
export type EducationMdInput = TwinContext & { readonly pageTitles: PageTitles; readonly educationList: EducationList };
export type ContactMdInput = TwinContext & { readonly pageTitles: PageTitles };

interface ExperienceMdInput extends Pick<TwinContext, "translate" | "includeNavigation"> {
  readonly seo: ExperienceContent;
}

type PageDocumentBuilder<P extends PagePath> = (content: PageDocumentContent[P], context: TwinContext) => MarkdownTwin;

// constants
import { CONTACT_PATH, EDUCATION_PATH, HOME_PATH } from "@/domain/constants";
import { DOWNLOADABLE_DOCUMENTS } from "@/features/meta/domain/discovery";
import { CONTACT_EMAIL, HOME_LOCATION, SOCIAL_PROFILES } from "@/features/meta/domain/site";

// Standalone twins carry their canonical citation and sibling nav; embedded companion twins omit them
const navBlock = (includeNavigation: boolean, render: () => string) => (includeNavigation ? render() : "");

const profileLinks = (translate: Translate) => [...mdProfileLinks(SOCIAL_PROFILES), mdFact(translate(msg("Base")), translate(HOME_LOCATION))];

const schoolSections = (educationList: EducationList, translate: Translate) =>
  mdTitledSection(
    translate(msg("Education")),
    Array.match(educationList, {
      onEmpty: () => mdEmptyMarker(translate),
      onNonEmpty: (entries) =>
        mdBody(
          Array.map(entries, ({ name, year, location, info }) =>
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
      `${mdLink(translate(msg("Contact Form")), canonical)} (${escapeMdInline(translate(msg("same page in HTML")))})`,
      mdFact("Email", CONTACT_EMAIL),
      ...profileLinks(translate),
    ])
  );

const staticTwinDocument = (
  { pageTitles, preferredLanguage, translate, includeNavigation = true }: TwinContext & { readonly pageTitles: PageTitles },
  pagePath: PagePath,
  sections: (copy: StaticPageCopy) => ReadonlyArray<string>
): MarkdownTwin => {
  const copy = staticPageCopy(pageTitles, pagePath, preferredLanguage);

  return {
    facts: pageFacts(copy),
    body: mdBody([
      mdHeading(1, copy.pageName),
      mdQuote(copy.description),
      navBlock(includeNavigation, () => canonicalSourceLink(copy.canonical)),
      escapeMd(copy.intro),
      ...sections(copy),
      navBlock(includeNavigation, () => pagesSection(copy.path, copy.preferredLanguage, translate)),
    ]),
  };
};

export const buildHomeMd = (input: HomeMdInput): MarkdownTwin => {
  const { translate, experienceList, preferredLanguage } = input;
  const [employment, projects] = partitionExperiences(experienceList);

  return staticTwinDocument(input, HOME_PATH, () => [
    mdTitledSection(translate(msg("Experience")), experienceLines({ experiences: employment, translate, preferredLanguage, mode: "twin" })),
    mdTitledSection(translate(msg("Portfolio Projects")), experienceLines({ experiences: projects, translate, preferredLanguage, mode: "twin" })),
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

// Builds the Markdown twin for an experience detail page
export const buildExperienceMd = ({ seo, translate, includeNavigation = true }: ExperienceMdInput): MarkdownTwin => {
  const { experience, preferredLanguage, canonical, headline, description } = seo;
  const { role, company, txt, year } = experience;
  const skills = experienceKeywords(experience);
  const { repository, live, video } = experienceLinks(experience);

  const links = pipe(
    [
      [msg("GitHub Repo"), repository],
      [msg("Live Link"), live],
      [msg("Watch Video"), video],
    ] as const,
    Array.map(([label, href]) => Option.map(href, (url) => mdLink(translate(label), url))),
    Array.getSomes
  );

  return {
    facts: {
      ...twinIdentity(headline, description, canonical, preferredLanguage),
      type: isEmployment(experience) ? "work-experience" : "project",
      role: inlineText(role),
      company: inlineText(company),
      year: inlineText(year),
      skills: Array.join(skills, ", "),
    },
    body: mdBody([
      mdHeading(1, headline),
      mdQuote(description),
      navBlock(includeNavigation, () => canonicalSourceLink(canonical)),
      mdTitledSection(translate(msg("Overview")), escapeMd(txt)),
      mdTitledSection(
        translate(msg("Details")),
        mdBulletList([mdFact(translate(msg("Role")), role), mdFact(translate(msg("Company")), company), mdFact(translate(msg("Year")), year)])
      ),
      mdTitledSection(translate(msg("Skills Used")), mdBulletList(Array.map(skills, escapeMdInline))),
      // An experience with no publishable link gets no Links section at all, rather than an empty one
      Array.match(links, {
        onEmpty: () => "",
        onNonEmpty: (entries) => mdTitledSection(translate(msg("Links")), mdBulletList(entries)),
      }),
      navBlock(includeNavigation, () => detailPagesSection(preferredLanguage, translate)),
    ]),
  };
};

const PAGE_DOCUMENT_BUILDERS: { readonly [P in PagePath]: PageDocumentBuilder<P> } = {
  [HOME_PATH]: (content, context) => buildHomeMd({ ...content, ...context }),
  [EDUCATION_PATH]: (content, context) => buildEducationMd({ ...content, ...context }),
  [CONTACT_PATH]: (content, context) => buildContactMd({ ...content, ...context }),
};

export const buildPageDocument = <P extends PagePath>(pagePath: P, content: PageDocumentContent[P], context: TwinContext): MarkdownTwin =>
  PAGE_DOCUMENT_BUILDERS[pagePath](content, context);
