import { assert, it } from "@effect/vitest";
import { AI_NOTES, buildLlmsFullTxt, buildLlmsTxt, DISCOVERY_LINES, SITE_OPENING, unavailableIndexBody } from "../indexes";
import { escapeMd } from "../escape";
import { unavailableMarkdownBody } from "../fallback";
import { buildExperienceMd, buildHomeMd } from "../twins";
import { twinDocument } from "../format";
import { SOURCE_CONTEXT } from "../models";
import { CONTACT_EMAIL, LANG_PARAM, PERSON_DESCRIPTION } from "@/domain/site";
import { DISCOVERY_DOCUMENTS } from "@/features/meta/domain/discovery";
import { experienceSeo } from "@/features/meta/domain/seo";
import { SITE_LANGUAGE_NAMES, SITE_LANGUAGES } from "@/domain/constants";
import { sampleExperience, stablePageTitles, translateEn } from "@/features/markdown/__tests__/fixtures";
import type { MarkdownTwin } from "../models";

it("buildLlmsTxt indexes pages, about facts, grouped experience and negotiated language guidance", () => {
  const txt = buildLlmsTxt([{ ...sampleExperience, slug: "my project" }]);
  // Rendered alongside the index below, so the two documents are compared rather than re-stated
  const fullDocument = buildLlmsFullTxt({ pageTitles: stablePageTitles, experienceList: [], educationList: [] });
  assert.include(txt, `# Remi Forge`);
  assert.include(txt, `## Pages`);
  assert.include(txt, `https://www.remiforge.dev/index.md`);
  // Key facts are dense, extractable claims in the free-form introduction before the file lists.
  assert.notInclude(txt, `## About`);
  // The canonical site root gives AI systems a single citation target for the whole site
  assert.include(txt, `- Website: https://www.remiforge.dev`);
  assert.include(txt, `- Email: ${CONTACT_EMAIL}`);
  assert.include(txt, `- Role: Web Developer (self-taught)`);
  assert.include(txt, `- Based in: Rzeszów, Poland (PL)`);
  assert.include(txt, `## Work Experience`);
  // Every entry leads with the deterministic Markdown representation an agent should retrieve, and
  // keeps the canonical HTML URL beside it as the citation target — the same entry shape everywhere.
  assert.include(
    txt,
    `- [Full-Stack Developer at Sample Co](https://www.remiforge.dev/my%20project.md?lang=en): Built things with \\*\\*care\\*\\* and #hashtags. (Mar 2026) [HTML](https://www.remiforge.dev/my%20project)`
  );
  assert.notInclude(txt, `## Notes for AI systems`);
  // The single-fetch document is surfaced in Pages and in the introductory guidance.
  assert.include(txt, `- [Full site content](https://www.remiforge.dev/llms-full.txt): every page above in one document, for single-request ingestion.`);
  assert.include(txt, `- The complete content of every page is also available in a single request: https://www.remiforge.dev/llms-full.txt.`);
  assert.include(txt, `Use \`?lang=pl\` on a \`.md\` URL to request Polish explicitly; replace any existing \`lang\` value rather than appending a second parameter`);
  assert.include(txt, "Markdown page twins follow the request's language preferences.");
  assert.include(txt, "English is the fallback when no supported preference is present.");
  assert.include(txt, "The llms.txt indexes are English discovery documents.");
  // The language-variants line is pinned in full: mdBulletList owns the bullet prefix, and a
  // caller that hand-prefixed its item as well would publish a nested `- -` bullet an AI parser
  // reads as a list inside a list
  assert.include(
    txt,
    "- Polish: every listed page is also available at its twin URL with `?lang=pl` (e.g. https://www.remiforge.dev/index.md?lang=pl). Replace any existing `lang` value; English is the source language."
  );
  assert.include(txt, `Always cite the clean canonical HTML URL from each document's frontmatter`);
  // The XML sitemap is advertised exactly once, under Discovery: repeating it elsewhere would
  // tell an AI reader two different sections are the retrieval surface
  assert.include(txt, `- [sitemap.xml](https://www.remiforge.dev/sitemap.xml): sitemap.`);
  assert.strictEqual((txt.match(/sitemap\.xml\]/gm) ?? []).length, 1);
  // Profiles use the same labelled source declaration as the contact twin, projected as the
  // Markdown links every llms.txt file-list item requires.
  assert.include(txt, "- [GitHub](https://github.com/remi-k-work)");
  assert.include(txt, "- [LinkedIn](https://linkedin.com/in/remi-k-work)");
  // The other machine-readable entry points are collected in one section, so a crawler that
  // fetched nothing else still learns the retrieval surface without a redundant self-link.
  assert.include(txt, `## Discovery`);
  // Discovery entries are markdown links, the shape llms.txt specifies for list items and the
  // same shape the twins' "Pages" section already prints for these documents. The index omits
  // its own URL because fetching the current document again adds no information.
  assert.notInclude(txt, `- [llms.txt](https://www.remiforge.dev/llms.txt): this index.`);
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
  // and you still have the site": PDF downloads are exactly that.
  assert.include(txt, `## Optional`);
  assert.strictEqual(txt.lastIndexOf("## Optional"), txt.lastIndexOf("## "));
  // ...and the full-content companion carries the twins, not the skippable pointers
  assert.notInclude(fullDocument, `## Optional`);
  // Every indexed twin URL carries the ?lang= pin, so a crawler never lands on a negotiated variant
  for (const twin of ["index.md?lang=en", "education.md?lang=en", "contact.md?lang=en", "my%20project.md?lang=en"]) {
    assert.include(txt, twin);
  }
  // Each page entry leads with its Markdown twin and names the canonical HTML citation target beside
  // it, so a fetcher can retrieve clean content without first fetching and converting the HTML page.
  assert.include(
    txt,
    `- [Home page](https://www.remiforge.dev/index.md?lang=en): portfolio overview with experience and project lists. [HTML](https://www.remiforge.dev/)`
  );
  assert.include(
    txt,
    `- [Education \\& Certificates](https://www.remiforge.dev/education.md?lang=en): schools, courses and certificates. [HTML](https://www.remiforge.dev/education)`
  );
  // Summaries are authored sentences: the entry adds no second full stop
  assert.notInclude(txt, ".. [Markdown]");
  assert.notInclude(txt, ".md)");
});

