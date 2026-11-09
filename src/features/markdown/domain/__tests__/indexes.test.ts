import { assert, it } from "@effect/vitest";
import { AI_NOTES, buildLlmsFullTxt, buildLlmsTxt, DISCOVERY_LINES, SITE_OPENING, unavailableIndexBody } from "../indexes";
import { escapeMd } from "../escape";
import { buildExperienceMd } from "../detail-twin";
import { buildHomeMd, unavailableMarkdownBody } from "../twins";
import { twinDocument } from "../format";
import { SOURCE_COPY } from "../copy";
import { PERSON_DESCRIPTION, SITE_LANGUAGE_NAMES, LANG_PARAM } from "@/features/meta/domain/constants";
import { experienceSeo } from "@/features/meta/domain/helpers";
import { SITE_LANGUAGES } from "@/domain/constants";
import type { PageTitles } from "@/domain/models";
import type { Experience } from "@/features/experience/domain/models";
import type { MarkdownTwin } from "../models";

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
  assert.include(
    txt,
    `- [Full-Stack Developer at Sample Co](https://www.remiforge.dev/my%20project): Built things with \\*\\*care\\*\\* and #hashtags. (Mar 2026) Markdown: https://www.remiforge.dev/my%20project.md?lang=en`
  );
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
  // its Markdown twin beside it, so a fetcher learns both documents from a single entry. The label
  // is the static page catalogue's own, the same name the twins' "Pages" section prints.
  assert.include(
    txt,
    `- [Home page](https://www.remiforge.dev/): portfolio overview with experience and project lists. Markdown: https://www.remiforge.dev/index.md?lang=en`
  );
  assert.include(
    txt,
    `- [Education \\& Certificates](https://www.remiforge.dev/education): schools, courses and certificates. Markdown: https://www.remiforge.dev/education.md?lang=en`
  );
  // Summaries are authored sentences: the entry adds no second full stop
  assert.notInclude(txt, ".. Markdown:");
  assert.notInclude(txt, ".md)");
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

it("the reuse note names the frontmatter facts every twin actually publishes", () => {
  // The note is the one place an AI reader is told which keys to read a document's facts from.
  // A key it names that no twin publishes guides the reader to a field that is not there, and a
  // key every twin publishes that the note omits is never read at all — so the claim in the note
  // and the facts the builders emit are compared rather than trusted to agree.
  const factsNote = AI_NOTES.find((note) => note.startsWith("Every twin states its headline facts"));
  assert.isDefined(factsNote, "the reuse notes say nothing about frontmatter");

  const claimedKeys = factsNote!.match(/`([^`]+)`/g)!.map((key) => key.slice(1, -1));
  // The set both kinds of twin share: a static twin's own kind and the detail twin's role, company,
  // year and skills are this document's own extras, not the headline facts the note describes.
  const twins: ReadonlyArray<MarkdownTwin> = [
    buildHomeMd({ ...SOURCE_COPY, pageTitles: stablePageTitles, experienceList: [sampleExperience] }),
    buildExperienceMd({ seo: experienceSeo({ experience: sampleExperience, preferredLanguage: "en" }), translate: translateEn }),
  ];

  for (const key of claimedKeys) {
    for (const twin of twins) assert.isTrue(key in twin.facts, `no twin publishes a "${key}" fact the note names`);
  }

  const sharedKeys = Object.keys(twins[0]!.facts).filter((key) => key in twins[1]!.facts);
  assert.deepStrictEqual([...claimedKeys].sort(), [...sharedKeys].sort());
});

it("the index and the home twin render one experience list, differing only in the URL lead", () => {
  // The index's listing and the home twin's listing are the same projection of the same dataset:
  // the twin links its siblings' twin routes, the index links every page's canonical HTML URL and
  // then names the twin. They are built by one shared builder, so the two surfaces cannot group,
  // trim or order an experience differently — only the lead URL each surface exists to advertise.
  const experienceList = [{ ...sampleExperience, type: "e" as const, slug: "sample-job", role: "Backend Developer", company: "Sample Co" }];
  const index = buildLlmsTxt(experienceList);
  const twin = twinDocument(buildHomeMd({ ...SOURCE_COPY, pageTitles: stablePageTitles, experienceList }));
  const entry = "Backend Developer at Sample Co";
  const canonical = `[${entry}](https://www.remiforge.dev/sample-job)`;
  const twinRoute = "https://www.remiforge.dev/sample-job.md?lang=en";

  // Read the index's own entry back and require the twin to carry the very same escaped summary,
  // rather than restating the excerpt by hand: one builder, one grouping, one escape pass.
  const indexEntry = index
    .split("\n")
    .map((line) => line.replace(/^-\s*/, ""))
    .find((line) => line.startsWith(canonical));
  assert.isDefined(indexEntry, "the index lists the employment experience under its canonical URL");
  const summary = (indexEntry ?? "").slice(canonical.length + 2, (indexEntry ?? "").indexOf(" Markdown:"));
  assert.isNotEmpty(summary);
  assert.include(twin, `[${entry}](${twinRoute}): ${summary}`);

  // The one readable difference: the twin leads with the twin route, the index names it
  assert.notInclude(twin, `${canonical}:`);
  assert.notInclude(index, `[${entry}](${twinRoute}):`);

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
  // index for two URLs that are already declared once in the shared constants.
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
  for (const name of ["Home page", "Education \\& Certificates", "Contact", "Full-Stack Developer at Sample Co"]) {
    assert.include(txt, `## ${name}`);
  }
  // The heading precedes the attribution block it introduces
  assert.isTrue(txt.indexOf("## Home page") < txt.indexOf("Source: https://www.remiforge.dev/"));
  assert.isTrue(txt.indexOf("## Full-Stack Developer at Sample Co") < txt.indexOf("Source: https://www.remiforge.dev/sample-role"));
  // Each twin's own headline still reads as that document's headline, now nested under it
  assert.include(txt, "### Full-Stack Developer at Sample Co");
});

