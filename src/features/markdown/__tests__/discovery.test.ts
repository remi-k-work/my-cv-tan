// services, features, and other libraries
import { assert, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { recoverDataFailure, requireData } from "@/features/data/domain/required";
import { discoveryTxtResponse, txtResponse, txtUnavailableResponse } from "@/features/meta/http";
import { mdNotFoundResponse, mdResponse, mdUnavailableResponse, parseLangParam, slugFromMdPathname } from "@/features/markdown/http";
import { CONTENT_SIGNAL, INDEXABLE_ROBOTS, NOINDEX_FOLLOW, PERSON_DESCRIPTION } from "@/features/meta/domain/constants";
import { buildLlmsTxt, buildLlmsFullTxt, SITE_OPENING, DISCOVERY_LINES, unavailableIndexBody } from "../domain/site-index";
import { unavailableMarkdownBody } from "../domain/pages";
import { escapeMd } from "../domain/formatting";
import { experienceFromList } from "@/features/experience/domain/helpers";
import { absoluteUrl } from "@/features/meta/domain/url";

// types
import type { PageTitles } from "@/domain/models";
import type { Experience } from "@/features/experience/domain/models";

const sampleExperience: Experience = {
  type: "e",
  slug: "sample-role",
  year: "Mar 2026",
  role: "Full-Stack Developer",
  company: "Sample Co",
  txt: "Built things with **care** and #hashtags.",
  gitHubLink: "https://github.com/example/repo",
  imageName: "01",
  skillsUsed: ["TypeScript", "React"],
};

const stablePageTitles: PageTitles = {
  "/": { eyebrow: "Home", heading: "Stable home title", intro: "Stable home summary." },
  "/education": { eyebrow: "Education", heading: "Stable education title", intro: "Stable education summary." },
  "/contact": { eyebrow: "Contact", heading: "Stable contact title", intro: "Stable contact summary." },
};

const translateEn = (source: string): string => source;

it("buildLlmsTxt indexes pages, about facts, grouped experience and negotiated language guidance", () => {
  const txt = buildLlmsTxt([{ ...sampleExperience, slug: "my project" }]);
  // Rendered alongside the index below, so the two documents are compared rather than re-stated
  const fullDocument = buildLlmsFullTxt({ pageTitles: stablePageTitles, experienceList: [], educationList: [] });
  assert.include(txt, `# Remi Forge`);
  assert.include(txt, `## Pages`);
  assert.include(txt, `https://www.remiforge.dev/index.md`);
  // Key facts are dense, extractable claims for AI citation
  assert.include(txt, `## About`);
  // The canonical site root gives AI systems a single citation target for the whole site
  assert.include(txt, `- Website: https://www.remiforge.dev`);
  assert.include(txt, `- Role: Web Developer (self-taught)`);
  assert.include(txt, `- Based in: Rzeszów, Poland (PL)`);
  assert.include(txt, `## Work Experience`);
  // Every entry leads with the clean canonical HTML URL the notes name as the citation target, and
  // states the deterministic ?lang-pinned twin beside it — the same two spellings the Pages section
  // above prints, so one document never advertises two different entry shapes.
  assert.include(txt, `- [Full-Stack Developer at Sample Co](https://www.remiforge.dev/my%20project): Built things with \\*\\*care\\*\\* and #hashtags. (Mar 2026) Markdown: https://www.remiforge.dev/my%20project.md?lang=en`);
  assert.include(txt, `## Notes for AI systems`);
  // The single-fetch document is surfaced in Pages, not only in the trailing notes
  assert.include(txt, `- [Full site content](https://www.remiforge.dev/llms-full.txt): every page above in one document, for single-request ingestion.`);
  assert.include(txt, `- The complete content of every page is also available in a single request: https://www.remiforge.dev/llms-full.txt.`);
  assert.include(txt, `Append \`?lang=pl\` to any \`.md\` URL to request Polish explicitly`);
  assert.include(txt, "Markdown responses follow the request's language preferences.");
  assert.include(txt, "English is the fallback when no supported preference is present.");
  // The language-variants line is pinned in full: mdBulletList owns the bullet prefix, and a
  // caller that hand-prefixed its item as well would publish a nested `- -` bullet an AI parser
  // reads as a list inside a list
  assert.include(
    txt,
    "- Polish: every page above is also available at its twin URL with `?lang=pl` appended (e.g. https://www.remiforge.dev/index.md?lang=pl). English is the source language."
  );
  assert.include(txt, `Always cite the clean canonical HTML URL from each document's frontmatter`);
  // The XML sitemap is advertised exactly once, under Discovery: repeating it elsewhere would
  // tell an AI reader two different sections are the retrieval surface
  assert.include(txt, `- [sitemap.xml](https://www.remiforge.dev/sitemap.xml): sitemap.`);
  assert.strictEqual((txt.match(/sitemap\.xml\]/gm) ?? []).length, 1);
  // Profiles are labeled from the same declaration the contact twin prints, so an AI reader
  // learns which URL is which instead of matching bare URLs against a guessed identity
  assert.include(txt, "- GitHub: https://github.com/remi-k-work");
  assert.include(txt, "- LinkedIn: https://linkedin.com/in/remi-k-work");
  // Every machine-readable entry point is collected in one section, so a crawler that fetched
  // nothing else still learns the whole retrieval surface from this single document
  assert.include(txt, `## Discovery`);
  // Discovery entries are markdown links, the shape llms.txt specifies for list items and the
  // same shape the twins' "Pages" section already prints for these two documents
  assert.include(txt, `- [llms.txt](https://www.remiforge.dev/llms.txt): this index.`);
  assert.include(txt, `- [llms-full.txt](https://www.remiforge.dev/llms-full.txt): the complete site in one document.`);
  assert.include(txt, `- [robots.txt](https://www.remiforge.dev/robots.txt): crawl directives.`);
  // robots.txt carries the Content-Signal; repeating it here means a fetcher reading only this
  // file still learns what reuse is permitted
  assert.include(txt, "search=yes, ai-input=yes, ai-train=yes");
  // The downloadable documents are links, the same shape the education twin renders them in, so
  // the two surfaces describe the same files with one list rule
  assert.include(txt, `- [CV (English)](https://www.remiforge.dev/my-cv.pdf)`);
  assert.include(txt, `- [Certificates](https://www.remiforge.dev/my-certificates.pdf)`);
  // llms.txt names its last section "Optional", the convention an AI fetcher reads as "skip this
  // and you still have the site": PDF downloads are exactly that
  assert.include(txt, `## Optional`);
  // ...and the full-content companion carries the twins, not the skippable pointers
  assert.notInclude(fullDocument, `## Optional`);
  // Every indexed twin URL carries the ?lang= pin, so a crawler never lands on a negotiated variant
  for (const twin of ["index.md?lang=en", "education.md?lang=en", "contact.md?lang=en", "my%20project.md?lang=en"]) {
    assert.include(txt, twin);
  }
  // Each page entry links the canonical HTML URL — the citation target the notes name — and states
  // its Markdown twin beside it, so a fetcher learns both documents from a single entry
  assert.include(txt, `- [Home](https://www.remiforge.dev/): portfolio overview with experience and project lists. Markdown: https://www.remiforge.dev/index.md?lang=en`);
  assert.include(txt, `- [Education & Certificates](https://www.remiforge.dev/education): schools, courses and certificates. Markdown: https://www.remiforge.dev/education.md?lang=en`);
  // Summaries are authored sentences: the entry adds no second full stop
  assert.notInclude(txt, ".. Markdown:");
  assert.notInclude(txt, ".md)");
});