it("llms.txt reserves every H2 section for a non-empty Markdown-link file list", () => {
  const txt = buildLlmsTxt([sampleExperience]);
  const sections = txt.split(/^## /m).slice(1);

  assert.isAbove(sections.length, 0);
  for (const section of sections) {
    const items = section
      .split("\n")
      .slice(1)
      .filter((line) => line.trim().length > 0);

    assert.isAbove(items.length, 0, `empty file list: ${section.split("\n")[0]}`);
    for (const item of items) assert.isTrue(item.startsWith("- [") && item.includes("]("), `not a linked file-list item: ${item}`);
  }

  const empty = buildLlmsTxt([]);
  assert.notInclude(empty, "## Work Experience");
  assert.notInclude(empty, "## Portfolio Projects");
});

it("buildLlmsTxt places project entries in the portfolio file list", () => {
  const txt = buildLlmsTxt([{ ...sampleExperience, type: "p", slug: "sample-project" }]);

  assert.notInclude(txt, "## Work Experience");
  assert.include(txt, "## Portfolio Projects");
  assert.include(txt, "- [Full-Stack Developer](https://www.remiforge.dev/sample-project.md?lang=en):");
  assert.include(txt, "[HTML](https://www.remiforge.dev/sample-project)");
});

it("the index's language guidance covers every language the site publishes and no others", () => {
  // The guidance names the `?lang=` pin and the languages it selects, and the twin builder and its
  // parser both read the same vocabulary. Pinning the two against each other is what stops a
  // language from being published without being advertised, or advertised without being published.
  const txt = buildLlmsTxt([sampleExperience]);
  const pinned = new Set([...txt.matchAll(/\?lang=([a-z]+)/g)].map(([, language]) => language));

  assert.deepStrictEqual([...pinned].sort(), [...SITE_LANGUAGES].sort());
  for (const language of SITE_LANGUAGES) assert.include(txt, SITE_LANGUAGE_NAMES[language]);
  // The parameter the guidance spells is the one the twin parser reads back
  assert.include(txt, `?${LANG_PARAM}=`);
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

it("the reuse note names the frontmatter facts every published page twin actually publishes", () => {
  // The note is the one place an AI reader is told which keys to read a document's facts from.
  // A key it names that no page twin publishes guides the reader to a field that is not there, and a
  // key every page twin publishes that the note omits is never read at all — so the claim in the
  // note and the facts the builders emit are compared rather than trusted to agree. (The 404 twin
  // is deliberately outside the claim: it has no canonical URL or page type to publish.)
  const factsNote = AI_NOTES.find((note) => note.startsWith("Every published page twin states its headline facts"));
  assert.isDefined(factsNote, "the reuse notes say nothing about frontmatter");

  const claimedKeys = factsNote!.match(/`([^`]+)`/g)!.map((key) => key.slice(1, -1));
  // The set both kinds of twin share: a static twin's own kind and the detail twin's role, company,
  // year and skills are this document's own extras, not the headline facts the note describes.
  const twins: ReadonlyArray<MarkdownTwin> = [
    buildHomeMd({ ...SOURCE_CONTEXT, pageTitles: stablePageTitles, experienceList: [sampleExperience] }),
    buildExperienceMd({ seo: experienceSeo({ experience: sampleExperience, preferredLanguage: "en" }), translate: translateEn }),
  ];

  for (const key of claimedKeys) {
    for (const twin of twins) assert.isTrue(key in twin.facts, `no twin publishes a "${key}" fact the note names`);
  }

  const sharedKeys = Object.keys(twins[0]!.facts).filter((key) => key in twins[1]!.facts);
  assert.deepStrictEqual([...claimedKeys].sort(), [...sharedKeys].sort());
});

it("the index and home twin share one experience listing, with canonical citations only in the index", () => {
  // Both surfaces lead with the same Markdown twin and summary. The index alone adds the clean HTML
  // citation target, keeping its retrieval and citation roles explicit without duplicating list logic.
  const experienceList = [{ ...sampleExperience, type: "e" as const, slug: "sample-job", role: "Backend Developer", company: "Sample Co" }];
  const index = buildLlmsTxt(experienceList);
  const twin = twinDocument(buildHomeMd({ ...SOURCE_CONTEXT, pageTitles: stablePageTitles, experienceList }));
  const entry = "Backend Developer at Sample Co";
  const canonical = "https://www.remiforge.dev/sample-job";
  const twinRoute = "https://www.remiforge.dev/sample-job.md?lang=en";
  const retrievalLink = `[${entry}](${twinRoute})`;

  // Read the index's own entry back and require the twin to carry the very same escaped summary,
  // rather than restating the excerpt by hand: one builder, one grouping, one escape pass.
  const indexEntry = index
    .split("\n")
    .map((line) => line.replace(/^-\s*/, ""))
    .find((line) => line.startsWith(retrievalLink));
  assert.isDefined(indexEntry, "the index lists the employment experience under its Markdown twin");
  const summary = (indexEntry ?? "").slice(retrievalLink.length + 2, (indexEntry ?? "").indexOf(" [HTML]("));
  assert.isNotEmpty(summary);
  assert.include(twin, `${retrievalLink}: ${summary}`);
  assert.include(indexEntry ?? "", `[HTML](${canonical})`);

  // The standalone twin needs no second link to the HTML representation it describes.
  assert.notInclude(twin, `[HTML](${canonical})`);

  // Both surfaces apply the same escape pass, so authored emphasis reaches both as text
  assert.notInclude(index, "**");
  assert.notInclude(twin, "**");
  assert.include(index, "\\*\\*");
  assert.include(twin, "\\*\\*");
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
  assert.isTrue(full.lastIndexOf("Notes for AI systems") > full.lastIndexOf("[Source]("));
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
  // index for two URLs that are already declared once in the shared constants.
  const full = buildLlmsFullTxt({ pageTitles: stablePageTitles, experienceList: [], educationList: [] });
  const index = buildLlmsTxt([]);

  assert.include(full, "## Discovery");
  // Each document lists the other crawl surfaces, not a redundant link to itself.
  for (const line of DISCOVERY_LINES) {
    if (line.includes("[llms-full.txt]")) assert.notInclude(full, `- ${line}`);
    else assert.include(full, `- ${line}`);
  }
  // The map lands before the reuse notes, so a fetcher reads the surface before the policy
  assert.isTrue(full.indexOf("## Discovery") < full.indexOf("## Notes for AI systems"));
  // The concise index links to its companion and the shared non-index surfaces, but not itself.
  for (const line of DISCOVERY_LINES) {
    if (line.includes("[llms.txt]")) assert.notInclude(index, `- ${line}`);
    else assert.include(index, `- ${line}`);
  }
});

it("the discovery list projects every crawl document from the shared catalogue", () => {
  assert.strictEqual(DISCOVERY_LINES.length, DISCOVERY_DOCUMENTS.length);
  for (const { name, summary, url } of DISCOVERY_DOCUMENTS) assert.include(DISCOVERY_LINES, `[${name}](${url}): ${summary}.`);
});

it("the full-content companion gives every concatenated document its own section heading", () => {
  const txt = buildLlmsFullTxt({
    pageTitles: stablePageTitles,
    experienceList: [sampleExperience],
    educationList: [{ name: "Example School", year: "2020", location: "Poland", info: "Studied interaction design." }],
  });

  // One `##` section per document: the companion then has a document-level hierarchy
  // (# the site, ## one document) instead of a run of child H1s with no parent to hang from
  for (const name of ["Home page", "Education \\& Certificates", "Contact", "Full-Stack Developer at Sample Co"]) {
    assert.include(txt, `## ${name}`);
  }
  // The heading precedes the attribution block it introduces
  assert.isTrue(txt.indexOf("## Home page") < txt.indexOf("[Source](https://www.remiforge.dev/)"));
  assert.isTrue(txt.indexOf("## Full-Stack Developer at Sample Co") < txt.indexOf("[Source](https://www.remiforge.dev/sample-role)"));
  // Each twin's own headline still reads as that document's headline, now nested under it
  assert.include(txt, "### Full-Stack Developer at Sample Co");
});

it("buildLlmsFullTxt concatenates every twin behind its canonical URL", () => {
  const txt = buildLlmsFullTxt({
    pageTitles: stablePageTitles,
    experienceList: [sampleExperience],
    educationList: [{ name: "Example School", year: "2020", location: "Poland", info: "Studied interaction design." }],
  });

  // One Source marker per twin: the three pages plus the single experience, in catalogue order
  // then portfolio order — the same order the table of contents advertises
  const sources = [...txt.matchAll(/^\[Source\]\((.+)\)$/gm)].map(([, url]) => url);
  assert.deepStrictEqual(sources, [
    "https://www.remiforge.dev/",
    "https://www.remiforge.dev/education",
    "https://www.remiforge.dev/contact",
    "https://www.remiforge.dev/sample-role",
  ]);
  // Every substantive block survives concatenation; only heading depth shifts. Standalone twins
  // retain their crawl graph, while the companion's table of contents replaces repeated page nav.
  assert.notInclude(txt, "#### Pages");
  assert.include(txt, `### Stable home title`);
  assert.include(txt, `### Full-Stack Developer at Sample Co`);
  assert.include(txt, `type: "overview"`);
  assert.include(txt, `type: "education"`);
  assert.include(txt, `type: "contact"`);
  assert.include(txt, `type: "work-experience"`);
  // A table of contents names every document up front, before the content bodies
  assert.include(txt, `## Table of Contents`);
  // Pinned in full, not by prefix: the three index entry lists render one shape, and the
  // summary-less table of contents is the variant no other assertion below covers
  assert.include(txt, `- [Home page](https://www.remiforge.dev/index.md?lang=en): [HTML](https://www.remiforge.dev/)`);
  assert.include(txt, `- [Education \\& Certificates](https://www.remiforge.dev/education.md?lang=en): [HTML](https://www.remiforge.dev/education)`);
  assert.include(txt, `- [Full-Stack Developer at Sample Co](https://www.remiforge.dev/sample-role.md?lang=en): [HTML](https://www.remiforge.dev/sample-role)`);
  // Citations must land on canonical HTML URLs, never on the aggregation itself
  assert.include(txt, `Cite the canonical HTML URL, not this file.`);
  assert.include(txt, "with headings demoted to preserve one document hierarchy");
  // Every document names both spellings of its identity: the canonical URL to cite above the
  // Markdown twin URL to fetch, so a crawler never has to resolve one from the other
  assert.include(txt, `[Markdown](https://www.remiforge.dev/education.md?lang=en)`);
  assert.include(txt, `[Markdown](https://www.remiforge.dev/sample-role.md?lang=en)`);
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
  for (const name of ["## Home page", "## Education \\& Certificates", "## Contact", "## Full-Stack Developer at Sample Co"]) {
    assert.include(txt, `\n${name}\n`);
  }
  assert.include(txt, "\n### Stable home title\n");
  assert.include(txt, "\n#### Experience\n");
  // A nested entry (one school) lands one level deeper still, never beside the page's own sections
  assert.include(txt, "\n##### Example School\n");
  assert.isFalse(/^#{6} /m.test(txt), "no heading may reach H6: the twin builders top out at H3");
});

it("a content-derived index label cannot fabricate a Markdown link destination", () => {
  // A twin name sits inside a Markdown link label. The brackets are escaped, so the label stays one
  // label and the real destination survives — an unescaped "]" would close the label early and hand
  // a crawler a destination the site never published.
  const txt = buildLlmsTxt([{ ...sampleExperience, type: "p", slug: "evil", role: "Evil](https://evil.test)" }]);

  assert.include(txt, "- [Evil\\](https://evil.test)](https://www.remiforge.dev/evil.md?lang=en):");
  // The escape is transparent, so the line still parses as one bullet with one destination
  assert.notInclude(txt, "- [Evil](https://evil.test)](https");
  assert.isFalse(txt.includes("](https://evil.test)("));
});

it("the companion fences each twin's identity facts instead of publishing a second frontmatter block", () => {
  // A twin's own document opens with a `---`-delimited frontmatter block. Republishing that block
  // verbatim inside the companion is not frontmatter any more: a `---` after a blank line is a
  // thematic break, and the closing `---`, sitting directly under the last fact, is a setext
  // underline — so `type: "overview"` became an H2 at the same depth as the `## Home page` section
  // heading above it, breaking the hierarchy a concatenated document promises its reader.
  const txt = buildLlmsFullTxt({ pageTitles: stablePageTitles, experienceList: [], educationList: [] });

  // The facts survive, still YAML, still machine-readable — fenced so they cannot be structure
  assert.include(txt, '```yaml\ntitle: "Remi Forge ● Web Developer in Rzeszów, Poland"');
  assert.include(txt, 'type: "overview"\n```');
  // One fenced block per concatenated document, counted rather than asserted present
  assert.strictEqual((txt.match(/^```yaml$/gm) ?? []).length, 3);
  // No document's own frontmatter delimiter reaches the companion as an unpaired `---`
  assert.strictEqual(txt.split("\n").filter((line) => /^-+$/.test(line)).length, 0);
});

it("the companion's only H2s are its own document sections, never a concatenated twin's facts", () => {
  // The heading depths the companion promises: # the site, ## one document, ### its headline,
  // #### its sections, ##### nested entries. A twin's frontmatter leaking in as structure would add
  // an H2 nobody declared, which is what the fenced facts prevent.
  const txt = buildLlmsFullTxt({
    pageTitles: stablePageTitles,
    experienceList: [sampleExperience],
    educationList: [{ name: "Example School", year: "2020", location: "Poland", info: "Studied interaction design." }],
  });

  const documentHeadings = txt
    .split("\n")
    .filter((line) => line.startsWith("## "))
    .map((line) => line.slice(3));

  assert.deepStrictEqual(documentHeadings, [
    "About",
    "Table of Contents",
    "Discovery",
    "Home page",
    "Education \\& Certificates",
    "Contact",
    "Full-Stack Developer at Sample Co",
    "Notes for AI systems",
  ]);
});

it("index entries encode a paren-bearing slug so the twin destination survives", () => {
  // encodeURIComponent leaves "(" and ")" raw, but a Markdown destination ends at the first ")".
  // The twin URL is an embedded destination exactly like the canonical link beside it, so both take
  // the paren encoding and a slug that would truncate one entry renders as one whole entry.
  const txt = buildLlmsTxt([{ ...sampleExperience, slug: "role (senior)" }]);

  assert.include(txt, "](https://www.remiforge.dev/role%20%28senior%29)");
  assert.include(txt, "](https://www.remiforge.dev/role%20%28senior%29.md?lang=en)");
  // No raw parenthesis reaches either destination
  assert.notInclude(txt, "(senior)");
});

it("the companion encodes every slug-derived twin URL exactly as its table of contents does", () => {
  const txt = buildLlmsFullTxt({
    pageTitles: stablePageTitles,
    experienceList: [{ ...sampleExperience, slug: "role (senior)" }],
    educationList: [],
  });

  for (const [, url] of txt.matchAll(/^\[Markdown\]\((\S+)\)$/gm)) {
    assert.isAtLeast(txt.split(url!).length - 1, 2, `${url} must match in the contents and attribution links`);
    assert.notInclude(url, "(", "a raw parenthesis would close the destination early");
  }

  const encoded = "role%20%28senior%29.md";
  assert.isAbove((txt.match(new RegExp(encoded, "g")) ?? []).length, 1);
  assert.notInclude(txt, "(senior)");
});

it("the companion's Source and Markdown links preserve slug characters as destinations", () => {
  const underscore = { ...sampleExperience, slug: "_role_" };
  const paren = { ...sampleExperience, slug: "role (senior)" };

  const doc = buildLlmsFullTxt({ pageTitles: stablePageTitles, experienceList: [underscore], educationList: [] });
  assert.include(doc, `[Source](https://www.remiforge.dev/_role_)`);
  assert.include(doc, `[Markdown](https://www.remiforge.dev/_role_.md?lang=en)`);
  assert.notInclude(doc, "\\_role\\_");

  const encoded = buildLlmsFullTxt({ pageTitles: stablePageTitles, experienceList: [paren], educationList: [] });
  assert.include(encoded, "[Source](https://www.remiforge.dev/role%20%28senior%29)");
});

it("the unavailable twin escapes its prose the way every other body string does", () => {
  // Dictionary copy is authored data: an escaped value starting with "#" or "-" would fabricate
  // structure in the one document an indexer reads while the site is degraded.
  const hostile = (source: string): string =>
    source === "The required portfolio content could not be loaded. Please try again shortly." ? "- not really" : source;

  assert.include(unavailableMarkdownBody(hostile), "\\- not really");
  // The escape is transparent for the copy the site ships today, so no reachable prose changed
  assert.include(unavailableMarkdownBody(translateEn), "The required portfolio content could not be loaded. Please try again shortly.");
});

it("the index fallback body names the document and restates the reuse policy", () => {
  // The indexes are plain text, so their fallback is prose rather than an escaped Markdown
  // document: naming the document tells a fetcher which of the two requests failed, and the
  // reuse policy is restated so a degraded read still learns what reuse is permitted. The note is
  // the indexes' own first reuse note, so the two surfaces cannot state different policies.
  const body = unavailableIndexBody("llms-full.txt");

  assert.include(body, "llms-full.txt is temporarily unavailable");
  assert.include(body, "required portfolio content could not be loaded");
  assert.include(body, AI_NOTES[0]);
  assert.isTrue(body.endsWith("\n"));
});
