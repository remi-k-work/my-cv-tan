import { assert, it } from "@effect/vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { contactHead, educationHead, experienceHead, homeHead } from "@/features/meta/domain/page-head";
import { STATIC_PAGES, STATIC_PAGE_PATHS, staticPageCopy } from "@/features/meta/domain/pages";
import { ExperienceIdentity } from "@/features/experience/ui/experience-identity";
import { BRANDED_TITLE, DOWNLOADABLE_DOCUMENTS } from "@/features/meta/domain/constants";
import { absoluteUrl } from "@/features/meta/domain/urls";
import { buildSitemapXml } from "@/features/meta/domain/sitemap";
import { mdResponse } from "../../services/responses";
import { buildLlmsTxt } from "../indexes";
import { buildContactMd, buildEducationMd, buildHomeMd } from "../twins";
import { buildExperienceMd } from "../detail-twin";
import { twinDocument } from "../format";
import { sampleExperience, stablePageTitles, translateEn } from "@/features/markdown/__tests__/fixtures";
import type { PagePath, PreferredLanguage } from "@/domain/models";
import type { PageHead } from "@/features/meta/domain/models";
import { experienceSeo } from "@/features/meta/domain/helpers";

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

    // The branded document title is one template applied to the catalogue's own SEO title. Both
    // surfaces read it from BRANDED_TITLE, so a separator change cannot leave the twin's frontmatter
    // spelling the head's <title> a different way.
    assert.include(JSON.stringify(head.meta), JSON.stringify({ title: BRANDED_TITLE(copy.seoTitle) }));
    assert.include(twin, `title: ${JSON.stringify(BRANDED_TITLE(copy.seoTitle))}`);
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

it("a page's advertised twin URL is the very URL the twin route answers on", async () => {
  // The <head> names its twin with `link rel=alternate`; the twin response names itself with
  // Content-Location. The two are computed on opposite sides of the feature boundary — the head
  // builds the URL from the page's twin path, the twin response builds it from its own route — so
  // only comparing them catches a crawler following the head's link onto a document that denies
  // being the one that page advertised.
  const twinLocationOf = (head: PageHead) => head.links?.find(({ rel }) => rel === "alternate")?.href;

  for (const preferredLanguage of ["en", "pl"] as const satisfies ReadonlyArray<PreferredLanguage>) {
    // Keyed by PagePath rather than listed by hand, so a page added to the catalogue is a compile
    // error here until this test names its head too.
    const heads: Readonly<Record<PagePath, PageHead>> = {
      "/": homeHead({ pageTitles: stablePageTitles, experienceList: [], preferredLanguage }),
      "/education": educationHead({ pageTitles: stablePageTitles, educationList: [], preferredLanguage }),
      "/contact": contactHead({ pageTitles: stablePageTitles, preferredLanguage }),
    };

    for (const path of STATIC_PAGE_PATHS) {
      const response = mdResponse({ body: "", preferredLanguage, canonical: absoluteUrl(path), markdownPath: STATIC_PAGES[path].mdHref });

      assert.strictEqual(twinLocationOf(heads[path]), response.headers.get("Content-Location"), `${path} (${preferredLanguage}) advertised twin URL`);
    }
  }

  // The detail page does the same off its SEO record, so the two surfaces agree for every page kind.
  const detail = experienceHead({ experience: sampleExperience, preferredLanguage: "en" });
  const detailResponse = mdResponse({
    body: "",
    preferredLanguage: "en",
    canonical: experienceSeo({ experience: sampleExperience, preferredLanguage: "en" }).canonical,
    markdownPath: experienceSeo({ experience: sampleExperience, preferredLanguage: "en" }).markdownPath,
  });

  assert.strictEqual(twinLocationOf(detail), detailResponse.headers.get("Content-Location"), "detail page advertised twin URL");
});