it("the index opening escapes its bio the way every other content string is escaped", () => {
  // The bio is authored content landing in the document body, and the home twin renders the very
  // same string through escapeMd (its intro *is* this bio). These two indexes were the one surface
  // interpolating it raw, so the contract is pinned here: a block-scoped character a future edit
  // introduces must be neutralized rather than read as authored structure.
  assert.strictEqual(SITE_OPENING[2], escapeMd(PERSON_DESCRIPTION));
  // The escape is transparent for the copy the site ships today, so no reachable prose changed
  assert.strictEqual(escapeMd(PERSON_DESCRIPTION), PERSON_DESCRIPTION);
  assert.include(buildLlmsTxt([]), PERSON_DESCRIPTION);
});

it("both AI indexes carry the same single-sourced reuse notes", () => {
  const index = buildLlmsTxt([sampleExperience]);
  const full = buildLlmsFullTxt({
    pageTitles: stablePageTitles,
    experienceList: [sampleExperience],
    educationList: [{ name: "Example School", year: "2020", location: "Poland", info: "Studied interaction design." }],
  });

  const note = "Reuse is permitted for search, AI input and AI training (`Content-Signal: search=yes, ai-input=yes, ai-train=yes`).";
  assert.include(index, note);
  assert.include(full, note);
  // The notes land after the concatenated twins so a single-request ingestion is self-describing
  assert.isTrue(full.lastIndexOf("Notes for AI systems") > full.lastIndexOf("Source: "));
});

