// services, features, and other libraries
import { Array, pipe } from "effect";
import { pageField, sectionLabel } from "@/domain";
import { excerpt } from "@/features/experience/domain";
import { absoluteUrl } from "@/features/meta/domain";
import { escapeMd, escapeMdInline, frontmatter, mdBulletList, mdHeading, mdLabel, mdQuote } from "./helpers";
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
    experienceLines(experienceList, "e", preferredLanguage),
    ``,
    mdHeading(2, sectionLabel(localizedContent, "pageHome", "portfolioProjects", "Portfolio Projects")),
    ``,
    experienceLines(experienceList, "p", preferredLanguage),
    ``,
    mdHeading(2, mdLabel(preferredLanguage, "Pages", "Strony")),
    ``,
    mdBulletList([
      `[${mdLabel(preferredLanguage, "Education & Certificates", "Edukacja i certyfikaty")}](${absoluteUrl(EDUCATION_MD_HREF)})`,
      `[${mdLabel(preferredLanguage, "Contact", "Kontakt")}](${absoluteUrl(CONTACT_MD_HREF)})`,
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
      [
        mdHeading(2, name),
        ``,
        mdBulletList([
          `${mdLabel(preferredLanguage, "Years", "Lata")}: ${escapeMdInline(year)}`,
          `${mdLabel(preferredLanguage, "Location", "Lokalizacja")}: ${escapeMdInline(location)}`,
        ]),
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
    schools === "" ? `_${mdLabel(preferredLanguage, "No entries.", "Brak wpisów.")}_` : schools,
    ``,
    mdHeading(2, mdLabel(preferredLanguage, "Documents", "Dokumenty")),
    ``,
    mdBulletList([
      `[${mdLabel(preferredLanguage, "Certificates", "Certyfikaty")}](${absoluteUrl(CERTIFICATES_HREF)})`,
      `[${mdLabel(preferredLanguage, "CV (English)", "CV (angielski)")}](${absoluteUrl(CV_EN_HREF)})`,
      `[${mdLabel(preferredLanguage, "CV (Polish)", "CV (polski)")}](${absoluteUrl(CV_PL_HREF)})`,
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
    mdHeading(2, mdLabel(preferredLanguage, "Channels", "Kanały")),
    ``,
    mdBulletList([
      `${mdLabel(preferredLanguage, "Contact form", "Formularz kontaktowy")}: ${canonical} (${mdLabel(preferredLanguage, "same page in HTML", "ta sama strona w HTML")})`,
      `${mdLabel(preferredLanguage, "Base", "Lokalizacja")}: ${mdLabel(preferredLanguage, "Rzeszów, Poland", "Rzeszów, Polska")}`,
      `GitHub: ${gitHubLink}`,
      `LinkedIn: ${linkedInLink}`,
    ]),
    ``,
  ].join("\n");
};
