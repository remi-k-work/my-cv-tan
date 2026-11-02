// services, features, and other libraries
import { Array } from "effect";
import { matchPreferredLanguage } from "@/domain/helpers";
import { experienceHeadline, partitionExperiences } from "@/features/experience/domain/helpers";
import { collectionNode, webPageNode } from "./core";
import { absoluteUrl, experiencePath } from "../url";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { ExperienceList } from "@/features/experience/domain/models";
import type { JsonLdNodes } from "./core";
import type { LocalizedCopy } from "../static-pages";

// constants
import { HOME_PATH } from "../static-pages";
import { PERSON_ID, PROFILE_ID, SITE_URL } from "../constants";

// The resolved localized copy plus the dataset this graph renders from
interface HomeJsonLdInput extends LocalizedCopy {
  readonly experienceList: ExperienceList;
}

// One labeled Collection per experience kind: the labels mirror the HTML page and .md twin so AI
// systems can tell employment from projects instead of reading one mixed list. Collection rather
// than ItemList (see core.ts): a portfolio's grouped lists are not carousel candidates.
//
// An empty kind contributes nothing rather than an empty Collection, because a collection with no
// parts reads as a promise of content that is not there.
const experienceCollection = (input: { id: string; name: string; experiences: ExperienceList; preferredLanguage: PreferredLanguage }): JsonLdNodes =>
  Array.match(input.experiences, {
    onEmpty: (): JsonLdNodes => [],
    onNonEmpty: (experiences) => [
      collectionNode({
        id: input.id,
        name: input.name,
        preferredLanguage: input.preferredLanguage,
        // Each part references the detail page with its translated headline, in visible slider order
        parts: Array.map(experiences, (experience) => {
          const url = absoluteUrl(experiencePath(experience.slug));
          return { "@type": "WebPage", "@id": url, url, name: experienceHeadline(experience, input.preferredLanguage) };
        }),
      }),
    ],
  });

// The two labeled groups the home page renders, in the order the sliders show them: employment
// first, then projects. An empty kind contributes nothing instead of an empty Collection, so no
// call site has to restate the "or nothing" branch.
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

// Home: a first-party ProfilePage about the author, plus one labeled collection per experience kind.
// ProfilePage is first-party: the page's mainEntity is the site Person, so AI systems can extract
// "this page is about the author" directly.
export const homeJsonLd = ({ pageName, description, experienceList, preferredLanguage }: HomeJsonLdInput): JsonLdNodes => {
  // One split the home JSON-LD, the HTML sliders and the home twin all read, so the three surfaces
  // group identical entities under identical labels
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
