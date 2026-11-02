// services, features, and other libraries
import { Array } from "effect";
import { matchPreferredLanguage } from "@/domain/helpers";
import { excerpt } from "@/features/experience/domain/helpers";
import { collectionNode, pageGraph, personEdge } from "./core";
import { absoluteUrl } from "../url";

// types
import type { JsonLdNodes } from "./core";
import type { LocalizedCopy } from "../static-pages";
import type { EducationList } from "@/features/education/domain/models";

// constants
import { EDUCATION_PATH } from "../static-pages";
import { META_DESCRIPTION_LENGTH, PERSON_ID, SITE_NAME } from "../constants";

// The resolved localized copy plus the school list
interface EducationJsonLdInput extends LocalizedCopy {
  readonly educationList: EducationList;
}

// The school-list collection @id, named once so the collection node and the page's mainEntity
// reference agree without a second spelling of the same fragment.
const educationCollectionId = (url: string) => `${url}#education-list`;

// The school sub-graph: an empty list contributes nothing, so no node ever references a collection
// that does not exist and no "studied at" edge is fabricated out of no schools. Each school is a
// content entry carrying a stable fragment id, declared once so the collection and the reciprocal
// alumni edge reference exactly the ids this list carries.
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
        // The alumni edge ties each school back to the person, making "studied at" extractable
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
        // Person fragment (see personEdge): the reciprocal edge lets extractors read "studied at"
        // from either direction
        personEdge({ alumniOf: Array.map(schoolNodes, ({ "@id": id }) => ({ "@id": id })) }),
      ];
    },
  });

// Education: the page itself plus attended schools, emitted on /education for GEO attribution.
// Each school carries a reciprocal alumniOf edge on the Person fragment, so "studied at" is
// extractable from either direction of the graph.
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
