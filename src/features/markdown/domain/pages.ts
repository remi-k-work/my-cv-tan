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
import type { PreferredLanguage } from "@/domain";

// constants
import {
  CERTIFICATES_HREF,
  CONTACT_MD_HREF,
  CV_EN_HREF,
  CV_PL_HREF,
  DESCRIPTION,
  EDUCATION_MD_HREF,
  META_DESCRIPTION_LENGTH,
  SITE_NAME,
  SOCIAL_LINKS,
  TITLE,
} from "@/features/meta/domain";

// Profile URLs stay single-sourced: the same constants feed the HTML page and JSON-LD
const [gitHubLink, linkedInLink] = SOCIAL_LINKS;

// Shared opening block for page twins: frontmatter mirrors <head> meta, then H1 and quoted summary
const pageOpening = (title: string, description: string, canonical: string, preferredLanguage: PreferredLanguage) => [
  frontmatter({ title: `${SITE_NAME} ● ${title}`, description, canonical, lang: preferredLanguage }),
  mdHeading(1, title),
  ``,
  mdQuote(description),
  ``,
];

export const buildHomeMd = ({ pageTitles, experienceList, preferredLanguage, translate }: HomeMdInput) => {
  const title = pageField(pageTitles, "/", "heading", TITLE);
  const intro = pageField(pageTitles, "/", "intro", DESCRIPTION);
  const canonical = absoluteUrl("/");

  return [
    ...pageOpening(title, excerpt(intro, META_DESCRIPTION_LENGTH), canonical, preferredLanguage),
    escapeMd(intro),
    ``,
    mdHeading(2, translate(msg("Experience"))),
    ``,
    experienceLines(experienceList, "e", translate, preferredLanguage),
    ``,
    mdHeading(2, translate(msg("Portfolio Projects"))),
    ``,
    experienceLines(experienceList, "p", translate, preferredLanguage),
    ``,
    mdHeading(2, translate(msg("Pages"))),
    ``,
    mdBulletList([
      `[${translate(msg("Education & Certificates"))}](${absoluteUrl(EDUCATION_MD_HREF)})`,
      `[${translate(msg("Contact"))}](${absoluteUrl(CONTACT_MD_HREF)})`,
      `[llms.txt](${absoluteUrl("/llms.txt")})`,
    ]),
    ``,
  ].join("\n");
};

export const buildEducationMd = ({ pageTitles, educationList, preferredLanguage, translate }: EducationMdInput) => {
  const title = pageField(pageTitles, "/education", "heading", "Education");
  const intro = pageField(pageTitles, "/education", "intro", "Education & certificates.");
  const canonical = absoluteUrl("/education");

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
    ...pageOpening(title, excerpt(intro, META_DESCRIPTION_LENGTH), canonical, preferredLanguage),
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
  const title = pageField(pageTitles, "/contact", "heading", "Contact");
  const intro = pageField(pageTitles, "/contact", "intro", "Get in touch via the contact form.");
  const canonical = absoluteUrl("/contact");

  return [
    ...pageOpening(title, excerpt(intro, META_DESCRIPTION_LENGTH), canonical, preferredLanguage),
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
