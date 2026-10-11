// services, features, and other libraries
import { Array, pipe } from "effect";
import { matchPreferredLanguage } from "@/domain";
import { excerpt } from "@/features/experience/domain";
import { breadcrumb, jsonLdGraph, whenNonEmpty } from "./core";
import { absoluteUrl } from "../url";

// types
import type { EducationJsonLdInput } from "../models";

// constants
import { META_DESCRIPTION_LENGTH, PERSON_ID, SITE_NAME, WEBSITE_ID } from "../constants";

// Education: the page itself plus attended schools, emitted on /education for GEO attribution
export const educationJsonLd = ({ pageName, description, educationList, preferredLanguage }: EducationJsonLdInput) => {
  const url = absoluteUrl("/education");
  // Stable fragment id per school: the person's alumniOf edges below reference them
  const schoolId = (index: number) => `${url}#school-${index + 1}`;
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
      // Dropped by JSON.stringify when the school list is empty, so the page never references a missing list
      mainEntity: educationList.length === 0 ? undefined : { "@id": `${url}#education-list` },
    },
    ...whenNonEmpty(educationList, (schools) => ({
      "@type": "ItemList",
      "@id": `${url}#education-list`,
      name: `${SITE_NAME} — ${matchPreferredLanguage(preferredLanguage, "Education", "Edukacja")}`,
      inLanguage: preferredLanguage,
      numberOfItems: schools.length,
      itemListElement: pipe(
        schools,
        Array.map(({ name, info, location }, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "EducationalOrganization",
            "@id": schoolId(index),
            name,
            description: excerpt(info, META_DESCRIPTION_LENGTH),
            address: location,
            // The alumni edge ties each school back to the person, making "studied at" extractable
            alumni: { "@id": PERSON_ID },
          },
        }))
      ),
    })),
    // Person fragment that merges with the root graph's Person by @id: the reciprocal
    // edge lets extractors read "studied at" from either direction
    ...whenNonEmpty(educationList, (schools) => ({
      "@type": "Person",
      "@id": PERSON_ID,
      alumniOf: pipe(
        schools,
        Array.map((_, index) => ({ "@id": schoolId(index) }))
      ),
    })),
    breadcrumb(preferredLanguage, "/education", pageName),
  ]);
};