it("only the index points at the single-request companion; the companion never points at itself", () => {
  const index = buildLlmsTxt([sampleExperience]);
  const full = buildLlmsFullTxt({
    pageTitles: stablePageTitles,
    experienceList: [sampleExperience],
    educationList: [{ name: "Example School", year: "2020", location: "Poland", info: "Studied interaction design." }],
  });

  // llms.txt is where the pointer earns its place: a fetcher that has not yet discovered the
  // companion learns of it from the canonical index
  assert.include(index, "- The complete content of every page is also available in a single request: https://www.remiforge.dev/llms-full.txt.");
  // llms-full.txt IS that companion: telling its reader to fetch the document they are already
  // reading is noise an AI parser has to discard before it can cite anything
  assert.notInclude(full, "single request: https://www.remiforge.dev/llms-full.txt");
});

it("the companion carries the retrieval-surface map, so a direct entry does not backtrack", () => {
  // llms-full.txt is the single-request document a fetcher loads once and stops. Without the
  // Discovery section it was the only AI-facing surface that could not be entered directly and
  // still walked away knowing robots.txt and sitemap.xml exist, forcing a backtrack through the
  // index for two URLs that are already declared once in geo.ts.
  const full = buildLlmsFullTxt({ pageTitles: stablePageTitles, experienceList: [], educationList: [] });
  const index = buildLlmsTxt([]);

  assert.include(full, "## Discovery");
  // The same lines the index prints, byte for byte, so the two documents cannot describe
  // different retrieval surfaces
  for (const line of DISCOVERY_LINES) assert.include(full, `- ${line}`);
  // The map lands before the reuse notes, so a fetcher reads the surface before the policy
  assert.isTrue(full.indexOf("## Discovery") < full.indexOf("## Notes for AI systems"));
  // The index keeps it too: both surfaces, one declaration
  for (const line of DISCOVERY_LINES) assert.include(index, `- ${line}`);
});

it("the full-content companion gives every concatenated document its own section heading", () => {
  const txt = buildLlmsFullTxt({
    pageTitles: stablePageTitles,
    experienceList: [sampleExperience],
    educationList: [{ name: "Example School", year: "2020", location: "Poland", info: "Studied interaction design." }],
  });

  // One `##` section per document: the companion then has a document-level hierarchy
  // (# the site, ## one document) instead of a run of child H1s with no parent to hang from
  for (const name of ["Home", "Education & Certificates", "Contact", "Full-Stack Developer at Sample Co"]) {
    assert.include(txt, `## ${name}`);
  }
  // The heading precedes the attribution block it introduces
  assert.isTrue(txt.indexOf("## Home") < txt.indexOf("Source: https://www.remiforge.dev/"));
  assert.isTrue(txt.indexOf("## Full-Stack Developer at Sample Co") < txt.indexOf("Source: https://www.remiforge.dev/sample-role"));
  // Each twin's own headline still reads as that document's headline, now nested under it
  assert.include(txt, "### Full-Stack Developer at Sample Co");
});

