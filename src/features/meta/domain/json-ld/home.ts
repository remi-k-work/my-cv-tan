// services, features, and other libraries
import { Array, pipe, Result } from "effect";
import { matchPreferredLanguage } from "@/domain/helpers";
import { experienceHeadline } from "@/features/experience/domain/helpers";
import { collectionNode, jsonLdGraph, whenNonEmpty } from "./core";
import { absoluteUrl, experiencePath } from "../url";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { ExperienceList } from "@/features/experience/domain/models";
import type { HomeJsonLdInput } from "../models";

// constants
import { PERSON_ID, PROFILE_ID, SITE_URL, WEBSITE_ID } from "../constants";

// One labeled Collection per experience kind: the labels mirror the HTML page and .md twin so AI
// systems can tell employment from projects instead of reading one mixed list. Collection rather
// than ItemList (see core.ts): a portfolio's grouped lists are not carousel candidates
const experienceCollection = (input: { id: string; name: string; experiences: ExperienceList; preferredLanguage: PreferredLanguage }) =>
  whenNonEmpty(input.experiences, (experiences) =>
    collectionNode({
      id: input.id,
      name: input.name,
      preferredLanguage: input.preferredLanguage,
      // Each part references the detail page with its translated headline, in visible slider order
      parts: pipe(
        experiences,
        Array.map((experience) => ({
          "@type": "WebPage",
          url: absoluteUrl(experiencePath(experience.slug)),
          name: experienceHeadline(experience, input.preferredLanguage),
        }))
      ),
    })
  );

// Home: a first-party ProfilePage about the author, plus one labeled collection per experience kind
export const homeJsonLd = ({ pageName, description, experienceList, preferredLanguage }: HomeJsonLdInput) => {
  // Split the list once instead of filtering it again for each collection: "e" and "p" are the
  // only experience types, so whatever is not employment is exactly the project list
  const [employment, projects] = Array.partition(experienceList, (experience) =>
    experience.type === "e" ? Result.succeed(experience) : Result.fail(experience)
  );
  return jsonLdGraph([
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
    ...experienceCollection({
      id: `${SITE_URL}/#experience-list`,
      name: matchPreferredLanguage(preferredLanguage, "Experience", "Doświadczenie"),
      experiences: employment,
      preferredLanguage,
    }),
    ...experienceCollection({
      id: `${SITE_URL}/#portfolio-list`,
      name: matchPreferredLanguage(preferredLanguage, "Portfolio Projects", "Projekty do Portfolio"),
      experiences: projects,
      preferredLanguage,
    }),
  ]);
};
