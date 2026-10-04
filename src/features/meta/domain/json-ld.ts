// services, features, and other libraries
import { Array, Option, pipe } from "effect";
import { excerpt } from "@/features/experience/domain";
import { absoluteUrl, jsonLdScript } from "./helpers";

// types
import type { Experience } from "@/features/experience/domain";

// constants
import { AVATAR_IMAGE, GLOBAL_IMAGE, HOME_COUNTRY, HOME_LOCALITY, META_DESCRIPTION_LENGTH, SITE_NAME, SITE_URL, SOCIAL_LINKS } from "./constants";

// Site-wide structured data: the site itself plus its author
export const websitePersonJsonLd = () =>
  jsonLdScript({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_URL,
        inLanguage: ["en", "pl"],
        author: { "@id": `${SITE_URL}/#person` },
      },
      {
        "@type": "Person",
        "@id": `${SITE_URL}/#person`,
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
        "@id": `${SITE_URL}/#publisher`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: { "@type": "ImageObject", url: GLOBAL_IMAGE, width: 1200, height: 630 },
        sameAs: [...SOCIAL_LINKS],
      },
    ],
  });

// Resolves the shareable image for an experience; falls back to the global jpeg when imageName is missing or blank
const experienceImageUrl = (imageName: string) =>
  pipe(
    Option.fromNullishOr(imageName),
    Option.filter((name) => name.trim().length > 0),
    Option.map((name) => absoluteUrl(`/images/${name}-a.webp`)),
    Option.getOrElse(() => GLOBAL_IMAGE)
  );

// Structured data for a single experience / project page
export const experienceJsonLd = (slug: string, { role, company, txt, imageName, skillsUsed }: Experience) =>
  jsonLdScript({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${role} at ${company}`,
    description: excerpt(txt, META_DESCRIPTION_LENGTH),
    image: experienceImageUrl(imageName),
    url: absoluteUrl(`/${slug}`),
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(`/${slug}`) },
    inLanguage: ["en", "pl"],
    author: { "@id": `${SITE_URL}/#person` },
    publisher: { "@id": `${SITE_URL}/#publisher` },
    about: skillsUsed,
  });

// Breadcrumb trail for a single experience / project page
export const experienceBreadcrumbJsonLd = (slug: string, { role, company }: Experience) =>
  jsonLdScript({
    "@context": "https://schema.org",
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
        item: absoluteUrl(`/${slug}`),
      },
    ],
  });

// ItemList of every experience / project, emitted on the homepage for crawlers and AI citation
export const homeItemListJsonLd = (experiences: ReadonlyArray<{ readonly slug: string; readonly role: string; readonly company: string }>) =>
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

// Education history as credentials, emitted on /education for GEO attribution
export const educationCredentialsJsonLd = (educationList: ReadonlyArray<{ readonly name: string; readonly info: string; readonly location: string }>) =>
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
          "@type": "EducationalOccupationalCredential",
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
