// services, features, and other libraries
import { pageGraph, personEdge } from "./core";
import { absoluteUrl } from "../url";

// types
import type { JsonLdNodes } from "./core";
import type { LocalizedCopy } from "../static-pages";

// constants
import { CONTACT_PATH } from "../static-pages";
import { PERSON_ID, SITE_LANGUAGES } from "../constants";

// Contact: a ContactPage mirroring the visible content, the contact channel, and its breadcrumb.
// The bilingual contact form is the published ContactPoint channel — no email or phone is exposed,
// keeping the page crawlable without harvesting contact details.
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
