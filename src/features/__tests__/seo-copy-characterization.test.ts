// Characterization snapshot of every localized SEO/GEO surface *before* the simplification
//
// These tests deliberately pin today's exact EN/PL output, not the current implementation: the point
// is that any change during Phase A shows up as a diff here first; each block names the step that is
// expected to change it; a failure without such a note is a regression, not an intended change
//
// Page copy is resolved from the real static-page catalogue (the authored data the site serves) so the
// assertions describe what the site publishes, not a test-only fixture

import { assert, describe, it } from "@effect/vitest";
import { Option } from "effect";
import { STATIC_PAGES, STATIC_PAGE_PATHS, staticPageCopy } from "@/domain/pages";
import { contactHead, educationHead, experienceHead, homeHead } from "@/features/document-head/domain/page-head";
import { notFoundHead, unavailableHead } from "@/features/document-head/domain/fallback";
import { metaOf, tagContent } from "@/features/document-head/domain/__tests__/readers";
import { graphOf, nodeOf } from "@/features/jsonld/domain/__tests__/fixtures";
import { buildContactMd, buildEducationMd, buildExperienceMd, buildHomeMd } from "@/features/markdown/domain/twins";
import { twinDocument } from "@/features/markdown/domain/format";
import { escapeMd, escapeMdInline } from "@/features/markdown/domain/escape";
import { buildNotFoundMd, unavailableMarkdownBody } from "@/features/markdown/domain/fallback";
import { buildLlmsTxt } from "@/features/discovery/domain/llms";
import { buildSitemapXml } from "@/features/discovery/domain/sitemap";
import { experienceSeo } from "@/features/experience/domain/seo";
import { DOWNLOADABLE_DOCUMENTS } from "@/domain/discovery";
import { absoluteUrl } from "@/domain/urls";
import { INDEXABLE_ROBOTS, NOINDEX_FOLLOW } from "@/domain/http";
import { CONTACT_PATH, EDUCATION_PATH, HOME_PATH } from "@/domain/constants";
import { sampleEducation, sampleEmployment, samplePortfolio, translateEn, translatePl } from "@/testing/fixtures";

// types
import type { PageHead } from "@/features/document-head/domain/models";
import type { PagePath, PreferredLanguage } from "@/domain/models";

const HEADS: { readonly [P in PagePath]: (preferredLanguage: PreferredLanguage) => PageHead } = {
  [HOME_PATH]: (preferredLanguage) => homeHead({ experienceList: [], preferredLanguage }),
  [EDUCATION_PATH]: (preferredLanguage) => educationHead({ educationList: [], preferredLanguage }),
  [CONTACT_PATH]: (preferredLanguage) => contactHead({ preferredLanguage }),
};

const metaContent = (head: PageHead, key: "name" | "property", value: string) => tagContent(metaOf(head), key, value);

const markdownLinkOf = (head: PageHead) => head.links.find(({ rel, type }) => rel === "alternate" && type === "text/markdown")?.href;

// The authored head copy, frozen verbatim. English is the source; Polish is the hand-written
// per-language record the refactor replaces with one `msg` source plus the dictionary.
const STATIC_HEAD_EXPECTED = {
  [HOME_PATH]: {
    en: {
      title: "Web Developer in Rzeszów, Poland",
      description: "Remi Forge is a web developer in Rzeszów, Poland, building modern web applications with React, TypeScript, and full-stack tools.",
    },
    pl: {
      title: "Programista stron internetowych w Rzeszowie",
      description: "Remi Forge to programista stron internetowych z Rzeszowa, który tworzy aplikacje z użyciem React, TypeScript i nowoczesnych technologii.",
    },
  },
  [EDUCATION_PATH]: {
    en: {
      title: "Education & Certificates",
      description: "Explore Remi Forge's Interactive Media degree, computer science studies, and web development certificates.",
    },
    pl: {
      title: "Wykształcenie i certyfikaty",
      description: "Poznaj wykształcenie Remiego Forge: studia z informatyki, dyplom z mediów interaktywnych i certyfikaty.",
    },
  },
  [CONTACT_PATH]: {
    en: {
      title: "Contact",
      description: "Contact Remi Forge in Rzeszów, Poland about web development, collaboration, or project opportunities.",
    },
    pl: {
      title: "Kontakt",
      description: "Skontaktuj się z Remim Forge w sprawie tworzenia stron internetowych, współpracy lub projektów.",
    },
  },
} as const;

