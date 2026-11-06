// The collection subgraphs that group the site's content beside a page's own node: the two
// experience collections (employment and portfolio) and the education page's school list.

// services, features, and other libraries
import { matchPreferredLanguage } from "@/domain/helpers";
import { excerpt, experienceHeadline } from "@/features/experience/domain/helpers";

// domain
import { collectionNode, personEdge } from "./nodes";

// constants
import { absoluteUrl, experiencePath } from "./urls";
import { EXPERIENCE_LIST_ID, META_DESCRIPTION_LENGTH, PERSON_ID, PORTFOLIO_LIST_ID, SITE_NAME } from "./constants";

// types
import type { EducationList } from "@/features/education/domain/models";
import type { ExperienceList } from "@/features/experience/domain/models";
import type { PreferredLanguage } from "@/domain/models";
import type { JsonLdNodes } from "./models";

// Builds one experience collection node (employment or portfolio) with its detail-page parts.
// An empty list emits nothing at all, so no page publishes a misleading empty collection.
const experienceCollection = ({
  id,
  name,
  experiences,
  preferredLanguage,
}: {
  readonly id: string;
  readonly name: string;
  readonly experiences: ExperienceList;
  readonly preferredLanguage: PreferredLanguage;
}): JsonLdNodes => {
  if (experiences.length === 0) return [];

  return [
    collectionNode({
      id,
      name,
      preferredLanguage,
      parts: experiences.map((experience) => {
        const url = absoluteUrl(experiencePath(experience.slug));
        return { "@type": "WebPage", "@id": url, url, name: experienceHeadline(experience, preferredLanguage) };
      }),
    }),
  ];
};

// Builds both experience collections (employment then portfolio) for the homepage graph.
export const experienceCollections = (employment: ExperienceList, projects: ExperienceList, preferredLanguage: PreferredLanguage): JsonLdNodes => [
  ...experienceCollection({
    id: EXPERIENCE_LIST_ID,
    name: matchPreferredLanguage(preferredLanguage, "Experience", "Doświadczenie"),
    experiences: employment,
    preferredLanguage,
  }),
  ...experienceCollection({
    id: PORTFOLIO_LIST_ID,
    name: matchPreferredLanguage(preferredLanguage, "Portfolio Projects", "Projekty do Portfolio"),
    experiences: projects,
    preferredLanguage,
  }),
];

// Each school gets a stable fragment id the person's alumniOf edges reference.
export const educationCollectionId = (url: string) => `${url}#education-list`;

// Builds the school collection plus the Person alumniOf edge for the education page.
export const schoolSubgraph = (url: string, educationList: EducationList, preferredLanguage: PreferredLanguage): JsonLdNodes => {
  if (educationList.length === 0) return [];

  const schoolNodes = educationList.map(({ name, info, location }, index) => ({
    "@type": "EducationalOrganization",
    "@id": `${url}#school-${index + 1}`,
    name,
    description: excerpt(info, META_DESCRIPTION_LENGTH),
    address: location,
    alumni: { "@id": PERSON_ID },
  }));

  return [
    collectionNode({
      id: educationCollectionId(url),
      url,
      name: `${SITE_NAME} — ${matchPreferredLanguage(preferredLanguage, "Education", "Edukacja")}`,
      preferredLanguage,
      parts: schoolNodes,
    }),
    personEdge({ alumniOf: schoolNodes.map(({ "@id": id }) => ({ "@id": id })) }),
  ];
};
