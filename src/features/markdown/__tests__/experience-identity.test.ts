// A crawler may read any one of three surfaces on its own: the HTML <head>, the JSON-LD graph,
// or the Markdown twin. All three restate one experience's SEO identity, and all three are built
// from the single `experienceSeo` record, so the headline, description, canonical and image can
// never disagree about which page and subject they describe. This pins that agreement directly
// instead of relying on each surface's own test to notice a drift by hand.

// services, features, and other libraries
import { assert, it } from "@effect/vitest";
import { experienceSeo } from "@/features/meta/domain/experience-seo";
import { experienceHead } from "@/features/meta/domain/heads";
import { buildExperienceMd } from "../domain/twins";

// types
import type { Experience } from "@/features/experience/domain/models";

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

const translateEn = (source: string): string => source;

it("the head, the JSON-LD graph and the Markdown twin restate one experience identity", () => {
  const preferredLanguage = "pl";
  const seo = experienceSeo({ experience: sampleExperience, preferredLanguage });
  const head = experienceHead({ experience: sampleExperience, preferredLanguage });
  const graph = JSON.parse(head.scripts?.[0]?.children ?? "{}") as { readonly "@graph": ReadonlyArray<Record<string, unknown>> };
  const webPage = graph["@graph"].find((node) => node["@type"] === "WebPage");
  const twin = buildExperienceMd({ experience: sampleExperience, preferredLanguage, translate: translateEn });

  const metaContent = (key: string) => {
    const meta = JSON.parse(JSON.stringify(head.meta)) as ReadonlyArray<Record<string, string>>;
    return meta.find((tag) => tag["property"] === key || tag["name"] === key)?.content;
  };

  // One headline: the og:title, the WebPage node and the twin's H1.
  assert.strictEqual(metaContent("og:title"), seo.headline);
  assert.strictEqual(webPage?.["name"], seo.headline);
  assert.include(twin, `# ${seo.headline}`);

  // One description: the meta description, the WebPage node, and the twin frontmatter plus pull
  // quote. The twin reuses the excerpt verbatim rather than summarizing the body a second way.
  assert.strictEqual(metaContent("description"), seo.description);
  assert.strictEqual(webPage?.["description"], seo.description);
  assert.include(twin, `description: ${JSON.stringify(seo.description)}`);

  // One canonical: the <link>, og:url, the WebPage url and the twin frontmatter.
  assert.strictEqual(head.links?.find(({ rel }) => rel === "canonical")?.href, seo.canonical);
  assert.strictEqual(metaContent("og:url"), seo.canonical);
  assert.strictEqual(webPage?.["url"], seo.canonical);
  assert.include(twin, `canonical: ${JSON.stringify(seo.canonical)}`);

  // One screenshot: the og:image src and the graph's ImageObject name the same verified file.
  const primaryImage = webPage?.["primaryImageOfPage"] as { readonly url?: string } | undefined;
  assert.strictEqual(primaryImage?.url, metaContent("og:image"));
  assert.include(metaContent("og:image") ?? "", "/images/01-a.webp");
});