describe("static page heads keep their authored EN/PL copy", () => {
  for (const pagePath of STATIC_PAGE_PATHS) {
    for (const language of ["en", "pl"] as const) {
      it(`${pagePath} (${language})`, () => {
        const expected = STATIC_HEAD_EXPECTED[pagePath][language];
        const head = HEADS[pagePath](language);

        assert.strictEqual(metaContent(head, "property", "og:title"), expected.title);
        assert.strictEqual(metaContent(head, "name", "description"), expected.description);
        assert.deepStrictEqual(head.meta[0], { title: `Remi Forge ● ${expected.title}` });
        assert.strictEqual(metaContent(head, "name", "robots"), INDEXABLE_ROBOTS);

        const canonical = absoluteUrl(pagePath);
        assert.strictEqual(head.links.find(({ rel }) => rel === "canonical")?.href, canonical);
        // Step A2 drops the `?lang=` pin and advertises the single English twin instead.
        assert.strictEqual(markdownLinkOf(head), `${absoluteUrl(STATIC_PAGES[pagePath].mdHref)}?lang=${language}`);

        const graph = graphOf(head.scripts?.[0]?.children);
        const pageNode = graph.find((node) => node["url"] === canonical && ["ProfilePage", "CollectionPage", "ContactPage"].includes(String(node["@type"])));
        assert.isDefined(pageNode, `${pagePath} JSON-LD page node`);
        assert.strictEqual(pageNode?.["name"], expected.title);
        assert.strictEqual(pageNode?.["description"], expected.description);
        assert.strictEqual(pageNode?.["inLanguage"], language);
      });
    }
  }
});

describe("experience heads and graphs keep their EN/PL identity", () => {
  it("employment EN", () => {
    const head = experienceHead({ experience: sampleEmployment, preferredLanguage: "en" });
    const graph = graphOf(head.scripts?.[0]?.children);
    const page = nodeOf(graph, "WebPage");
    const article = nodeOf(graph, "Article");
    const role = nodeOf(graph, "EmployeeRole");

    assert.strictEqual(metaContent(head, "property", "og:title"), "Full-Stack Developer at Sample Co");
    assert.strictEqual(metaContent(head, "name", "description"), "Built things with **care** and #hashtags.");
    assert.strictEqual(page?.["name"], "Full-Stack Developer at Sample Co");
    assert.strictEqual(page?.["inLanguage"], "en");
    // Step A7 removes the duplicate Article node and its articleBody/articleSection.
    assert.strictEqual(article?.["headline"], "Full-Stack Developer at Sample Co");
    assert.strictEqual(article?.["articleBody"], "Built things with **care** and #hashtags.");
    assert.strictEqual(article?.["articleSection"], "employment");
    assert.strictEqual(role?.["@type"], "EmployeeRole");
  });

  it("employment PL", () => {
    const head = experienceHead({ experience: sampleEmployment, preferredLanguage: "pl" });
    const graph = graphOf(head.scripts?.[0]?.children);
    const page = nodeOf(graph, "WebPage");
    const article = nodeOf(graph, "Article");

    assert.strictEqual(metaContent(head, "property", "og:title"), "Full-Stack Developer w Sample Co");
    assert.strictEqual(page?.["inLanguage"], "pl");
    assert.strictEqual(article?.["headline"], "Full-Stack Developer w Sample Co");
    assert.strictEqual(metaContent(head, "property", "og:image:alt"), "Zrzut ekranu przedstawiający Full-Stack Developer w Sample Co");
  });

  it("portfolio EN and PL", () => {
    const en = experienceHead({ experience: samplePortfolio, preferredLanguage: "en" });
    const pl = experienceHead({ experience: samplePortfolio, preferredLanguage: "pl" });

    assert.strictEqual(metaContent(en, "property", "og:title"), "Full-Stack Developer");
    assert.strictEqual(metaContent(en, "property", "article:section"), "portfolio");
    assert.strictEqual(metaContent(pl, "property", "og:title"), "Projekt osobisty: Full-Stack Developer");
    assert.strictEqual(metaContent(pl, "property", "og:image:alt"), "Zrzut ekranu przedstawiający Projekt osobisty: Full-Stack Developer");
  });
});