it("buildLlmsFullTxt concatenates every twin behind its canonical URL", () => {
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
  assert.include(txt, `- [Home page](https://www.remiforge.dev/): Markdown: https://www.remiforge.dev/index.md?lang=en`);
  assert.include(txt, `- [Home page](https://www.remiforge.dev/)`);
  assert.include(txt, `- [Education \\& Certificates](https://www.remiforge.dev/education)`);
  assert.include(txt, `- [Full-Stack Developer at Sample Co](https://www.remiforge.dev/sample-role)`);
  // Citations must land on canonical HTML URLs, never on the aggregation itself
  assert.include(txt, `Cite the canonical HTML URL, not this file.`);
  assert.include(txt, "with headings demoted to preserve one document hierarchy");
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

  assert.include(txt, "- [Evil\\](https://evil.test)](https://www.remiforge.dev/evil):");
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
  assert.include(txt, "Markdown: https://www.remiforge.dev/role%20%28senior%29.md?lang=en");
  // No raw parenthesis reaches either destination
  assert.notInclude(txt, "(senior)");
});

it("the companion encodes every slug-derived twin URL exactly as its table of contents does", () => {
  // The companion prints each twin URL twice: once in its table of contents, and once in the
  // document's own attribution block above the fenced facts. A slug whose path carries parentheses
  // truncates the second one at the first ")" unless it takes the same encoding the first did, so
  // the two spellings of one twin are compared rather than assumed to agree.
  const txt = buildLlmsFullTxt({
    pageTitles: stablePageTitles,
    experienceList: [{ ...sampleExperience, slug: "role (senior)" }],
    educationList: [],
  });

  // Every attribution line spells its twin URL exactly as the table of contents entry for the same
  // document does, so the one string is a destination a fetcher can resolve from either position.
  for (const line of txt.split("\n").filter((line) => line.startsWith("Markdown: "))) {
    const spelling = `Markdown: ${line.slice("Markdown: ".length)}`;

    assert.strictEqual(txt.split(spelling).length - 1, 2, `${spelling} is not spelled the same way twice`);
    assert.notInclude(line, "(", "a raw parenthesis would close the destination at the first one");
  }

  // The paren-bearing slug itself survives in both spellings, so the loop above is not vacuous:
  // the encoded URL appears in the table of contents and in the document's own attribution block,
  // beside the raw spelling the home twin's body embeds for the same page.
  const encoded = "role%20%28senior%29.md";
  assert.isAbove((txt.match(new RegExp(encoded, "g")) ?? []).length, 1);
  assert.notInclude(txt.split("Markdown: https://www.remiforge.dev/" + encoded + "?lang=en").join(""), "(senior)");
});

it("the companion's Source line escapes an underscore-bearing slug from becoming emphasis", () => {
  // The canonical is a site-derived URL, so a slug whose first and last character is `_` reads as an
  // emphasis run: half of the citation URL ends up inside `<em>`. The `Markdown:` sibling beside it
  // already encodes its destination, so the Source line takes the same inline escape every other
  // content line in the feature takes — and the escape is transparent for the URLs the site publishes.
  const underscore = { ...sampleExperience, slug: "_role_" };
  const paren = { ...sampleExperience, slug: "role (senior)" };

  const doc = buildLlmsFullTxt({ pageTitles: stablePageTitles, experienceList: [underscore], educationList: [] });
  assert.include(doc, `Source: https://www.remiforge.dev/\\_role\\_`);
  // The raw spelling would parse as emphasis and split the citation URL
  assert.notInclude(doc, "Source: https://www.remiforge.dev/_role_");
  // The rest of the document is untouched by the one escape
  assert.include(doc, `Markdown: https://www.remiforge.dev/_role_.md?lang=en`);

  const encoded = buildLlmsFullTxt({ pageTitles: stablePageTitles, experienceList: [paren], educationList: [] });
  assert.include(encoded, "Source: https://www.remiforge.dev/role%20%28senior%29");
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
