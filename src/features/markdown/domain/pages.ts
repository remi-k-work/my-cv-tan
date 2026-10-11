// services, features, and other libraries
import { Array, pipe } from "effect";
import { msg } from "gt-tanstack-start";
import { pageField } from "@/domain";
import { excerpt } from "@/features/experience/domain";
import { absoluteUrl } from "@/features/meta/domain";
import { escapeMd, escapeMdInline, frontmatter, mdBulletList, mdEmptyMarker, mdHeading, mdQuote } from "./helpers";
import { experienceLines } from "./listing";

// types
import type { ContactMdInput, EducationMdInput, HomeMdInput } from "./models";
import type { PagePath, PageTitles, PreferredLanguage } from "@/domain";

// constants
import {
  CERTIFICATES_HREF,
  CONTACT_MD_HREF,
  CV_EN_HREF,
  CV_PL_HREF,
  DESCRIPTION,
  EDUCATION_MD_HREF,
  LLMS_TXT_HREF,
  META_DESCRIPTION_LENGTH,
  SOCIAL_LINKS,
  TITLE,
  brandedTitle,
} from "@/features/meta/domain";

// Profile URLs stay single-sourced: the same constants feed the HTML page and JSON-LD
const [gitHubLink, linkedInLink] = SOCIAL_LINKS;

// Localized heading + intro and the canonical URL for one static page twin
const pageCopy = (pageTitles: PageTitles, pagePath: PagePath, fallbackHeading: string, fallbackIntro: string) => ({
  title: pageField(pageTitles, pagePath, "heading", fallbackHeading),
  intro: pageField(pageTitles, pagePath, "intro", fallbackIntro),
  canonical: absoluteUrl(pagePath),
});

// Shared opening block for page twins: frontmatter mirrors <head> meta plus a machine-classifiable entry type
interface PageOpening {
  readonly type: "overview" | "education" | "contact";
  readonly title: string;
  readonly intro: string;
  readonly canonical: string;
  readonly lang: PreferredLanguage;
}

const pageOpening = ({ type, title, intro, canonical, lang }: PageOpening) => {
  const description = excerpt(intro, META_DESCRIPTION_LENGTH);
  return [frontmatter({ title: brandedTitle(title), description, canonical, lang, type }), mdHeading(1, title), ``, mdQuote(description), ``];
};

export const buildHomeMd = ({ pageTitles, experienceList, preferredLanguage, translate }: HomeMdInput) => {
  const { title, intro, canonical } = pageCopy(pageTitles, "/", TITLE, DESCRIPTION);

  return [
    ...pageOpening({ type: "overview", title, intro, canonical, lang: preferredLanguage }),
    escapeMd(intro),
    ``,
    mdHeading(2, translate(msg("Experience"))),
    ``,
    experienceLines({ experienceList, type: "e", translate, preferredLanguage }),
    ``,
    mdHeading(2, translate(msg("Portfolio Projects"))),
    ``,
    experienceLines({ experienceList, type: "p", translate, preferredLanguage }),
    ``,
    mdHeading(2, translate(msg("Pages"))),
    ``,
    mdBulletList([
      `[${translate(msg("Education & Certificates"))}](${absoluteUrl(EDUCATION_MD_HREF)})`,
      `[${translate(msg("Contact"))}](${absoluteUrl(CONTACT_MD_HREF)})`,
      `[llms.txt](${absoluteUrl(LLMS_TXT_HREF)})`,
    ]),
    ``,
  ].join("\n");
};

export const buildEducationMd = ({ pageTitles, educationList, preferredLanguage, translate }: EducationMdInput) => {
  const { title, intro, canonical } = pageCopy(pageTitles, "/education", "Education", "Education & certificates.");

  // One section per school: heading, facts list, then the full prose description
  const schools = pipe(
    educationList,
    Array.map(({ name, year, location, info }) =>
      [
        mdHeading(2, name),
        ``,
        mdBulletList([`${translate(msg("Years"))}: ${escapeMdInline(year)}`, `${translate(msg("Location"))}: ${escapeMdInline(location)}`]),
        ``,
        escapeMd(info),
      ].join("\n")
    ),
    Array.join("\n\n")
  );

  return [
    ...pageOpening({ type: "education", title, intro, canonical, lang: preferredLanguage }),
    escapeMd(intro),
    ``,
    schools === "" ? mdEmptyMarker(translate) : schools,
    ``,
    mdHeading(2, translate(msg("Documents"))),
    ``,
    mdBulletList([
      `[${translate(msg("Certificates"))}](${absoluteUrl(CERTIFICATES_HREF)})`,
      `[${translate(msg("CV (English)"))}](${absoluteUrl(CV_EN_HREF)})`,
      `[${translate(msg("CV (Polish)"))}](${absoluteUrl(CV_PL_HREF)})`,
    ]),
    ``,
  ].join("\n");
};

export const buildContactMd = ({ pageTitles, preferredLanguage, translate }: ContactMdInput) => {
  const { title, intro, canonical } = pageCopy(pageTitles, "/contact", "Contact", "Get in touch via the contact form.");

  return [
    ...pageOpening({ type: "contact", title, intro, canonical, lang: preferredLanguage }),
    escapeMd(intro),
    ``,
    mdHeading(2, translate(msg("Channels"))),
    ``,
    mdBulletList([
      `${translate(msg("Contact form"))}: ${canonical} (${translate(msg("same page in HTML"))})`,
      `${translate(msg("Base"))}: ${translate(msg("Rzeszów, Poland"))}`,
      `GitHub: ${gitHubLink}`,
      `LinkedIn: ${linkedInLink}`,
    ]),
    ``,
  ].join("\n");
};
