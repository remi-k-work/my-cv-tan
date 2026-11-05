// Direct unit tests for the schema.org JSON-LD node builders in ./nodes.
// Each builder is pure, so these tests assert the exact node shape without
// needing graph merge or serialization.

// services, features, and other libraries
import { assert, it } from "@effect/vitest";

// domain
import { articleNode, webPageNode, collectionNode, imageObject, breadcrumb, personEdge } from "../nodes";

// types
import type { PreferredLanguage } from "@/domain/models";

// constants
import { HOME_URL, PERSON_ID, PUBLISHER_ID, WEBSITE_ID } from "../constants";

const language: PreferredLanguage = "en";

const baseWebPageInput = {
  id: "https://www.remiforge.dev/test",
  url: "https://www.remiforge.dev/test",
  name: "Test Page",
  description: "A test page.",
  preferredLanguage: language,
  isPartOf: { "@id": WEBSITE_ID },
};

it("articleNode builds an Article with author, publisher, about and optional datePublished", () => {
  const node = articleNode({
    id: "https://www.remiforge.dev/#article",
    headline: "Headline",
    description: "Description.",
    preferredLanguage: language,
    about: "https://www.remiforge.dev/#item",
    mainEntityOfPage: "https://www.remiforge.dev/test",
  });

  // datePublished is omitted when undefined, so it is not a key on the node
  assert.deepStrictEqual(node, {
    "@type": "Article",
    "@id": "https://www.remiforge.dev/#article",
    headline: "Headline",
    description: "Description.",
    inLanguage: language,
    author: { "@id": PERSON_ID },
    publisher: { "@id": PUBLISHER_ID },
    about: { "@id": "https://www.remiforge.dev/#item" },
    mainEntityOfPage: { "@id": "https://www.remiforge.dev/test" },
  });
});

it("articleNode omits datePublished when not provided", () => {
  const node = articleNode({
    id: "https://www.remiforge.dev/#article",
    headline: "Headline",
    description: "Description.",
    preferredLanguage: language,
    about: "https://www.remiforge.dev/#item",
    mainEntityOfPage: "https://www.remiforge.dev/test",
  });
  assert.isUndefined(node.datePublished);
  assert.notInclude(Object.keys(node), "datePublished");
});

it("webPageNode builds a WebPage node with optional fields conditionally included", () => {
  const node = webPageNode({
    type: "WebPage",
    ...baseWebPageInput,
    breadcrumb: true,
    mainEntity: { "@id": "https://www.remiforge.dev/#item" },
    primaryImageOfPage: { "@type": "ImageObject", url: "https://www.remiforge.dev/img.jpg", width: 100, height: 100 },
    datePublished: "2026",
  });

  assert.deepStrictEqual(node, {
    "@type": "WebPage",
    "@id": "https://www.remiforge.dev/test",
    url: "https://www.remiforge.dev/test",
    name: "Test Page",
    description: "A test page.",
    inLanguage: language,
    isPartOf: { "@id": WEBSITE_ID },
    breadcrumb: { "@id": "https://www.remiforge.dev/test#breadcrumb" },
    mainEntity: { "@id": "https://www.remiforge.dev/#item" },
    primaryImageOfPage: { "@type": "ImageObject", url: "https://www.remiforge.dev/img.jpg", width: 100, height: 100 },
    datePublished: "2026",
  });
});

it("webPageNode omits undefined optional fields", () => {
  const node = webPageNode({
    type: "ContactPage",
    ...baseWebPageInput,
  });
  assert.isUndefined(node.breadcrumb);
  assert.isUndefined(node.mainEntity);
  assert.isUndefined(node.primaryImageOfPage);
  assert.isUndefined(node.datePublished);
});

it("collectionNode builds a Collection with parts and optional url", () => {
  const parts = [{ "@type": "WebPage", "@id": "https://www.remiforge.dev/a", url: "https://www.remiforge.dev/a", name: "A" }];
  const node = collectionNode({
    id: "https://www.remiforge.dev/#list",
    name: "List",
    preferredLanguage: language,
    parts,
    url: "https://www.remiforge.dev/list",
  });

  assert.deepStrictEqual(node, {
    "@type": "Collection",
    "@id": "https://www.remiforge.dev/#list",
    url: "https://www.remiforge.dev/list",
    name: "List",
    inLanguage: language,
    hasPart: parts,
  });
});

it("imageObject builds a sized ImageObject", () => {
  assert.deepStrictEqual(imageObject("https://www.remiforge.dev/img.jpg", 100, 200), {
    "@type": "ImageObject",
    url: "https://www.remiforge.dev/img.jpg",
    width: 100,
    height: 200,
  });
});

it("breadcrumb builds a two-item trail with translated home label", () => {
  const trail = breadcrumb(language, "https://www.remiforge.dev/test", "Test Page");

  assert.deepStrictEqual(trail, {
    "@type": "BreadcrumbList",
    "@id": "https://www.remiforge.dev/test#breadcrumb",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: HOME_URL },
      { "@type": "ListItem", position: 2, name: "Test Page", item: "https://www.remiforge.dev/test" },
    ],
  });
});

it("breadcrumb uses the Polish label for pl", () => {
  const trail = breadcrumb("pl", "https://www.remiforge.dev/test", "Strona");
  assert.deepStrictEqual(trail.itemListElement?.[0]?.name, "Strona główna");
});

it("personEdge extends the site Person with additional fields", () => {
  const node = personEdge({ worksFor: { "@id": "https://www.remiforge.edu/#org" } });

  assert.deepStrictEqual(node, {
    "@type": "Person",
    "@id": PERSON_ID,
    worksFor: { "@id": "https://www.remiforge.edu/#org" },
  });
});