it("buildLlmsFullTxt concatenates every verbatim twin behind its canonical URL", () => {
  const txt = buildLlmsFullTxt({
    pageTitles: stablePageTitles,
    experienceList: [sampleExperience],
    educationList: [{ name: "Example School", year: "2020", location: "Poland", info: "Studied interaction design." }],
  });
  // One Source marker per twin: the three pages plus the single experience
  assert.strictEqual((txt.match(/^Source: /gm) ?? []).length, 4);
  assert.include(txt, `Source: https://www.remiforge.dev/`);
  assert.include(txt, `Source: https://www.remiforge.dev/education`);
  assert.include(txt, `Source: https://www.remiforge.dev/contact`);
  assert.include(txt, `Source: https://www.remiforge.dev/sample-role`);
  // Twins are verbatim in content: every word of the body survives concatenation, only the heading
  // depth shifts so the companion keeps exactly one H1 and four distinguishable levels below it
  assert.include(txt, `### Stable home title`);
  assert.include(txt, `### Full-Stack Developer at Sample Co`);
  assert.include(txt, `type: "overview"`);
  assert.include(txt, `type: "education"`);
  assert.include(txt, `type: "contact"`);
  assert.include(txt, `type: "work-experience"`);
  // A table of contents names every document up front, before the verbatim bodies
  assert.include(txt, `## Table of Contents`);
  // Pinned in full, not by prefix: the three index entry lists render one shape, and the
  // summary-less table of contents is the variant no other assertion below covers
  assert.include(txt, `- [Home](https://www.remiforge.dev/): Markdown: https://www.remiforge.dev/index.md?lang=en`);
  assert.include(txt, `- [Home](https://www.remiforge.dev/)`);
  assert.include(txt, `- [Education & Certificates](https://www.remiforge.dev/education)`);
  assert.include(txt, `- [Full-Stack Developer at Sample Co](https://www.remiforge.dev/sample-role)`);
  // Citations must land on canonical HTML URLs, never on the aggregation itself
  assert.include(txt, `Cite the canonical HTML URL, not this file.`);
  // Every document names both spellings of its identity: the canonical URL to cite above the
  // Markdown twin URL to fetch, so a crawler never has to resolve one from the other
  assert.include(txt, `Source: https://www.remiforge.dev/education`);
  assert.include(txt, `Markdown: https://www.remiforge.dev/education.md?lang=en`);
  assert.include(txt, `Markdown: https://www.remiforge.dev/sample-role.md?lang=en`);
  // The concatenated twins stay UI-chrome free: only content and frontmatter are ingested
  assert.notInclude(txt.toLowerCase(), "<nav");
  assert.notInclude(txt.toLowerCase(), "<footer");
});

