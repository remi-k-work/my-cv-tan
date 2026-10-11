// services, features, and other libraries
import { Array, pipe } from "effect";
import { matchPreferredLanguage } from "@/domain";
import { experienceHeadline } from "@/features/experience/domain";
import { jsonLdGraph, whenNonEmpty } from "./core";
import { absoluteUrl, experiencePath } from "../url";

// types
import type { PreferredLanguage } from "@/domain";
import type { Experience, ExperienceList } from "@/features/experience/domain";
import type { HomeJsonLdInput } from "../models";

// constants
import { PERSON_ID, PROFILE_ID, SITE_URL, WEBSITE_ID } from "../constants";

// One ItemList per experience kind: the labels mirror the HTML page and .md twin so AI
// systems can tell employment from projects instead of reading one mixed list
const experienceItemList = (id: string, name: string, type: Experience["type"], experienceList: ExperienceList, preferredLanguage: PreferredLanguage) =>
  whenNonEmpty(
    Array.filter(experienceList, (experience) => experience.type === type),
    (experiences) => ({
      "@type": "ItemList",
      "@id": id,
      name,
      inLanguage: preferredLanguage,
      numberOfItems: experiences.length,
      itemListElement: pipe(
        experiences,
        Array.map((experience, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: experienceHeadline(experience, preferredLanguage),
          url: absoluteUrl(experiencePath(experience.slug)),
        }))
      ),
    })
  );

// Home: a first-party ProfilePage about the author, plus one labeled list per experience kind
export const homeJsonLd = ({ pageName, description, experienceList, preferredLanguage }: HomeJsonLdInput) =>
  jsonLdGraph([
    {
      "@type": "ProfilePage",
      "@id": PROFILE_ID,
      // Byte-equal to the homepage canonical (trailing slash), like every other home URL
      url: absoluteUrl("/"),
      name: pageName,
      description,
      inLanguage: preferredLanguage,
      isPartOf: { "@id": WEBSITE_ID },
      // First-party profile: the page is about the author of everything on the site
      mainEntity: { "@id": PERSON_ID },
    },
    ...experienceItemList(
      `${SITE_URL}/#experience-list`,
      matchPreferredLanguage(preferredLanguage, "Experience", "Doświadczenie"),
      "e",
      experienceList,
      preferredLanguage
    ),
    ...experienceItemList(
      `${SITE_URL}/#portfolio-list`,
      matchPreferredLanguage(preferredLanguage, "Portfolio Projects", "Projekty do Portfolio"),
      "p",
      experienceList,
      preferredLanguage
    ),
  ]);