describe("error heads (404/503) keep their EN/PL envelope", () => {
  it("not-found EN and PL", () => {
    const en = notFoundHead("en");
    assert.deepStrictEqual(en.meta[0], { title: "Remi Forge ● Not Found" });
    assert.strictEqual(metaContent(en, "name", "description"), "The requested page could not be found.");
    assert.strictEqual(metaContent(en, "name", "robots"), NOINDEX_FOLLOW);
    assert.deepStrictEqual(en.links, []);
    // Step A5 removes every JSON-LD entity from error heads: a noindex 404 is not site content.
    const graph = graphOf(en.scripts?.[0]?.children);
    assert.isDefined(nodeOf(graph, "WebSite"));
    assert.isDefined(nodeOf(graph, "Person"));
    assert.isDefined(nodeOf(graph, "Organization"));

    const pl = notFoundHead("pl");
    assert.deepStrictEqual(pl.meta[0], { title: "Remi Forge ● Nie znaleziono" });
    assert.strictEqual(metaContent(pl, "name", "description"), "Nie znaleziono żądanej strony.");
  });

  it("unavailable EN and PL", () => {
    const en = unavailableHead("/contact", "en");
    assert.deepStrictEqual(en.meta[0], { title: "Remi Forge ● Page unavailable" });
    assert.strictEqual(metaContent(en, "name", "description"), "This page is temporarily unavailable.");
    assert.deepStrictEqual(en.links, [{ rel: "canonical", href: "https://www.remiforge.dev/contact" }]);

    const pl = unavailableHead("/contact", "pl");
    assert.deepStrictEqual(pl.meta[0], { title: "Remi Forge ● Strona niedostępna" });
    assert.strictEqual(metaContent(pl, "name", "description"), "Ta strona jest tymczasowo niedostępna.");
  });
});

describe(".md twins keep their current EN/PL copy and language pin", () => {
  for (const language of ["en", "pl"] as const) {
    const translate = language === "en" ? translateEn : translatePl;

    it(`home twin (${language})`, () => {
      const copy = staticPageCopy(HOME_PATH, language);
      const twin = twinDocument(buildHomeMd({ experienceList: [sampleEmployment], preferredLanguage: language, translate }));

      assert.include(twin, `# ${escapeMdInline(copy.heading)}`);
      assert.include(twin, `> ${escapeMdInline(copy.description)}`);
      assert.include(twin, escapeMd(copy.intro));
      assert.include(twin, `lang: ${JSON.stringify(language)}`);
      assert.include(twin, `canonical: ${JSON.stringify(copy.canonical)}`);
      assert.include(twin, `type: "overview"`);
      assert.include(twin, `## ${escapeMdInline(translate("Pages"))}`);
      // Step A1 removed the rotating authored intro; the twin now reads the catalogue intro.
      assert.strictEqual(copy.intro, STATIC_PAGES[HOME_PATH].copy[language].intro);
    });

    it(`education twin (${language})`, () => {
      const copy = staticPageCopy(EDUCATION_PATH, language);
      const twin = twinDocument(buildEducationMd({ educationList: sampleEducation, preferredLanguage: language, translate }));

      assert.include(twin, `# ${escapeMdInline(copy.heading)}`);
      assert.include(twin, `type: "education"`);
      assert.include(twin, `## ${escapeMdInline(translate("Documents"))}`);
      assert.include(twin, "Pratt Institute");
    });

    it(`contact twin (${language})`, () => {
      const copy = staticPageCopy(CONTACT_PATH, language);
      const twin = twinDocument(buildContactMd({ preferredLanguage: language, translate }));

      assert.include(twin, `# ${escapeMdInline(copy.heading)}`);
      assert.include(twin, `type: "contact"`);
      assert.include(twin, `## ${escapeMdInline(translate("Channels"))}`);
      assert.include(twin, "Email: remi.k.work@proton.me");
    });

    it(`experience twin (${language})`, () => {
      const seo = experienceSeo({ experience: sampleEmployment, preferredLanguage: language });
      const twin = twinDocument(buildExperienceMd({ seo, translate }));

      assert.include(twin, `# ${escapeMdInline(seo.title)}`);
      assert.include(twin, `lang: ${JSON.stringify(language)}`);
      assert.include(twin, `type: "work-experience"`);
      assert.include(twin, `## ${escapeMdInline(translate("Overview"))}`);
    });
  }

  // Step A2 makes every twin English-only: this block disappears and a head advertises the same
  // single English twin regardless of the HTML language it serves.
});

