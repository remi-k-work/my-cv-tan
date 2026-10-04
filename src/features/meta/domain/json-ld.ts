// services, features, and other libraries
import { excerpt } from "@/features/experience/domain";
import { absoluteUrl, jsonLdScript } from "./helpers";

// types
import type { Experience } from "@/features/experience/domain";

// constants
import { AVATAR_IMAGE, HOME_COUNTRY, HOME_LOCALITY, META_DESCRIPTION_LENGTH, SITE_NAME, SITE_URL, SOCIAL_LINKS } from "./constants";

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
        knowsAbout: ["Web Development", "TypeScript", "React"],
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
    ],
  });

// Structured data for a single experience / project page
export const experienceJsonLd = (slug: string, { role, company, txt, imageName, skillsUsed }: Experience) =>
  jsonLdScript({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${role} at ${company}`,
    description: excerpt(txt, META_DESCRIPTION_LENGTH),
    image: absoluteUrl(`/images/${imageName}-a.webp`),
    url: absoluteUrl(`/${slug}`),
    inLanguage: ["en", "pl"],
    author: { "@id": `${SITE_URL}/#person` },
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
