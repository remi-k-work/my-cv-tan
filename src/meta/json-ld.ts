// services, features, and other libraries
import { excerpt } from "@/domain";
import { absoluteUrl, jsonLdScript } from "./helpers";

// types
import type { Experience } from "@/domain";

// constants
import { SITE_NAME, SITE_URL } from "./constants";

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
        jobTitle: "Web Developer",
        knowsAbout: ["Web Development", "TypeScript", "React"],
      },
    ],
  });

// Structured data for a single experience / project page
export const experienceJsonLd = (slug: string, { role, company, txt, imageName, skillsUsed }: Experience) =>
  jsonLdScript({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${role} at ${company}`,
    description: excerpt(txt, 160),
    image: absoluteUrl(`/images/${imageName}-a.webp`),
    url: absoluteUrl(`/${slug}`),
    inLanguage: ["en", "pl"],
    author: { "@id": `${SITE_URL}/#person` },
    about: skillsUsed,
  });
