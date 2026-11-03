import { Array } from "effect";
import { matchPreferredLanguage } from "@/domain/helpers";
import { experienceHeadline, partitionExperiences } from "@/features/experience/domain/helpers";
import { collectionNode, webPageNode, type JsonLdNodes } from "./core";
import { absoluteUrl, experiencePath } from "../url";
import { HOME_PATH, type LocalizedCopy } from "../static-pages";
import { PERSON_ID, PROFILE_ID, SITE_URL } from "../constants";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { ExperienceList } from "@/features/experience/domain/models";

// The resolved localized copy plus the dataset this graph renders from
interface HomeJsonLdInput extends LocalizedCopy {
  readonly experienceList: ExperienceList;
}

// Labeled Collection node per experience kind, omitting empty collections.
const experienceCollection = (input: { id: string; name: string; experiences: ExperienceList; preferredLanguage: PreferredLanguage }): JsonLdNodes =>
  Array.match(input.experiences, {
    onEmpty: (): JsonLdNodes => [],
    onNonEmpty: (experiences) => [
      collectionNode({
        id: input.id,
        name: input.name,
        preferredLanguage: input.preferredLanguage,
        parts: Array.map(experiences, (experience) => {
          const url = absoluteUrl(experiencePath(experience.slug));
          return { "@type": "WebPage", "@id": url, url, name: experienceHeadline(experience, input.preferredLanguage) };
        }),
      }),
    ],
  });

// Employment and portfolio project collections in homepage display order.
const experienceCollections = (employment: ExperienceList, projects: ExperienceList, preferredLanguage: PreferredLanguage): JsonLdNodes => [
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
];

// First-party ProfilePage structured data linking author Person and grouped collections.
export const homeJsonLd = ({ pageName, description, experienceList, preferredLanguage }: HomeJsonLdInput): JsonLdNodes => {
  const [employment, projects] = partitionExperiences(experienceList);

  return [
    webPageNode({
      type: "ProfilePage",
      id: PROFILE_ID,
      url: absoluteUrl(HOME_PATH),
      name: pageName,
      description,
      preferredLanguage,
      // First-party profile: the page is about the author of everything on the site
      mainEntity: { "@id": PERSON_ID },
    }),
    ...experienceCollections(employment, projects, preferredLanguage),
  ];
};
