import { assert, it } from "@effect/vitest";
import { Option } from "effect";
import { buildExperienceMd, buildNotFoundMd } from "../detail-twin";
import { twinDocument } from "../format";
import { escapeMd } from "../escape";
import { experienceSeo } from "@/features/meta/domain/seo";
import { sampleExperience, translateEn, translatePl } from "@/features/markdown/__tests__/fixtures";

it("the experience twin renders frontmatter, H1, skills and links without repeated crawler instructions", () => {
  const md = twinDocument(buildExperienceMd({ seo: experienceSeo({ experience: sampleExperience, preferredLanguage: "en" }), translate: translateEn }));
  assert.include(md, `canonical: "https://www.remiforge.dev/sample-role"`);
  // author mirrors the HTML author meta on every twin
  assert.include(md, `author: "Remi Forge"`);
  assert.include(md, `# Full-Stack Developer at Sample Co`);
  assert.include(md, `- TypeScript`);
  assert.include(md, `## Links`);
  assert.include(md, `https://github.com/example/repo`);
  assert.include(md, `lang: "en"`);
  assert.include(md, `type: "work-experience"`);
  // Discrete frontmatter facts stay queryable without parsing the title or body
  assert.include(md, `role: "Full-Stack Developer"`);
  assert.include(md, `company: "Sample Co"`);
  assert.notInclude(md, "Cite the canonical HTML URL");
  // Twins stay UI-chrome free: no navs, footers, or scripts ever reach the Markdown surface
  assert.notInclude(md.toLowerCase(), "<html");
  assert.notInclude(md.toLowerCase(), "<nav");
  assert.notInclude(md.toLowerCase(), "<footer");
  // Body prose must be escaped (frontmatter is YAML-quoted, so raw chars are fine there): the
  // inline constructors are neutralized, while markers that only bind at a line start survive
  assert.include(md, "\\*\\*care\\*\\*");
  assert.include(md, "and #hashtags.");
  // One H1 per document, flat H2 hierarchy: an AI parser reads the shape without visual context
  assert.strictEqual((md.match(/^# /gm) ?? []).length, 1);
  assert.isTrue((md.match(/^## /gm) ?? []).length >= 4);
  assert.strictEqual((md.match(/^### /gm) ?? []).length, 0);
});

it("experience Markdown canonical encodes a slug as one path segment", () => {
  const experience = { ...sampleExperience, slug: "résumé & more" };
  const md = twinDocument(buildExperienceMd({ seo: experienceSeo({ experience, preferredLanguage: "en" }), translate: translateEn }));
  assert.include(md, `canonical: "https://www.remiforge.dev/r%C3%A9sum%C3%A9%20%26%20more"`);
});

it("the experience twin omits the Links section when the experience has no links", () => {
  const md = twinDocument(
    buildExperienceMd({ seo: experienceSeo({ experience: { ...sampleExperience, gitHubLink: undefined }, preferredLanguage: "en" }), translate: translateEn })
  );
  assert.include(md, `## Skills Used`);
  assert.notInclude(md, `## Links`);
});

it("experience link builders drop destinations that are not http(s) URLs", () => {
  // The Experience schema accepts any non-empty string, so the link builder is the one place a
  // hostile scheme can be stopped before it reaches a crawler-parseable document.
  const md = twinDocument(
    buildExperienceMd({
      seo: experienceSeo({
        experience: { ...sampleExperience, gitHubLink: "javascript:alert(1)", liveLink: "ftp://example.com/file" },
        preferredLanguage: "en",
      }),
      translate: translateEn,
    })
  );

  assert.notInclude(md, "javascript:");
  assert.notInclude(md, "ftp://");
  // Every link dropped: the section itself disappears instead of rendering an empty shell
  assert.notInclude(md, "## Links");
});

it("the experience twin localizes fixed Polish section and fact labels", () => {
  const md = twinDocument(buildExperienceMd({ seo: experienceSeo({ experience: sampleExperience, preferredLanguage: "pl" }), translate: translatePl }));
  assert.include(md, "## Opis");
  assert.include(md, "## Szczegóły");
  assert.include(md, "Rola: Full-Stack Developer");
  assert.include(md, "## Wykorzystane Umiejętności");
  assert.include(md, "## Linki");
});

it("experience link labels are the dictionary keys the HTML chips translate, so Polish gets Polish labels", () => {
  const everyLink = { ...sampleExperience, liveLink: "https://example.com/live", videoLink: "https://example.com/video" };

  const en = twinDocument(buildExperienceMd({ seo: experienceSeo({ experience: everyLink, preferredLanguage: "en" }), translate: translateEn }));
  assert.include(en, "[GitHub Repo](https://github.com/example/repo)");
  assert.include(en, "[Live Link](https://example.com/live)");
  assert.include(en, "[Watch Video](https://example.com/video)");

  // The previous untranslated labels must not ship: they name no dictionary key, so a Polish
  // reader would have been handed English link labels beside an otherwise translated document
  assert.notInclude(en, "[GitHub](https://github.com/example/repo)");
  const pl = twinDocument(buildExperienceMd({ seo: experienceSeo({ experience: everyLink, preferredLanguage: "pl" }), translate: translatePl }));
  assert.include(pl, "[Repozytorium GitHub](https://github.com/example/repo)");
  assert.include(pl, "[Link na Żywo](https://example.com/live)");
  assert.include(pl, "[Zobacz Video](https://example.com/video)");
});

it("a 404 keeps the raw slug in frontmatter and escapes only the prose path", () => {
  // The slug reaches two different documents: YAML frontmatter, where it must stay raw between
  // JSON quotes, and the Markdown body, where its significant characters must be escaped so the
  // prose path cannot fabricate emphasis or structure.
  const md = twinDocument(buildNotFoundMd({ slug: Option.some("*draft*"), preferredLanguage: "en", translate: translateEn }));
  const frontmatterBlock = md.split("\n\n")[0] ?? "";

  assert.include(frontmatterBlock, '\\"*draft*\\"');
  assert.notInclude(frontmatterBlock, "\\*draft");
  assert.include(md, "No Markdown document exists for /\\*draft\\*.");
});

it("an unparseable twin address never quotes a fabricated slug", () => {
  // The URL carried no decodable slug, so the document says so: an AI citation must never read
  // back an identifier ("unknown") that was never requested
  const md = twinDocument(buildNotFoundMd({ slug: Option.none(), preferredLanguage: "en", translate: translateEn }));
  assert.include(md, "No Markdown document exists for this address.");
  assert.include(md, "No page for this address.");
  assert.notInclude(md, "unknown");
  // The language variants of the same fallback stay consistent for a Polish reader
  const pl = twinDocument(buildNotFoundMd({ slug: Option.none(), preferredLanguage: "pl", translate: translateEn }));
  assert.include(pl, "Dokument Markdown dla tego adresu nie istnieje.");
});

it("a 404 publishes only the identity facts it can honestly claim", () => {
  // A missing page has no canonical URL and no page type, so the AI reuse note names the facts a
  // page twin publishes, not facts every twin including this one carries.
  const { facts } = buildNotFoundMd({ slug: Option.none(), preferredLanguage: "en", translate: translateEn });

  assert.deepStrictEqual(Object.keys(facts).sort(), ["author", "description", "lang", "title"]);
});

// regression guards from regression-guards.test.ts

it("a fact label is escaped exactly once, so no stray backslash reaches the twin", () => {
  // mdFact neutralizes both halves of a `Label: value` line. buildExperienceMd previously escaped
  // its labels a second time before handing them over, which doubled every backslash the first
  // pass had written — so an authored "Role _" rendered as "Role \\_" with a literal stray "\".
  const hostile = (source: string): string => (source === "Role" ? "Role _" : source);

  const md = twinDocument(buildExperienceMd({ seo: experienceSeo({ experience: sampleExperience, preferredLanguage: "en" }), translate: hostile }));

  // Exactly one backslash: the one mdFact added, rendering back as the authored underscore
  assert.include(md, "- Role \\_: Full-Stack Developer");
  // The doubled form the second pass produced, which renders as a stray "\" the site never wrote
  assert.notInclude(md, "- Role \\\\\\_: Full-Stack Developer");
});

it("authored prose beginning with an indent cannot revive the marker its indent was hiding", () => {
  // The pass's own trim deletes a *leading* indent, because the published block is joined after a
  // blank line and so always starts a line. That indent is the only reason the block rules leave a
  // four-space or tab marker literal, so trimming it away published a live heading, bullet or
  // delimiter row: authored prose beginning with "    # x" forged a second H1 in the twin body.
  const twin = buildExperienceMd({
    seo: experienceSeo({ experience: { ...sampleExperience, txt: "    # Injected heading\n\n    - forged bullet" }, preferredLanguage: "en" }),
    translate: (source) => source,
  });

  assert.include(twin.body, "\\# Injected heading");
  // One H1 per document: the forged heading is neutralized, not merely re-indented
  assert.strictEqual((twin.body.match(/^# /gm) ?? []).length, 1);
  // The later block keeps its indent, and so the code block the author actually wrote
  assert.strictEqual(escapeMd("para\n\n    # indented heading"), "para\n\n    # indented heading");
});
