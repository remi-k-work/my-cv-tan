// Builds a single page's JSON-LD node plus its two-level breadcrumb trail.
// Every content page on the site publishes this pair, so it lives here rather than being
// repeated in each page-specific builder. Companion to ./page-graphs, which assembles
// complete page graphs from this node and additional page-unique nodes.

// domain
import { webPageNode, breadcrumb } from "./nodes";
import { absoluteUrl } from "./urls";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { JsonLdNode, JsonLdNodes } from "./models";

// Emits a WebPage node paired with its two-level breadcrumb list.
// The page's absolute URL doubles as its @id so the two spellings can never disagree.
export const pageGraph = ({
  type,
  path,
  name,
  description,
  preferredLanguage,
  mainEntity,
  primaryImageOfPage,
  datePublished,
}: {
  readonly type: "WebPage" | "ContactPage" | "CollectionPage" | "ProfilePage";
  readonly path: string;
  readonly name: string;
  readonly description: string;
  readonly preferredLanguage: PreferredLanguage;
  readonly mainEntity?: JsonLdNode;
  readonly primaryImageOfPage?: JsonLdNode;
  readonly datePublished?: string;
}): JsonLdNodes => {
  const id = absoluteUrl(path);

  return [
    webPageNode({
      type,
      id,
      url: id,
      name,
      description,
      preferredLanguage,
      breadcrumb: true,
      mainEntity,
      primaryImageOfPage,
      datePublished,
    }),
    breadcrumb(preferredLanguage, id, name),
  ];
};
