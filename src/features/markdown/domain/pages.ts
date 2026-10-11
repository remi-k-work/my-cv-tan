// services, features, and other libraries
import { Array, pipe } from "effect";
import { msg } from "gt-tanstack-start";
import { escapeMd, escapeMdInline, frontmatter, mdBulletList, mdEmptyMarker, mdHeading, mdQuote } from "./helpers";
import { experienceLines } from "./listing";
import { absoluteUrl, staticPageCopy } from "@/features/meta/domain";

// types
import type { ContactMdInput, EducationMdInput, HomeMdInput } from "./models";
import type { PreferredLanguage } from "@/domain";

// constants
import {
  BRANDED_TITLE,
  CERTIFICATES_HREF,
  CONTACT_MD_HREF,
  CV_EN_HREF,
  CV_PL_HREF,
  EDUCATION_MD_HREF,
  LLMS_TXT_HREF,
  SOCIAL_LINKS,
} from "@/features/meta/domain";

// Profile URLs stay single-sourced: the same constants feed the HTML page and JSON-LD
const [gitHubLink, linkedInLink] = SOCIAL_LINKS;

// Shared opening block for page twins: frontmatter mirrors <head> meta plus a machine-classifiable entry type.
// Copy comes from staticPageCopy — the exact resolution the HTML head uses — so .md and HTML meta never drift
interface PageOpening {
  readonly type: "overview" | "education" | "contact";
  readonly title: string;
  readonly description: string;
  readonly canonical: string;
  readonly lang: PreferredLanguage;
}

const pageOpening = ({ type, title, description, canonical, lang }: PageOpening) => [
  frontmatter({ title: BRANDED_TITLE(title), description, canonical, lang, type }),
  mdHeading(1, title),
  ``,
  mdQuote(description),
  ``,
];

export const buildHomeMd = ({ pageTitles, experienceList, preferredLanguage, translate }: HomeMdInput) => {
  const { title, intro, description, canonical } = staticPageCopy(pageTitles, "/");

  return [
    ...pageOpening({ type: "overview", title, description, canonical, lang: preferredLanguage }),
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
  const { title, intro, description, canonical } = staticPageCopy(pageTitles, "/education");

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
    ...pageOpening({ type: "education", title, description, canonical, lang: preferredLanguage }),
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
  const { title, intro, description, canonical } = staticPageCopy(pageTitles, "/contact");

  return [
    ...pageOpening({ type: "contact", title, description, canonical, lang: preferredLanguage }),
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
