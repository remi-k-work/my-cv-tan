// services, features, and other libraries
import { Array, pipe } from "effect";
import { matchPreferredLanguage } from "@/domain";
import { experienceHeadline } from "@/features/experience/domain";
import { collectionNode, jsonLdGraph, whenNonEmpty } from "./core";
import { absoluteUrl, experiencePath } from "../url";

// types
import type { PreferredLanguage } from "@/domain";
import type { Experience, ExperienceList } from "@/features/experience/domain";
import type { HomeJsonLdInput } from "../models";

// constants
import { PERSON_ID, PROFILE_ID, SITE_URL, WEBSITE_ID } from "../constants";

// One labeled Collection per experience kind: the labels mirror the HTML page and .md twin so AI
// systems can tell employment from projects instead of reading one mixed list. Collection rather
// than ItemList (see core.ts): a portfolio's grouped lists are not carousel candidates
const experienceCollection = (id: string, name: string, type: Experience["type"], experienceList: ExperienceList, preferredLanguage: PreferredLanguage) =>
  whenNonEmpty(
    Array.filter(experienceList, (experience) => experience.type === type),
    (experiences) =>
      collectionNode({
        id,
        name,
        preferredLanguage,
        // Each part references the detail page with its translated headline, in visible slider order
        parts: pipe(
          experiences,
          Array.map((experience) => ({
            "@type": "WebPage",
            url: absoluteUrl(experiencePath(experience.slug)),
            name: experienceHeadline(experience, preferredLanguage),
          }))
        ),
      })
  );

// Home: a first-party ProfilePage about the author, plus one labeled collection per experience kind
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
    ...experienceCollection(
      `${SITE_URL}/#experience-list`,
      matchPreferredLanguage(preferredLanguage, "Experience", "Doświadczenie"),
      "e",
      experienceList,
      preferredLanguage
    ),
    ...experienceCollection(
      `${SITE_URL}/#portfolio-list`,
      matchPreferredLanguage(preferredLanguage, "Portfolio Projects", "Projekty do Portfolio"),
      "p",
      experienceList,
      preferredLanguage
    ),
  ]);
