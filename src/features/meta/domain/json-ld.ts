// services, features, and other libraries
import { Array, Option, pipe } from "effect";
import { excerpt } from "@/features/experience/domain";
import { absoluteUrl, experienceImageUrl, jsonLdScript, yearToIso } from "./helpers";

// types
import type { EducationList } from "@/features/education/domain";
import type { ExperienceList } from "@/features/experience/domain";
import type { ExperienceHeadInput } from "./models";

// constants
import {
  AVATAR_IMAGE,
  GLOBAL_IMAGE,
  HOME_COUNTRY,
  HOME_LOCALITY,
  META_DESCRIPTION_LENGTH,
  PERSON_ID,
  PUBLISHER_ID,
  SITE_NAME,
  SITE_URL,
  SOCIAL_LINKS,
  WEBSITE_ID,
} from "./constants";

// Site-wide structured data: the site itself plus its author
export const websitePersonJsonLd = () =>
  jsonLdScript({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        name: SITE_NAME,
        url: SITE_URL,
        inLanguage: ["en", "pl"],
        author: { "@id": PERSON_ID },
        publisher: { "@id": PUBLISHER_ID },
      },
      {
        "@type": "Person",
        "@id": PERSON_ID,
        name: SITE_NAME,
        url: SITE_URL,
        image: AVATAR_IMAGE,
        jobTitle: "Web Developer",
        knowsAbout: ["Web Development", "TypeScript", "React", "Next.js", "Effect", "Front-End Development", "Full-Stack Development"],
        homeLocation: {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            addressLocality: HOME_LOCALITY,
            addressCountry: HOME_COUNTRY,
          },
        },
        sameAs: [...SOCIAL_LINKS],
      },
      {
        "@type": "Organization",
        "@id": PUBLISHER_ID,
        name: SITE_NAME,
        url: SITE_URL,
        logo: { "@type": "ImageObject", url: GLOBAL_IMAGE, width: 1200, height: 630 },
        sameAs: [...SOCIAL_LINKS],
      },
    ],
  });

// datePublished only when the year label reduces to valid ISO 8601
const datePublished = (year: string) =>
  pipe(
    yearToIso(year),
    Option.match({
      onNone: () => ({}) as Record<string, never>,
      onSome: (iso) => ({ datePublished: iso }) as const,
    })
  );

// Structured data for a single experience / project page: one graph per page so the
// Article, its breadcrumbs and its references stay cross-linkable in a single parse
export const experienceJsonLd = ({ slug, experience, preferredLanguage }: ExperienceHeadInput) => {
  const { role, company, txt, imageName, skillsUsed, year } = experience;
  const url = absoluteUrl(`/${slug}`);

  return jsonLdScript({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: `${role} at ${company}`,
        description: excerpt(txt, META_DESCRIPTION_LENGTH),
        ...datePublished(year),
        image: pipe(
          experienceImageUrl(imageName),
          Option.getOrElse(() => GLOBAL_IMAGE)
        ),
        url,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        inLanguage: preferredLanguage,
        author: { "@id": PERSON_ID },
        publisher: { "@id": PUBLISHER_ID },
        // keywords (Text) is the schema-valid slot for skills; Article.about expects Thing
        keywords: skillsUsed.join(", "),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: SITE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: `${role} at ${company}`,
            item: url,
          },
        ],
      },
    ],
  });
};

// ItemList of every experience / project, emitted on the homepage for crawlers and AI citation
export const homeItemListJsonLd = (experiences: ExperienceList) =>
  jsonLdScript({
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${SITE_NAME} — Experience & Projects`,
    itemListElement: pipe(
      experiences,
      Array.map(({ slug, role, company }, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: `${role} at ${company}`,
        url: absoluteUrl(`/${slug}`),
      }))
    ),
  });

// Education history as attended schools, emitted on /education for GEO attribution
export const educationListJsonLd = (educationList: EducationList) =>
  jsonLdScript({
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${SITE_NAME} — Education`,
    itemListElement: pipe(
      educationList,
      Array.map(({ name, info, location }, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "EducationalOrganization",
          name,
          description: excerpt(info, META_DESCRIPTION_LENGTH),
          address: location,
        },
      }))
    ),
  });

// Static FAQ for /contact: AI systems extract Q&A pairs verbatim, so keep answers factual and short
export const contactFaqJsonLd = () =>
  jsonLdScript({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Where is Remi Forge based?",
        acceptedAnswer: { "@type": "Answer", text: `${HOME_LOCALITY}, Poland. The same contact page serves English and Polish visitors.` },
      },
      {
        "@type": "Question",
        name: "How can I get in touch about a project or internship?",
        acceptedAnswer: { "@type": "Answer", text: "Use the contact form on this page. Every message is answered personally." },
      },
      {
        "@type": "Question",
        name: "Where else can I find Remi Forge online?",
        acceptedAnswer: { "@type": "Answer", text: [...SOCIAL_LINKS].join(" and ") },
      },
    ],
  });
