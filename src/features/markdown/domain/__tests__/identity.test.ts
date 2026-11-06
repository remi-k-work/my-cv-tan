// A crawler may read any one of three surfaces on its own: the HTML <head>, the JSON-LD graph,
// or the Markdown twin. Each surface restates a page's SEO identity, and each is built from the
// one record that owns it — `experienceSeo` for a detail page, the static page catalogue for the
// three list pages — so the headline, description, canonical and image can never disagree about
// which page and subject they describe. This pins that agreement directly instead of relying on
// each surface's own test to notice a drift by hand.

// services, features, and other libraries
import { assert, it } from "@effect/vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { experienceSeo } from "@/features/meta/domain/experience-seo";
import { contactHead, educationHead, experienceHead, homeHead } from "@/features/meta/domain/page-head";
import { STATIC_PAGES, staticPageCopy } from "@/features/meta/domain/pages";
import { ExperienceIdentity } from "@/features/experience/ui/experience-identity";
import { DOWNLOADABLE_DOCUMENTS } from "@/features/meta/domain/constants";
import { absoluteUrl } from "@/features/meta/domain/urls";
import { buildSitemapXml } from "@/features/meta/domain/discovery";
import { buildLlmsTxt } from "../indexes";
import { buildContactMd, buildEducationMd, buildExperienceMd, buildHomeMd } from "../twins";
import { twinDocument } from "../format";

// types
import type { PageTitles } from "@/domain/models";
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

const stablePageTitles: PageTitles = {
  "/": { eyebrow: "Home", heading: "Stable home title", intro: "Stable home description." },
  "/education": { eyebrow: "Education", heading: "Stable education title", intro: "Stable education description." },
  "/contact": { eyebrow: "Contact", heading: "Stable contact title", intro: "Stable contact description." },
};

it("the head, JSON-LD, Markdown twin and visible detail heading share one experience identity", () => {
  const preferredLanguage = "pl";
  const seo = experienceSeo({ experience: sampleExperience, preferredLanguage });
  const head = experienceHead({ experience: sampleExperience, preferredLanguage });
  const graph = JSON.parse(head.scripts?.[0]?.children ?? "{}") as { readonly "@graph": ReadonlyArray<Record<string, unknown>> };
  const webPage = graph["@graph"].find((node) => node["@type"] === "WebPage");
  const twin = twinDocument(buildExperienceMd({ seo, translate: translateEn }));

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

  // The route's visible H1 uses this same localized headline rather than the homepage heading.
  const identity = renderToStaticMarkup(createElement(ExperienceIdentity, { experience: sampleExperience, heading: seo.headline, headingLevel: 1 }));
  assert.include(identity, `<h1 class="text-xl">${seo.headline}</h1>`);

  // One screenshot: the og:image src and the graph's ImageObject name the same verified file.
  const primaryImage = webPage?.["primaryImageOfPage"] as { readonly url?: string } | undefined;
  assert.strictEqual(primaryImage?.url, metaContent("og:image"));
  assert.include(metaContent("og:image") ?? "", "/images/01-a.webp");
});

it("each static page's head and twin publish the same canonical, title and description", () => {
  // The static half of the same agreement: the HTML head and the Markdown twin both read the
  // catalogue record for the page, so a crawler reading either one alone resolves one citation
  // target and one description — compared against the catalogue rather than restated by hand.
  const preferredLanguage = "pl";
  const pages = [
    { path: "/", head: homeHead, twin: buildHomeMd },
    { path: "/education", head: educationHead, twin: buildEducationMd },
    { path: "/contact", head: contactHead, twin: buildContactMd },
  ] as const;

  for (const { path, head: buildHead, twin: buildTwin } of pages) {
    const copy = staticPageCopy(stablePageTitles, path, preferredLanguage);
    const head = buildHead({ pageTitles: stablePageTitles, experienceList: [], educationList: [], preferredLanguage });
    const twin = twinDocument(buildTwin({ pageTitles: stablePageTitles, experienceList: [], educationList: [], preferredLanguage, translate: translateEn }));

    const metaContent = (key: string) => {
      const meta = JSON.parse(JSON.stringify(head.meta)) as ReadonlyArray<Record<string, string>>;
      return meta.find((tag) => tag["property"] === key || tag["name"] === key)?.content;
    };
    const canonical = head.links?.find(({ rel }) => rel === "canonical")?.href;

    assert.strictEqual(canonical, copy.canonical, `${path} canonical`);
    assert.strictEqual(metaContent("og:url"), copy.canonical, `${path} og:url`);
    assert.include(twin, `canonical: ${JSON.stringify(copy.canonical)}`, `${path} twin canonical`);

    assert.strictEqual(metaContent("description"), copy.description, `${path} description`);
    assert.include(twin, `description: ${JSON.stringify(copy.description)}`, `${path} twin description`);

    // The branded document title is one template applied to the catalogue's own SEO title.
    assert.include(JSON.stringify(head.meta), JSON.stringify({ title: `Remi Forge ● ${copy.seoTitle}` }));
    assert.include(twin, `title: ${JSON.stringify(`Remi Forge ● ${copy.seoTitle}`)}`);
    // The twin route the head advertises is the route the catalogue declares.
    assert.strictEqual(
      head.links?.find(({ rel }) => rel === "alternate")?.href,
      `https://www.remiforge.dev${STATIC_PAGES[path].mdHref}?lang=${preferredLanguage}`
    );
  }
});

it("every advertised download is published by the sitemap, the AI index and the education twin alike", () => {
  // DOWNLOADABLE_DOCUMENTS is declared once and projected onto three surfaces. Each surface's own
  // test checks its copy of the list, which cannot notice a document that a fourth projection
  // forgot; comparing the three outputs against each other is what actually catches a new download
  // appearing on one surface and going missing from another.
  const sitemap = buildSitemapXml([]);
  const index = buildLlmsTxt([]);
  const twin = twinDocument(buildEducationMd({ pageTitles: stablePageTitles, educationList: [], preferredLanguage: "en", translate: translateEn }));

  for (const document of DOWNLOADABLE_DOCUMENTS) {
    const url = absoluteUrl(document.href);

    assert.include(sitemap, `<loc>${url}</loc>`);
    // The AI index renders it as a Markdown link under "Optional", the shared download list
    assert.include(index, `](${url})`);
    // The education twin renders the same list under its "Documents" section
    assert.include(twin, `](${url})`);
  }

  // Exactly three downloads, so a surface cannot quietly parse a longer or shorter list
  assert.strictEqual(DOWNLOADABLE_DOCUMENTS.length, 3);
});
