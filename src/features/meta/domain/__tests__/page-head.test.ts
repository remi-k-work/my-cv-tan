// Direct unit tests for the shared page head layout in ./page-head.
// `pageHead` merges title, indexing directives, social cards, links and the
// JSON-LD graph into one PageHead. `experienceHead` and the static page
// heads all build on it.

// services, features, and other libraries
import { assert, it } from "@effect/vitest";

// domain
import { pageHead, experienceHead, contactHead } from "../page-head";

// types
import type { SocialMetaInput } from "../social-meta";
import type { JsonLdNodes, PageHead } from "../models";
import type { PageTitles, PreferredLanguage } from "@/domain/models";
import type { Experience } from "@/features/experience/domain/models";

// constants
import { BRANDED_TITLE, GLOBAL_SOCIAL_IMAGE } from "../constants";
import { INDEXABLE_ROBOTS } from "@/domain/http";

const language: PreferredLanguage = "en";

const social: SocialMetaInput = {
  title: "Headline",
  description: "Description.",
  canonical: "https://www.remiforge.dev/test",
  image: GLOBAL_SOCIAL_IMAGE,
  preferredLanguage: language,
};

const graph: JsonLdNodes = [{ "@type": "WebPage", "@id": "https://www.remiforge.dev/test", name: "Test" }];

const stablePageTitles: PageTitles = {
  "/": { eyebrow: "Home", heading: "Home", intro: "Home description." },
  "/education": { eyebrow: "Education", heading: "Education", intro: "Education description." },
  "/contact": { eyebrow: "Contact", heading: "Contact", intro: "Contact description." },
};

const sampleExperience: Experience = {
  type: "p",
  slug: "sample-role",
  year: "Mar 2026",
  role: "Full-Stack Developer",
  company: "Sample Co",
  txt: "Built things with care.",
  gitHubLink: "https://github.com/example/repo",
  imageName: "01",
  skillsUsed: ["TypeScript", "React"],
};

const metaOf = (head: PageHead) => JSON.parse(JSON.stringify(head.meta)) as ReadonlyArray<Record<string, string>>;

// Finds a tag by its property or name and returns its content, or undefined when absent.
const tagContent = (tags: ReadonlyArray<Record<string, string>>, key: "property" | "name", value: string) => tags.find((tag) => tag[key] === value)?.content;

it("pageHead builds a flat head with title, description, robots and social tags", () => {
  const head = pageHead({ social, markdownPath: "/test.md", graph });
  const tags = metaOf(head);

  assert.deepStrictEqual(head.meta?.[0], { title: BRANDED_TITLE("Headline") });
  assert.strictEqual(tagContent(tags, "name", "description"), "Description.");
  assert.strictEqual(tagContent(tags, "name", "robots"), INDEXABLE_ROBOTS);
  assert.strictEqual(tagContent(tags, "property", "og:title"), "Headline");
  assert.strictEqual(tagContent(tags, "property", "og:description"), "Description.");
  // title + description + robots + social tags (og + twitter + alternate locales)
  assert.strictEqual(head.meta.length, 22);
});

it("pageHead publishes the page's own canonical and Markdown alternate links", () => {
  const head = pageHead({ social, markdownPath: "/test.md", graph });

  assert.deepStrictEqual(head.links?.[0], { rel: "canonical", href: "https://www.remiforge.dev/test" });
  assert.deepStrictEqual(head.links?.[1], {
    rel: "alternate",
    type: "text/markdown",
    href: "https://www.remiforge.dev/test.md?lang=en",
  });
  // Site-wide discovery and identity links live on the root head; the leaf adds nothing site-wide
  assert.strictEqual(head.links?.length, 2);
  assert.notInclude(JSON.stringify(head.links), '"rel":"llms"');
  assert.notInclude(JSON.stringify(head.links), '"rel":"author"');
});

it("pageHead publishes exactly one JSON-LD block merging site entities with the page graph", () => {
  const head = pageHead({ social, markdownPath: "/test.md", graph });
  assert.strictEqual(head.scripts?.length, 1);
  const payload = JSON.parse(head.scripts?.[0]?.children ?? "{}");
  assert.strictEqual(payload["@context"], "https://schema.org");
  assert.isDefined(payload["@graph"].find((node: { "@type"?: string }) => node["@type"] === "WebSite"));
  assert.isDefined(payload["@graph"].find((node: { "@type"?: string }) => node["@type"] === "Person"));
  assert.isDefined(payload["@graph"].find((node: { "@type"?: string }) => node["@type"] === "WebPage"));
});

it("experienceHead builds on pageHead with article social type and canonical link", () => {
  const head = experienceHead({ experience: sampleExperience, preferredLanguage: language });
  const tags = metaOf(head);

  assert.strictEqual(tagContent(tags, "property", "og:type"), "article");
  assert.strictEqual(head.links?.find((link) => link.rel === "canonical")?.href, "https://www.remiforge.dev/sample-role");
  assert.strictEqual(tagContent(tags, "property", "og:url"), "https://www.remiforge.dev/sample-role");
  assert.strictEqual(head.scripts?.length, 1);
});

it("experienceHead uses the global banner for Twitter when no screenshot exists", () => {
  const head = experienceHead({ experience: { ...sampleExperience, imageName: "" }, preferredLanguage: language });
  const tags = metaOf(head);

  assert.strictEqual(tagContent(tags, "name", "twitter:image"), GLOBAL_SOCIAL_IMAGE.src);
  assert.strictEqual(tagContent(tags, "property", "og:image"), GLOBAL_SOCIAL_IMAGE.src);
});

it("static page heads share the layout, each supplying its own canonical and Markdown twin", () => {
  const head = contactHead({ pageTitles: stablePageTitles, preferredLanguage: language });
  const tags = metaOf(head);

  assert.strictEqual(tagContent(tags, "name", "robots"), INDEXABLE_ROBOTS);
  assert.strictEqual(tagContent(tags, "property", "og:type"), "website");
  assert.strictEqual(head.links?.[0]?.href, "https://www.remiforge.dev/contact");
  assert.strictEqual(head.links?.[1]?.href, "https://www.remiforge.dev/contact.md?lang=en");
  assert.strictEqual(head.scripts?.length, 1);
});