describe("error Markdown keeps its current prose", () => {
  it("not-found body keeps its four branches", () => {
    const noSlug = buildNotFoundMd({ slug: Option.none(), preferredLanguage: "en", translate: translateEn });
    assert.include(noSlug.body, "# Not Found");
    assert.strictEqual(noSlug.facts.description, "No page for this address.");
    assert.include(noSlug.body, "No Markdown document exists for this address.");

    const withSlug = buildNotFoundMd({ slug: Option.some("missing"), preferredLanguage: "en", translate: translateEn });
    assert.strictEqual(withSlug.facts.description, `No page for slug "missing".`);
    assert.include(withSlug.body, "No Markdown document exists for /missing.");

    const pl = buildNotFoundMd({ slug: Option.none(), preferredLanguage: "pl", translate: translatePl });
    assert.include(pl.body, "# Nie znaleziono");
    assert.strictEqual(pl.facts.description, "Nie znaleziono strony dla tego adresu.");

    // Step A5 collapses the four variants to one message plus a home link.
  });

  it("unavailable body keeps its EN message", () => {
    const body = unavailableMarkdownBody(translateEn);
    assert.include(body, "# Content temporarily unavailable");
    assert.include(body, "The required portfolio content could not be loaded. Please try again shortly.");
  });
});

describe("llms.txt keeps its current discovery structure", () => {
  it("EN source document", () => {
    const txt = buildLlmsTxt([sampleEmployment]);

    assert.include(txt, "# Remi Forge");
    assert.include(txt, "## Pages");
    assert.include(txt, "- Website: https://www.remiforge.dev");
    assert.include(txt, "- Based in: Rzeszów, Poland (PL)");
    assert.include(txt, "## Work Experience");
    assert.include(txt, "## Discovery");
    assert.include(txt, "## Optional");
    assert.include(txt, "https://www.remiforge.dev/llms-full.txt");
    // Step A3 removes the llms-full pointer; Step A4 trims the Discovery section and language pins.
    assert.include(txt, "?lang=pl");
    assert.include(txt, "?lang=en");
  });
});

describe("sitemap.xml keeps its current entries", () => {
  it("static, image, experience and download entries", () => {
    const xml = buildSitemapXml([sampleEmployment]);

    for (const path of STATIC_PAGE_PATHS) assert.include(xml, `<loc>${absoluteUrl(path)}</loc>`);
    assert.include(xml, "<image:loc>https://www.remiforge.dev/opengraph-image.jpg</image:loc>");
    assert.include(xml, "<loc>https://www.remiforge.dev/sample-role</loc>");
    assert.include(xml, "<image:loc>https://www.remiforge.dev/images/01-a.webp</image:loc>");
    for (const { href } of DOWNLOADABLE_DOCUMENTS) assert.include(xml, `<loc>${absoluteUrl(href)}</loc>`);

    // Step A8 may trim the PDF entries and/or the image extension.
  });
});
