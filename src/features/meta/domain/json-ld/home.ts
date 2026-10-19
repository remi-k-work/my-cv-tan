// services, features, and other libraries
import { Array, pipe } from "effect";
import { matchPreferredLanguage } from "@/domain/helpers";
import { experienceHeadline, partitionExperiences } from "@/features/experience/domain/helpers";
import { collectionNode, jsonLdGraph, webPageNode, whenNonEmpty } from "./core";
import { absoluteUrl, experiencePath } from "@/features/meta/domain/url";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { ExperienceList } from "@/features/experience/domain/models";
import type { HomeJsonLdInput } from "@/features/meta/domain/models";

// constants
import { PERSON_ID, PROFILE_ID, SITE_URL } from "@/features/meta/domain/constants";

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
        Array.map((experience) => {
          const url = absoluteUrl(experiencePath(experience.slug));
          return { "@type": "WebPage", "@id": url, url, name: experienceHeadline(experience, input.preferredLanguage) };
        })
      ),
    })
  );

// Home: a first-party ProfilePage about the author, plus one labeled collection per experience kind
export const homeJsonLd = ({ pageName, description, experienceList, preferredLanguage }: HomeJsonLdInput) => {
  const [employment, projects] = partitionExperiences(experienceList);

  return jsonLdGraph([
    webPageNode({
      type: "ProfilePage",
      id: PROFILE_ID,
      // Byte-equal to the homepage canonical (trailing slash), like every other home URL
      url: absoluteUrl("/"),
      name: pageName,
      description,
      preferredLanguage,
      // First-party profile: the page is about the author of everything on the site
      mainEntity: { "@id": PERSON_ID },
    }),
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