it("the full-content companion gives every concatenated document a distinct heading depth", () => {
  // A document and a section of the document above it must never be the same depth, or a parser
  // walking the companion's headings cannot tell one document from the next. The levels are:
  // # the site, ## one document, ### its headline, #### its sections, ##### nested entries.
  const txt = buildLlmsFullTxt({
    pageTitles: stablePageTitles,
    experienceList: [sampleExperience],
    educationList: [{ name: "Example School", year: "2020", location: "Poland", info: "Studied interaction design." }],
  });

  assert.strictEqual((txt.match(/^# /gm) ?? []).length, 1, "the companion must keep exactly one H1");
  // Documents are H2; their headline and sections sit strictly below them
  for (const name of ["## Home", "## Education & Certificates", "## Contact", "## Full-Stack Developer at Sample Co"]) {
    assert.include(txt, `\n${name}\n`);
  }
  assert.include(txt, "\n### Stable home title\n");
  assert.include(txt, "\n#### Experience\n");
  // A nested entry (one school) lands one level deeper still, never beside the page's own sections
  assert.include(txt, "\n##### Example School\n");
  assert.isFalse(/^#{6} /m.test(txt), "no heading may reach H6: the twin builders top out at H3");
});

it("response helpers set content types, indexing, cache, canonical, and language-variant headers", () => {
  const ok = mdResponse({
    body: "# Hi",
    preferredLanguage: "en",
    canonical: "https://www.remiforge.dev/",
    // The site-relative twin route the declaration names; mdResponse makes it absolute once
    markdownPath: "/index.md",
  });
  assert.strictEqual(ok.status, 200);
  assert.strictEqual(ok.headers.get("Content-Type"), "text/markdown; charset=utf-8");
  assert.strictEqual(ok.headers.get("Content-Language"), "en");
  assert.strictEqual(ok.headers.get("Vary"), "Cookie, Accept-Language");
  // The twins inherit the same indexing directive the HTML heads emit
  assert.strictEqual(ok.headers.get("X-Robots-Tag"), INDEXABLE_ROBOTS);
  // The response identifies its exact representation and exposes both stable language variants.
  assert.strictEqual(ok.headers.get("Content-Location"), "https://www.remiforge.dev/index.md?lang=en");
  // The AI indexes are advertised in the same Link header, so a crawler landing on a single twin
  // reaches the whole document graph without a second request or a body parse
  //
  // Parameters serialize in one fixed order (rel, type, title, hreflang) regardless of the order
  // each builder wrote its literal in, so every surface emitting a link emits the same bytes.
  assert.strictEqual(
    ok.headers.get("Link"),
    '<https://www.remiforge.dev/>; rel="canonical", <https://www.remiforge.dev/llms.txt>; rel="alternate"; type="text/plain"; title="llms.txt", <https://www.remiforge.dev/llms-full.txt>; rel="alternate"; type="text/plain"; title="llms-full.txt", <https://www.remiforge.dev/index.md?lang=en>; rel="alternate"; type="text/markdown"; hreflang="en", <https://www.remiforge.dev/index.md?lang=pl>; rel="alternate"; type="text/markdown"; hreflang="pl", <https://www.remiforge.dev/index.md?lang=en>; rel="alternate"; type="text/markdown"; hreflang="x-default"'
  );
  // The reuse signal mirrors robots.txt, so a crawler reading only the response headers learns
  // the policy without fetching the crawl directives document
  assert.strictEqual(ok.headers.get("Content-Signal"), "search=yes, ai-input=yes, ai-train=yes");

  // A 404 twin keeps advertising the AI indexes, so a crawler that lands on a dead slug can still
  // walk to the live document graph from the HTTP layer. The twin path is the site-relative route,
  // and Content-Location is the absolute representation a crawler can actually fetch
  const missing = mdNotFoundResponse("# Gone", "pl", Option.some("/gone.md"));
  assert.strictEqual(missing.status, 404);
  assert.strictEqual(missing.headers.get("Content-Type"), "text/markdown; charset=utf-8");
  assert.strictEqual(missing.headers.get("Content-Location"), "https://www.remiforge.dev/gone.md?lang=pl");
  assert.strictEqual(missing.headers.get("X-Robots-Tag"), "noindex, follow");
  assert.strictEqual(
    missing.headers.get("Link"),
    '<https://www.remiforge.dev/llms.txt>; rel="alternate"; type="text/plain"; title="llms.txt", <https://www.remiforge.dev/llms-full.txt>; rel="alternate"; type="text/plain"; title="llms-full.txt"'
  );

  // No parseable twin path: the indexes are still advertised, but there is no representation to name
  const unparseable = mdNotFoundResponse("# Gone", "en", Option.none());
  assert.strictEqual(unparseable.status, 404);
  assert.isNull(unparseable.headers.get("Content-Location"));
  assert.include(unparseable.headers.get("Link") ?? "", "llms-full.txt");

  const unavailable = mdUnavailableResponse("# Temporarily unavailable", "pl");
  assert.strictEqual(unavailable.status, 503);
  assert.strictEqual(unavailable.headers.get("Content-Type"), "text/markdown; charset=utf-8");
  assert.strictEqual(unavailable.headers.get("Content-Language"), "pl");
  assert.strictEqual(unavailable.headers.get("Cache-Control"), "no-store");
  assert.strictEqual(unavailable.headers.get("X-Robots-Tag"), "noindex, follow");
  // An outage keeps advertising the retrieval surface, the same way the 404 twin does: a failure is
  // the response where a fetcher most needs to be told the rest of the site is still reachable,
  // and the twins' whole design premise is that the index is reachable from any surface.
  assert.strictEqual(
    unavailable.headers.get("Link"),
    '<https://www.remiforge.dev/llms.txt>; rel="alternate"; type="text/plain"; title="llms.txt", <https://www.remiforge.dev/llms-full.txt>; rel="alternate"; type="text/plain"; title="llms-full.txt"'
  );

  const txt = txtResponse("# Plain");
  assert.strictEqual(txt.status, 200);
  assert.strictEqual(txt.headers.get("Content-Type"), "text/plain; charset=utf-8");
  // Plain-text discovery documents are always English
  assert.strictEqual(txt.headers.get("Content-Language"), "en");
  // The reuse signal is mirrored from robots.txt into the header, so a crawler reading only the
  // HTTP layer learns the same policy without fetching the crawl directives document
  assert.strictEqual(txt.headers.get("Content-Signal"), CONTENT_SIGNAL);

  const unavailableTxt = txtUnavailableResponse("Unavailable");
  assert.strictEqual(unavailableTxt.status, 503);
  assert.strictEqual(unavailableTxt.headers.get("Content-Type"), "text/plain; charset=utf-8");
  assert.strictEqual(unavailableTxt.headers.get("Cache-Control"), "no-store");
  assert.strictEqual(unavailableTxt.headers.get("X-Robots-Tag"), "noindex, follow");

  // llms.txt indexes serve AI fetchers, not search results: noindex, but still crawlable
  const discovery = discoveryTxtResponse("# Index", absoluteUrl("/llms.txt"));
  assert.strictEqual(discovery.status, 200);
  assert.strictEqual(discovery.headers.get("Content-Type"), "text/plain; charset=utf-8");
  assert.strictEqual(discovery.headers.get("Cache-Control"), "public, max-age=3600, stale-while-revalidate=86400");
  assert.strictEqual(discovery.headers.get("X-Robots-Tag"), NOINDEX_FOLLOW);
  // Content-Location is the already-absolute URL the response names, byte-equal to the URL the
  // <head> and Link header advertise
  assert.strictEqual(discovery.headers.get("Content-Location"), "https://www.remiforge.dev/llms.txt");
  // A fetcher landing on one index learns about the other from the HTTP layer, the same way a
  // Markdown twin does — the discovery indexes were the one document family missing this header
  assert.strictEqual(
    discovery.headers.get("Link"),
    '<https://www.remiforge.dev/llms.txt>; rel="alternate"; type="text/plain"; title="llms.txt", <https://www.remiforge.dev/llms-full.txt>; rel="alternate"; type="text/plain"; title="llms-full.txt"'
  );
});

it.effect("a failed experience-list decode is an error, while a valid missing slug is a 404 candidate", () =>
  Effect.gen(function* () {
    // The failed decode stays an error in the fetch + require pipeline
    const decodeError = yield* Effect.flip(requireData(Option.none(), "experience list"));
    assert.strictEqual(decodeError._tag, "RequiredDataError");

    // A decoded list without the slug is a pure lookup returning None
    assert.deepStrictEqual(experienceFromList([], "missing"), Option.none());
    assert.deepStrictEqual(experienceFromList([sampleExperience], "missing"), Option.none());
    assert.deepStrictEqual(experienceFromList([sampleExperience], sampleExperience.slug), Option.some(sampleExperience));
  })
);

it.effect("required-content failures map to non-cacheable 503s and valid missing slugs map to 404s", () =>
  Effect.gen(function* () {
    // The pipeline's own recovery is now part of documentResponse; the 503 shape it produces is
    // still the shared meta/response builder, asserted here so a regression in the recovery
    // combinator is caught directly
    const unavailableMarkdown = yield* requireData(Option.none(), "experience list").pipe(
      Effect.catchTag("RequiredDataError", () => Effect.succeed(mdUnavailableResponse("# Temporarily unavailable", "pl")))
    );
    assert.strictEqual(unavailableMarkdown.status, 503);
    assert.strictEqual(unavailableMarkdown.headers.get("Cache-Control"), "no-store");
    assert.strictEqual(unavailableMarkdown.headers.get("X-Robots-Tag"), "noindex, follow");
    assert.include(unavailableMarkdownBody(translateEn), "portfolio");

    // The discovery documents recover through the same shared recovery, with a plain-text 503
    const unavailableIndex = yield* recoverDataFailure("[LLMS.TXT]", () => txtUnavailableResponse(unavailableIndexBody("llms.txt")))(requireData(Option.none(), "experience list"));
    assert.strictEqual(unavailableIndex.status, 503);
    assert.strictEqual(unavailableIndex.headers.get("Content-Type"), "text/plain; charset=utf-8");

    const noMatch = experienceFromList([], "missing");
    const notFound = Option.isNone(noMatch)
      ? mdNotFoundResponse("# Not Found", "en", Option.some("/missing.md"))
      : mdResponse({ body: "# Found", preferredLanguage: "en", canonical: "https://www.remiforge.dev/", markdownPath: "/index.md" });
    assert.strictEqual(notFound.status, 404);
    assert.strictEqual(notFound.headers.get("X-Robots-Tag"), "noindex, follow");
  })
);

it("the unavailable twin escapes its prose the way every other body string does", () => {
  // Dictionary copy is authored data: an escaped value starting with "#" or "-" would fabricate
  // structure in the one document an indexer reads while the site is degraded.
  const hostile = (source: string): string => (source === "The required portfolio content could not be loaded. Please try again shortly." ? "- not really" : source);

  assert.include(unavailableMarkdownBody(hostile), "\\- not really");
  // The escape is transparent for the copy the site ships today, so no reachable prose changed
  assert.include(unavailableMarkdownBody(translateEn), "The required portfolio content could not be loaded. Please try again shortly.");
});

it("parseLangParam honors ?lang= and rejects unknown values", () => {
  assert.deepStrictEqual(parseLangParam("https://x.test/index.md?lang=pl"), Option.some("pl"));
  assert.deepStrictEqual(parseLangParam("https://x.test/index.md?lang=EN"), Option.some("en"));
  assert.deepStrictEqual(parseLangParam("https://x.test/index.md"), Option.none());
  assert.deepStrictEqual(parseLangParam("https://x.test/index.md?lang=de"), Option.none());
});

it("slugFromMdPathname extracts slugs and never throws on hostile input", () => {
  assert.deepStrictEqual(slugFromMdPathname("https://x.test/benefit-finance.md"), Option.some("benefit-finance"));
  assert.deepStrictEqual(slugFromMdPathname("https://x.test/benefit-finance.md?lang=pl"), Option.some("benefit-finance"));
  assert.deepStrictEqual(slugFromMdPathname("https://x.test/my%20project.md"), Option.some("my project"));
  // Malformed percent-encoding, missing slug, and extensionless paths all become None (clean 404)
  assert.deepStrictEqual(slugFromMdPathname("https://x.test/%zz.md"), Option.none());
  assert.deepStrictEqual(slugFromMdPathname("https://x.test/%E0%A4%A.md"), Option.none());
  assert.deepStrictEqual(slugFromMdPathname("https://x.test/"), Option.none());
  assert.deepStrictEqual(slugFromMdPathname("https://x.test/.md"), Option.none());
});

it("a content-derived index label cannot fabricate a Markdown link destination", () => {
  // A twin name sits inside a Markdown link label. The brackets are escaped, so the label stays one
  // label and the real destination survives — an unescaped "]" would close the label early and hand
  // a crawler a destination the site never published.
  const txt = buildLlmsTxt([{ ...sampleExperience, type: "p", slug: "evil", role: "Evil](https://evil.test)" }]);

  assert.include(txt, "- [Evil\\](https://evil.test)](https://www.remiforge.dev/evil):");
  // The escape is transparent, so the line still parses as one bullet with one destination
  assert.notInclude(txt, "- [Evil](https://evil.test)](https");
  assert.isFalse(txt.includes("](https://evil.test)("));
});
