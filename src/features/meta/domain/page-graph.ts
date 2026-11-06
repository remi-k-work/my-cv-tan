// The page-node pair every content page publishes: a WebPage node and its two-level breadcrumb
// trail, decided once so no per-page builder has to restate how the two hang together.

// domain
import { breadcrumb, webPageNode } from "./nodes";

// constants
import { absoluteUrl } from "./urls";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { JsonLdNode, JsonLdNodes } from "./models";
import type { PageNodeType } from "./nodes";

// The page's absolute URL doubles as its @id so the two spellings can never disagree, and a parser
// resolves the page from the node itself instead of interpreting a host-rooted @id first.
export const pageGraph = ({
  type,
  path,
  name,
  description,
  preferredLanguage,
  mainEntity,
  primaryImageOfPage,
}: {
  readonly type: PageNodeType;
  readonly path: string;
  readonly name: string;
  readonly description: string;
  readonly preferredLanguage: PreferredLanguage;
  readonly mainEntity?: JsonLdNode;
  readonly primaryImageOfPage?: JsonLdNode;
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
    }),
    breadcrumb(preferredLanguage, id, name),
  ];
};
