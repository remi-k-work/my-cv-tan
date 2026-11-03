import { Array } from "effect";
import { matchPreferredLanguage } from "@/domain/helpers";
import { excerpt } from "@/features/experience/domain/helpers";
import { collectionNode, pageGraph, personEdge, type JsonLdNodes } from "./core";
import { absoluteUrl } from "../url";
import { EDUCATION_PATH, type LocalizedCopy } from "../static-pages";
import { META_DESCRIPTION_LENGTH, PERSON_ID, SITE_NAME } from "../constants";

// types
import type { EducationList } from "@/features/education/domain/models";

// Localized copy plus attended schools for education structured data.
interface EducationJsonLdInput extends LocalizedCopy {
  readonly educationList: EducationList;
}

// School list collection node ID.
const educationCollectionId = (url: string) => `${url}#education-list`;

// Attended schools sub-graph with reciprocal alumni edges to the Person entity.
const schoolSubgraph = (url: string, educationList: EducationList, preferredLanguage: LocalizedCopy["preferredLanguage"]): JsonLdNodes =>
  Array.match(educationList, {
    onEmpty: (): JsonLdNodes => [],
    onNonEmpty: (schools) => {
      const schoolNodes = Array.map(schools, ({ name, info, location }, index) => ({
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
        personEdge({ alumniOf: Array.map(schoolNodes, ({ "@id": id }) => ({ "@id": id })) }),
      ];
    },
  });

// Education page structured data including attended schools and alumni relations.
export const educationJsonLd = ({ pageName, description, educationList, preferredLanguage }: EducationJsonLdInput): JsonLdNodes => {
  const url = absoluteUrl(EDUCATION_PATH);
  const schools = schoolSubgraph(url, educationList, preferredLanguage);

  return [
    ...pageGraph({
      type: "CollectionPage",
      path: EDUCATION_PATH,
      name: pageName,
      description,
      preferredLanguage,
      // An empty list never references a collection that does not exist; the key is dropped on serialize
      mainEntity: schools.length > 0 ? { "@id": educationCollectionId(url) } : undefined,
    }),
    ...schools,
  ];
};
