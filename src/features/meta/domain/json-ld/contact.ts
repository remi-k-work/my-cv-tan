import { pageGraph, personEdge, type JsonLdNodes } from "./core";
import { absoluteUrl } from "../url";
import { CONTACT_PATH, type LocalizedCopy } from "../static-pages";
import { PERSON_ID, SITE_LANGUAGES } from "../constants";

// ContactPage structured data with ContactPoint for the contact form.
export const contactJsonLd = ({ pageName, description, preferredLanguage }: LocalizedCopy): JsonLdNodes => {
  const url = absoluteUrl(CONTACT_PATH);
  const contactPointId = `${url}#contact-point`;

  return [
    ...pageGraph({
      type: "ContactPage",
      path: CONTACT_PATH,
      name: pageName,
      description,
      preferredLanguage,
      mainEntity: { "@id": PERSON_ID },
    }),
    // Person fragment that merges with the root graph's Person by @id: attaches the contact channel
    personEdge({ contactPoint: { "@id": contactPointId } }),
    // The bilingual contact form is the channel; no email or phone is published
    {
      "@type": "ContactPoint",
      "@id": contactPointId,
      contactType: "author",
      url,
      availableLanguage: [...SITE_LANGUAGES],
    },
  ];
};
