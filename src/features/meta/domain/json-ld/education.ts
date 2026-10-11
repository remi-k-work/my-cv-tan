// services, features, and other libraries
import { Array, pipe } from "effect";
import { matchPreferredLanguage } from "@/domain";
import { excerpt } from "@/features/experience/domain";
import { breadcrumb, collectionNode, jsonLdGraph, whenNonEmpty } from "./core";
import { absoluteUrl } from "../url";

// types
import type { EducationJsonLdInput } from "../models";

// constants
import { META_DESCRIPTION_LENGTH, PERSON_ID, SITE_NAME, WEBSITE_ID } from "../constants";

// Education: the page itself plus attended schools, emitted on /education for GEO attribution
export const educationJsonLd = ({ pageName, description, educationList, preferredLanguage }: EducationJsonLdInput) => {
  const url = absoluteUrl("/education");
  const collectionId = `${url}#education-list`;

  // One node per school, in list order; stable fragment ids let the person's alumniOf edges reference them
  const schoolNodes = pipe(
    educationList,
    Array.map(({ name, info, location }, index) => ({
      "@type": "EducationalOrganization",
      "@id": `${url}#school-${index + 1}`,
      name,
      description: excerpt(info, META_DESCRIPTION_LENGTH),
      address: location,
      // The alumni edge ties each school back to the person, making "studied at" extractable
      alumni: { "@id": PERSON_ID },
    }))
  );

  return jsonLdGraph([
    {
      "@type": "CollectionPage",
      "@id": url,
      url,
      name: pageName,
      description,
      inLanguage: preferredLanguage,
      isPartOf: { "@id": WEBSITE_ID },
      breadcrumb: { "@id": `${url}#breadcrumb` },
      // Undefined is dropped by JSON.stringify: an empty list never references a missing collection
      mainEntity: schoolNodes.length === 0 ? undefined : { "@id": collectionId },
    },
    ...whenNonEmpty(schoolNodes, (nodes) =>
      collectionNode({
        id: collectionId,
        name: `${SITE_NAME} — ${matchPreferredLanguage(preferredLanguage, "Education", "Edukacja")}`,
        preferredLanguage,
        parts: nodes,
      })
    ),
    // Person fragment that merges with the root graph's Person by @id: the reciprocal
    // edge lets extractors read "studied at" from either direction
    ...whenNonEmpty(schoolNodes, (nodes) => ({
      "@type": "Person",
      "@id": PERSON_ID,
      alumniOf: pipe(
        nodes,
        Array.map(({ "@id": id }) => ({ "@id": id }))
      ),
    })),
    breadcrumb(preferredLanguage, "/education", pageName),
  ]);
};
