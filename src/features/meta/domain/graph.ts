// How a node list becomes one document script, and the site-wide entities every page graph merges
// into. The merge lives here rather than beside the node builders in ./nodes because it is the
// document-level contract: nodes are built freely, and this is the single place that decides what
// two nodes sharing an `@id` mean and how the result is serialized into a `<script type>` a
// crawler can parse.

// services, features, and other libraries
import { Array, Predicate, Record } from "effect";

// domain
import { imageObject, PERSON_ID, PUBLISHER_ID, WEBSITE_ID } from "./nodes";

// constants
import {
  AVATAR,
  HOME_COUNTRY,
  HOME_LOCALITY,
  HOME_URL,
  JOB_TITLE,
  KNOWS_ABOUT,
  PERSON_DESCRIPTION,
  SITE_DESCRIPTION,
  SITE_NAME,
  SOCIAL_LINKS,
} from "./identity";
import { SITE_LANGUAGES } from "@/domain/constants";

// types
import type { JsonLdNode, JsonLdObject, JsonLdScript } from "./models";

// --- Merge and serialization ---

// Escapes '<' so serialized content can never close the script tag.
const jsonLdScript = (data: JsonLdObject): JsonLdScript => ({
  type: "application/ld+json",
  children: JSON.stringify(data).replace(/</g, "\\u003C"),
});

// Strips undefined fields so they never erase an existing value during a merge.
const definedNode = (node: JsonLdNode): JsonLdNode => Record.filter(node, Predicate.isNotUndefined);

// Merges nodes by @id, preserving order and letting defined fields override.
// Nodes without an @id are emitted exactly as written.
export const jsonLdGraph = (nodes: ReadonlyArray<JsonLdNode>): JsonLdScript => {
  const { graph } = Array.reduce(nodes, { graph: [] as Array<JsonLdNode>, indexById: new Map<string, number>() }, (acc, node) => {
    const defined = definedNode(node);
    const id = defined["@id"];

    if (!Predicate.isString(id)) {
      acc.graph.push(defined);
      return acc;
    }

    const existingIndex = acc.indexById.get(id);
    if (existingIndex === undefined) {
      acc.indexById.set(id, acc.graph.length);
      acc.graph.push(defined);
    } else {
      acc.graph[existingIndex] = { ...acc.graph[existingIndex], ...defined };
    }

    return acc;
  });

  return jsonLdScript({ "@context": "https://schema.org", "@graph": graph });
};

// --- Site-wide entities ---

const POSTAL_ADDRESS = { "@type": "PostalAddress", addressLocality: HOME_LOCALITY, addressCountry: HOME_COUNTRY } as const;
const AVATAR_IMAGE_OBJECT = imageObject(AVATAR.src, AVATAR.width, AVATAR.height);

// Site-wide entities merged into every page graph.
export const siteNodes: ReadonlyArray<JsonLdNode> = [
  {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: HOME_URL,
    inLanguage: [...SITE_LANGUAGES],
    author: { "@id": PERSON_ID },
    publisher: { "@id": PUBLISHER_ID },
  },
  {
    "@type": "Person",
    "@id": PERSON_ID,
    name: SITE_NAME,
    description: PERSON_DESCRIPTION,
    url: HOME_URL,
    image: AVATAR_IMAGE_OBJECT,
    jobTitle: JOB_TITLE,
    knowsAbout: [...KNOWS_ABOUT],
    knowsLanguage: [...SITE_LANGUAGES],
    address: POSTAL_ADDRESS,
    sameAs: [...SOCIAL_LINKS],
  },
  {
    "@type": "Organization",
    "@id": PUBLISHER_ID,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: HOME_URL,
    address: POSTAL_ADDRESS,
    logo: AVATAR_IMAGE_OBJECT,
    sameAs: [...SOCIAL_LINKS],
    member: { "@id": PERSON_ID },
  },
] as const;

// The site entities on their own, serialized once for heads that publish no page graph.
export const siteGraphScript: JsonLdScript = jsonLdGraph(siteNodes);
