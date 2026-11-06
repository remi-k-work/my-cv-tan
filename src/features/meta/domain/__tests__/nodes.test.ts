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
};

it("articleNode builds an Article with author, publisher, about and mainEntityOfPage", () => {
  const node = articleNode({
    id: "https://www.remiforge.dev/#article",
    headline: "Headline",
    description: "Description.",
    preferredLanguage: language,
    about: "https://www.remiforge.dev/#item",
    mainEntityOfPage: "https://www.remiforge.dev/test",
  });

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
  assert.isUndefined(node.image);
});

it("articleNode publishes the page image when one is verified", () => {
  const image = imageObject("https://www.remiforge.dev/images/01-a.webp", 1600, 900);
  const node = articleNode({
    id: "https://www.remiforge.dev/#article",
    headline: "Headline",
    description: "Description.",
    preferredLanguage: language,
    about: "https://www.remiforge.dev/#item",
    mainEntityOfPage: "https://www.remiforge.dev/test",
    image,
  });

  assert.deepStrictEqual(node.image, image);
});

it("webPageNode builds a WebPage node with optional fields conditionally included", () => {
  const node = webPageNode({
    type: "WebPage",
    ...baseWebPageInput,
    breadcrumb: true,
    mainEntity: { "@id": "https://www.remiforge.dev/#item" },
    primaryImageOfPage: { "@type": "ImageObject", url: "https://www.remiforge.dev/img.jpg", width: 100, height: 100 },
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
