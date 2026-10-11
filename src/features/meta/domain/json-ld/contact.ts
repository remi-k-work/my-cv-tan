// services, features, and other libraries
import { breadcrumb, jsonLdGraph } from "./core";
import { absoluteUrl } from "../url";

// types
import type { LocalizedCopy } from "../models";

// constants
import { PERSON_ID, SITE_LANGUAGES, WEBSITE_ID } from "../constants";

// Contact: a ContactPage mirroring the visible content, the contact channel, and its breadcrumb
export const contactJsonLd = ({ pageName, description, preferredLanguage }: LocalizedCopy) => {
  const url = absoluteUrl("/contact");
  const contactPointId = `${url}#contact-point`;
  return jsonLdGraph([
    {
      "@type": "ContactPage",
      "@id": url,
      name: pageName,
      description,
      url,
      inLanguage: preferredLanguage,
      isPartOf: { "@id": WEBSITE_ID },
      breadcrumb: { "@id": `${url}#breadcrumb` },
      mainEntity: { "@id": PERSON_ID },
    },
    // Person fragment that merges with the root graph's Person by @id: attaches the contact channel
    {
      "@type": "Person",
      "@id": PERSON_ID,
      contactPoint: { "@id": contactPointId },
    },
    // The bilingual contact form is the channel; no email or phone is published
    {
      "@type": "ContactPoint",
      "@id": contactPointId,
      contactType: "author",
      url,
      availableLanguage: [...SITE_LANGUAGES],
    },
    breadcrumb(preferredLanguage, "/contact", pageName),
  ]);
};
