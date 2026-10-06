// services, features, and other libraries
import { Array, pipe } from "effect";
import { pageField, sectionLabel } from "@/domain";
import { excerpt } from "@/features/experience/domain";
import { absoluteUrl } from "@/features/meta/domain";
import { escapeMd, escapeMdInline, frontmatter, mdBulletList, mdHeading, mdQuote } from "./helpers";
import { experienceLines } from "./listing";

// types
import type { ContactMdInput, EducationMdInput, HomeMdInput } from "./models";
import type { PreferredLanguage } from "@/domain";

// constants
import { CONTACT_MD_HREF, DESCRIPTION, EDUCATION_MD_HREF, META_DESCRIPTION_LENGTH, SITE_NAME, SOCIAL_LINKS, TITLE } from "@/features/meta/domain";
import { CERTIFICATES_HREF, CV_EN_HREF, CV_PL_HREF } from "./constants";

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

export const buildHomeMd = ({ pageTitles, localizedContent, experienceList, preferredLanguage }: HomeMdInput) => {
  const title = pageField(pageTitles, "/", "heading", TITLE);
  const intro = pageField(pageTitles, "/", "intro", DESCRIPTION);
  const canonical = absoluteUrl("/");

  return [
    ...pageOpening(title, excerpt(intro, META_DESCRIPTION_LENGTH), canonical, preferredLanguage),
    escapeMd(intro),
    ``,
    mdHeading(2, sectionLabel(localizedContent, "pageHome", "experience", "Experience")),
    ``,
    experienceLines(experienceList, "e"),
    ``,
    mdHeading(2, sectionLabel(localizedContent, "pageHome", "portfolioProjects", "Portfolio Projects")),
    ``,
    experienceLines(experienceList, "p"),
    ``,
    mdHeading(2, "Pages"),
    ``,
    mdBulletList([
      `[Education & Certificates](${absoluteUrl(EDUCATION_MD_HREF)})`,
      `[Contact](${absoluteUrl(CONTACT_MD_HREF)})`,
      `[llms.txt](${absoluteUrl("/llms.txt")})`,
    ]),
    ``,
  ].join("\n");
};

export const buildEducationMd = ({ pageTitles, educationList, preferredLanguage }: EducationMdInput) => {
  const title = pageField(pageTitles, "/education", "heading", "Education");
  const intro = pageField(pageTitles, "/education", "intro", "Education & certificates.");
  const canonical = absoluteUrl("/education");

  // One section per school: heading, facts list, then the full prose description
  const schools = pipe(
    educationList,
    Array.map(({ name, year, location, info }) =>
      [mdHeading(2, name), ``, mdBulletList([`Years: ${escapeMdInline(year)}`, `Location: ${escapeMdInline(location)}`]), ``, escapeMd(info)].join("\n")
    ),
    Array.join("\n\n")
  );

  return [
    ...pageOpening(title, excerpt(intro, META_DESCRIPTION_LENGTH), canonical, preferredLanguage),
    escapeMd(intro),
    ``,
    schools === "" ? `_No entries._` : schools,
    ``,
    mdHeading(2, "Documents"),
    ``,
    mdBulletList([
      `[Certificates](${absoluteUrl(CERTIFICATES_HREF)})`,
      `[CV (English)](${absoluteUrl(CV_EN_HREF)})`,
      `[CV (Polish)](${absoluteUrl(CV_PL_HREF)})`,
    ]),
    ``,
  ].join("\n");
};

export const buildContactMd = ({ pageTitles, preferredLanguage }: ContactMdInput) => {
  const title = pageField(pageTitles, "/contact", "heading", "Contact");
  const intro = pageField(pageTitles, "/contact", "intro", "Get in touch via the contact form.");
  const canonical = absoluteUrl("/contact");

  return [
    ...pageOpening(title, excerpt(intro, META_DESCRIPTION_LENGTH), canonical, preferredLanguage),
    escapeMd(intro),
    ``,
    mdHeading(2, "Channels"),
    ``,
    mdBulletList([`Contact form: ${canonical} (same page in HTML)`, `Base: Rzeszów, Poland`, `GitHub: ${gitHubLink}`, `LinkedIn: ${linkedInLink}`]),
    ``,
  ].join("\n");
};
