// services, features, and other libraries
import { Array, Option, pipe } from "effect";
import { experienceHeadline, excerpt } from "@/features/experience/domain";
import { absoluteUrl, experienceImageUrl, experiencePath, jsonLdScript } from "./helpers";

// types
import type { PreferredLanguage } from "@/domain";
import type { EducationList } from "@/features/education/domain";
import type { ExperienceList } from "@/features/experience/domain";
import type { ExperienceHeadInput } from "./models";

// constants
import {
  AVATAR_IMAGE,
  GLOBAL_IMAGE,
  HOME_COUNTRY,
  HOME_LOCALITY,
  JOB_TITLE,
  KNOWS_ABOUT,
  META_DESCRIPTION_LENGTH,
  PERSON_ID,
  PROFILE_ID,
  PUBLISHER_ID,
  SITE_LANGUAGES,
  SITE_NAME,
  SITE_URL,
  SOCIAL_LINKS,
  WEBSITE_ID,
} from "./constants";

// Every page emits exactly one script: nodes share a single @graph so @id cross-references stay intact in a single parser pass
const jsonLdGraph = (nodes: ReadonlyArray<unknown>) => jsonLdScript({ "@context": "https://schema.org", "@graph": [...nodes] } as const);

// List-derived nodes are only meaningful when the list decoded and is non-empty
const whenNonEmpty = <T, N>(list: ReadonlyArray<T>, build: (items: ReadonlyArray<T>) => N): ReadonlyArray<N> => (list.length === 0 ? [] : [build(list)]);

// Shared two-level trail: every subpage hangs directly off the homepage
const breadcrumb = (path: string, name: string) =>
  ({
    "@type": "BreadcrumbList",
    itemListElement: [
      // Byte-equal to the homepage canonical so structured data and canonical signals agree
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name, item: absoluteUrl(path) },
    ],
  }) as const;

// Site-wide structured data: the site itself plus its author and publisher
export const websitePersonJsonLd = () =>
  jsonLdGraph([
    {
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: [...SITE_LANGUAGES],
      author: { "@id": PERSON_ID },
      publisher: { "@id": PUBLISHER_ID },
    },
    {
      "@type": "Person",
      "@id": PERSON_ID,
      name: SITE_NAME,
      url: SITE_URL,
      image: AVATAR_IMAGE,
      jobTitle: JOB_TITLE,
      knowsAbout: [...KNOWS_ABOUT],
      // The site's bilingual audience is a factual GEO signal for AI extraction
      knowsLanguage: [...SITE_LANGUAGES],
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
  ]);

// Home: a first-party ProfilePage about the author, plus an ItemList of all work for crawlers and AI citation
export const homeJsonLd = ({
  title,
  description,
  experienceList,
  preferredLanguage,
}: {
  readonly title: string;
  readonly description: string;
  readonly experienceList: ExperienceList;
  readonly preferredLanguage: PreferredLanguage;
}) =>
  jsonLdGraph([
    {
      "@type": "ProfilePage",
      "@id": PROFILE_ID,
      url: SITE_URL,
      name: title,
      description,
      inLanguage: preferredLanguage,
      isPartOf: { "@id": WEBSITE_ID },
      // First-party profile: the page is about the author of everything on the site
      mainEntity: { "@id": PERSON_ID },
    },
    ...whenNonEmpty(experienceList, (experiences) => ({
      "@type": "ItemList",
      name: `${SITE_NAME} — Experience & Projects`,
      inLanguage: preferredLanguage,
      itemListElement: pipe(
        experiences,
        Array.map((experience, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: experienceHeadline(experience, preferredLanguage),
          url: absoluteUrl(experiencePath(experience.slug)),
        }))
      ),
    })),
  ]);

// Education: breadcrumb plus attended schools, emitted on /education for GEO attribution
export const educationJsonLd = ({
  title,
  educationList,
  preferredLanguage,
}: {
  readonly title: string;
  readonly educationList: EducationList;
  readonly preferredLanguage: PreferredLanguage;
}) =>
  jsonLdGraph([
    breadcrumb("/education", title),
    ...whenNonEmpty(educationList, (schools) => ({
      "@type": "ItemList",
      name: `${SITE_NAME} — Education`,
      inLanguage: preferredLanguage,
      itemListElement: pipe(
        schools,
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
    })),
  ]);

// Contact: breadcrumb plus a ContactPage mirroring the visible content
export const contactJsonLd = ({
  title,
  description,
  preferredLanguage,
}: {
  readonly title: string;
  readonly description: string;
  readonly preferredLanguage: PreferredLanguage;
}) => {
  const url = absoluteUrl("/contact");
  return jsonLdGraph([
    breadcrumb("/contact", title),
    {
      "@type": "ContactPage",
      "@id": url,
      name: title,
      description,
      url,
      inLanguage: preferredLanguage,
      isPartOf: { "@id": WEBSITE_ID },
      mainEntity: { "@id": PERSON_ID },
    },
  ]);
};

// Experience / project details use a graph that reflects the kind of item being described
export const experienceJsonLd = ({ slug, experience, preferredLanguage }: ExperienceHeadInput) => {
  const { type, role, company, txt, imageName, skillsUsed } = experience;
  const path = experiencePath(slug);
  const url = absoluteUrl(path);
  const headline = experienceHeadline(experience, preferredLanguage);
  const itemId = `${url}#${type === "e" ? "organization-role" : "project"}`;
  const description = excerpt(txt, META_DESCRIPTION_LENGTH);
  const image = pipe(
    experienceImageUrl(imageName),
    Option.getOrElse(() => GLOBAL_IMAGE)
  );
  const page = {
    "@type": "WebPage",
    "@id": url,
    url,
    name: headline,
    description,
    inLanguage: preferredLanguage,
    isPartOf: { "@id": WEBSITE_ID },
    mainEntity: { "@id": itemId },
  };
  const item =
    type === "e"
      ? {
          "@type": "OrganizationRole",
          "@id": itemId,
          roleName: role,
          description,
          member: { "@id": PERSON_ID },
          mainEntityOfPage: { "@id": url },
        }
      : {
          "@type": "CreativeWork",
          "@id": itemId,
          name: role,
          description,
          image,
          url,
          mainEntityOfPage: { "@id": url },
          inLanguage: preferredLanguage,
          creator: { "@id": PERSON_ID },
          publisher: { "@id": PUBLISHER_ID },
          keywords: skillsUsed.join(", "),
        };

  return jsonLdGraph([
    page,
    ...(type === "e"
      ? [
          {
            "@type": "Organization",
            "@id": `${url}#organization`,
            name: company,
            member: { "@id": itemId },
          },
        ]
      : []),
    item,
    breadcrumb(path, headline),
  ]);
};
