// Direct unit tests for the Markdown serialization toolkit in ./format and the escape engine it
// applies in ./escape. These primitives are security-sensitive: authored or translated content must
// never be able to fabricate Markdown structure, so each builder's escaping is pinned here rather
// than only indirectly through the twin and index builder tests.

// services, features, and other libraries
import { assert, it } from "@effect/vitest";

// domain
import { escapeMd, escapeMdInline } from "../escape";
import {
  demoteHeadings,
  fencedFacts,
  frontmatter,
  mdBody,
  mdBulletList,
  mdDocument,
  mdEmptyMarker,
  mdHeading,
  mdDocumentLinks,
  mdIndexEntry,
  mdLink,
  mdProfileLinks,
  mdQuote,
  mdTitledSection,
  translatedLink,
} from "../format";

// types
import type { Translate } from "@/domain/models";

const translateEn: Translate = (source) => source;

it("mdHeading renders one level with the text escaped inline", () => {
  assert.strictEqual(mdHeading(1, "Hello *world*"), "# Hello \\*world\\*");
  assert.strictEqual(mdHeading(2, "a [b](c)"), "## a \\[b\\](c)");
  // `<` is escaped inline; `>` only escapes at a line start, so mid-text `>` stays raw
  assert.strictEqual(mdHeading(3, "x <y>"), "### x \\<y>");
});

it("mdQuote prefixes an escaped blockquote line", () => {
  // A leading `>` escapes at line start (block rule); mdQuote adds its own `> ` prefix
  assert.strictEqual(mdQuote("> quoted"), "> \\> quoted");
  assert.strictEqual(mdQuote("plain"), "> plain");
});

it("a blank pull quote or heading is dropped rather than left as a stray marker", () => {
  // Both builders guard against an empty block: `> ` and `# ` render as a marker with no content,
  // which is a block a parser has to reconcile against nothing. Whitespace-only text renders the
  // same stray marker, so it counts as empty too — mdBody filters the result out of the document.
  for (const empty of ["", " ", "\t", "\n"]) {
    assert.strictEqual(mdQuote(empty), "", `a quote over ${JSON.stringify(empty)} must not render`);
    assert.strictEqual(mdHeading(1, empty), "", `a heading over ${JSON.stringify(empty)} must not render`);
  }
  // Padding around real content is still content: the escape pass trims it, the block keeps it
  assert.strictEqual(mdHeading(2, "  padded  "), "## padded");
  assert.strictEqual(mdQuote("  padded  "), "> padded");
});

it("mdBulletList prefixes each item and joins with newlines", () => {
  assert.strictEqual(mdBulletList(["a", "b"]), "- a\n- b");
  assert.strictEqual(mdBulletList([]), "");
});

it("mdTitledSection is an H2 heading followed by its body", () => {
  assert.strictEqual(mdTitledSection("Title", "body"), "## Title\n\nbody");
  // A blank body is filtered out by mdBody, leaving just the heading
  assert.strictEqual(mdTitledSection("Title", ""), "## Title");
});

it("mdDocument joins blocks with blank lines and ends with a newline", () => {
  assert.strictEqual(mdDocument(["a", "b"]), "a\n\nb\n");
  assert.strictEqual(mdDocument(["only"]), "only\n");
  assert.strictEqual(mdDocument([]), "\n");
});

it("mdEmptyMarker wraps the translated text in emphasis after escaping", () => {
  assert.strictEqual(mdEmptyMarker(translateEn), "_No entries._");
  assert.strictEqual(
    mdEmptyMarker((source) => (source === "No entries." ? "Brak wpisów_" : source)),
    "_Brak wpisów\\__"
  );
});

it("mdProfileLinks renders one fact line per profile", () => {
  const profiles = [
    { name: "GitHub", href: "https://github.com/remi-k-work" },
    { name: "LinkedIn", href: "https://linkedin.com/in/remi-k-work" },
  ];
  const lines = mdProfileLinks(profiles);
  assert.deepStrictEqual(lines, ["GitHub: https://github.com/remi-k-work", "LinkedIn: https://linkedin.com/in/remi-k-work"]);
});

it("mdDocumentLinks makes every href absolute and translates labels", () => {
  const docs = [
    { label: "CV (English)", href: "/my-cv.pdf" },
    { label: "Certificates", href: "/my-certificates.pdf" },
  ];
  const pl = (source: string) => (source === "CV (English)" ? "CV (po angielsku)" : source);
  const result = mdDocumentLinks(docs, pl);
  // mdDocumentLinks returns one joined bullet-list string
  assert.strictEqual(result, "- [CV (po angielsku)](https://www.remiforge.dev/my-cv.pdf)\n- [Certificates](https://www.remiforge.dev/my-certificates.pdf)");
});

it("translatedLink translates the label before building the link", () => {
  const pl = (source: string) => (source === "Home page" ? "Strona główna" : source);
  assert.strictEqual(translatedLink("Home page", "https://www.remiforge.dev/index.md", pl), "[Strona główna](https://www.remiforge.dev/index.md)");
});

it("mdIndexEntry prints label, canonical, twin and an optional inline summary", () => {
  assert.strictEqual(
    mdIndexEntry("Role", "https://site.test/role", "https://site.test/role.md"),
    "[Role](https://site.test/role): Markdown: https://site.test/role.md"
  );
  assert.strictEqual(
    mdIndexEntry("Role", "https://site.test/role", "https://site.test/role.md", "A *bold* summary"),
    "[Role](https://site.test/role): A \\*bold\\* summary Markdown: https://site.test/role.md"
  );
});

it("mdIndexEntry encodes parens in the twin URL exactly like mdLink encodes its href", () => {
  // Every URL the toolkit embeds is a Markdown destination, and a raw ")" would close it early.
  // The label goes through mdLink, so the twin spelling beside it has to take the same treatment.
  const entry = mdIndexEntry("Role", "https://site.test/role(1)", "https://site.test/role(1).md");

  assert.include(entry, "](https://site.test/role%281%29)");
  assert.include(entry, "Markdown: https://site.test/role%281%29.md");
  assert.notInclude(entry, "(1)");
});

it("mdLink escapes the label and percent-encodes parens in the href", () => {
  assert.strictEqual(mdLink("Evil](label", "https://x.test/a"), "[Evil\\](label](https://x.test/a)");
  assert.strictEqual(mdLink("Label", "https://x.test/a(b)"), "[Label](https://x.test/a%28b%29)");
});

it("mdLink keeps a raw destination intact by encoding the whitespace that would end it early", () => {
  // A raw Markdown destination ends at the first whitespace character, which is legal inside a URL.
  // The href a caller hands over can carry one — it is authored content wherever it is not
  // site-derived — so the destination encoder closes the gap the paren encoding already covered,
  // and every embedded destination takes both.
  assert.strictEqual(mdLink("Label", "https://x.test/a b"), "[Label](https://x.test/a%20b)");
  assert.strictEqual(mdLink("Label", "https://x.test/a(b) c"), "[Label](https://x.test/a%28b%29%20c)");
  // The paren encoding is unchanged on its own, and a tab is as terminating as a space
  assert.strictEqual(mdLink("Label", "https://x.test/a\tb"), "[Label](https://x.test/a%20b)");
  // A destination with neither character is byte-identical to the input
  assert.strictEqual(mdLink("Label", "https://x.test/a-b"), "[Label](https://x.test/a-b)");
});

it("demoteHeadings appends two levels to every heading", () => {
  // The companion document wraps twins under a site H1, so each twin heading is demoted by two
  // (H1 document title → H3, H2 section → H4, etc.) to keep a single-document hierarchy.
  assert.strictEqual(demoteHeadings("# Home\n## Section\n### Deep"), "### Home\n#### Section\n##### Deep");
  assert.strictEqual(demoteHeadings("no headings here"), "no headings here");
});

it("mdBody drops empty and whitespace-only blocks and joins the rest with blank lines", () => {
  assert.strictEqual(mdBody(["a", "", " \n\t ", "b", "c"]), "a\n\nb\n\nc");
  assert.strictEqual(mdBody(["only"]), "only");
  assert.strictEqual(mdBody([" \n\t "]), "");
  assert.strictEqual(mdBody([]), "");
});

it("frontmatter emits a delimited block with JSON-quoted values", () => {
  const block = frontmatter({ title: "Hello", canonical: "https://www.remiforge.dev/sample-role" });
  assert.strictEqual(block, '---\ntitle: "Hello"\ncanonical: "https://www.remiforge.dev/sample-role"\n---');
});

it("frontmatter escapes YAML-unsafe control characters that JSON.stringify leaves raw", () => {
  const block = frontmatter({ title: "bel\u007f c1\u0085 ls\u2028 ps\u2029" });
  assert.notInclude(block, "\u007f");
  assert.notInclude(block, "\u0085");
  assert.notInclude(block, "\u2028");
  assert.notInclude(block, "\u2029");
  assert.include(block, `title: "bel\\u007f c1\\u0085 ls\\u2028 ps\\u2029"`);
});

it("fencedFacts widens its fence past any backtick run the facts themselves carry", () => {
  // A value carrying a run as long as the fence would close the block early, and every line after
  // it would publish as ordinary companion prose an indexer reads as structure rather than as data.
  assert.strictEqual(
    fencedFacts({ title: "Use ```code``` blocks", canonical: "https://www.remiforge.dev/x" }),
    '````yaml\ntitle: "Use ```code``` blocks"\ncanonical: "https://www.remiforge.dev/x"\n````'
  );

  // A shorter run never could close the fence, so it keeps the three-backtick block every other
  // surface pins
  assert.strictEqual(fencedFacts({ title: "Use `inline` code" }), '```yaml\ntitle: "Use `inline` code"\n```');
});

it("fencedFacts measures the longest run, not the number of runs", () => {
  // The width is the longest run plus one, never the count of runs: Array.reduce also passes its
  // index to the callback, and Math.max absorbed it — so a value carrying N backtick runs widened
  // its fence by the run count instead of by its longest run (eight single-backtick runs once
  // produced an eight-backtick fence).
  assert.strictEqual(fencedFacts({ title: "a `1` b `2` c `3` d `4` e `5`" }), '```yaml\ntitle: "a `1` b `2` c `3` d `4` e `5`"\n```');
});

it("escapeMd neutralizes structure-building characters everywhere", () => {
  assert.strictEqual(escapeMd("# Hello\n\n\nWorld *bold* [link]"), "\\# Hello\n\nWorld \\*bold\\* \\[link\\]");
  assert.strictEqual(escapeMd("Title\n====="), "Title\n\\=====");
  assert.strictEqual(escapeMd("Sub\n--"), "Sub\n\\--");
});

it("escapeMdInline flattens newlines before escaping", () => {
  assert.strictEqual(escapeMdInline("Design\n- Systems"), "Design - Systems");
  assert.strictEqual(escapeMdInline("Design\r\n- Systems"), "Design - Systems");
  assert.strictEqual(escapeMdInline("Design\r- Systems"), "Design - Systems");
  assert.strictEqual(escapeMdInline("  spaced   out\nvalue  "), "spaced   out value");
});

it("escapeMd preserves literal backslashes while escaping adjacent Markdown punctuation", () => {
  assert.strictEqual(escapeMd(String.raw`C:\src\test`), String.raw`C:\\src\\test`);
  assert.strictEqual(escapeMdInline(String.raw`literal \* text`), String.raw`literal \\\* text`);
});

it("escapeMd leaves markers that cannot build structure at their indentation untouched", () => {
  // Four spaces — or a tab — open an indented code block, where a backslash is content rather than
  // an escape: neutralising the marker there prints a stray "\" the author never wrote. The
  // regression-guards invariant (only ever add a backslash) cuts both ways.
  assert.strictEqual(escapeMd("Led the migration.\n\n    # indented heading"), "Led the migration.\n\n    # indented heading");
  assert.strictEqual(escapeMd("Signed\n    Jane Doe"), "Signed\n    Jane Doe");
  assert.strictEqual(escapeMd("para\n\t- tab indented bullet"), "para\n\t- tab indented bullet");
  assert.strictEqual(escapeMd("para\n    - lazy continuation"), "para\n    - lazy continuation");
  // A lazy continuation line is still paragraph text, and an inner line a strikethrough needs no run
  assert.strictEqual(escapeMd("text\n# interrupt"), "text\n\\# interrupt");
  // Three spaces is the most a real ATX heading may carry, so it stays neutralised
  assert.strictEqual(escapeMd("para\n\n   # heading"), "para\n\n   \\# heading");
  // The thematic-break and setext rules carry the same bound: an indented code block's content is
  // not structure, so its rows come back exactly as authored rather than one backslash heavier
  assert.strictEqual(escapeMd("para\n\n\t---"), "para\n\n\t---");
  assert.strictEqual(escapeMd("para\n\n    ---"), "para\n\n    ---");
  assert.strictEqual(escapeMd("para\n\n\t==="), "para\n\n\t===");
  assert.strictEqual(escapeMd("para\n\n   ---"), "para\n\n   \\---");
  assert.strictEqual(escapeMd("para\n\n\t=="), "para\n\n\t==");
  // A delimiter row is the same: at most three spaces of indent claims it, four leaves it literal
  assert.strictEqual(escapeMd("| a | b |\n    | - | - |"), "| a | b |\n    | - | - |");
  assert.strictEqual(escapeMd("| a | b |\n   | - | - |"), "| a | b |\n   | \\- | - |");
});

it("escapeMd neutralizes only a real GFM delimiter row, never prose that starts with a pipe", () => {
  // The pipe is prose punctuation ("the ratio A | B mattered"), so the row is what gets escaped;
  // requiring the whole line to be dashes, colons and pipes keeps a pipe-leading sentence intact.
  assert.strictEqual(escapeMd("|- item|"), "|- item|");
  assert.strictEqual(escapeMd("|- a table row that starts with a pipe"), "|- a table row that starts with a pipe");
  // A genuine delimiter row still loses its leading cell, in every spelling
  assert.strictEqual(escapeMd("| --- |"), "| \\--- |");
  assert.strictEqual(escapeMd(":--|--:"), ":\\--|--:");
  assert.strictEqual(escapeMd("|-|-|"), "|\\-|-|");
  assert.strictEqual(escapeMd("table\n\n| a | b |\n| - | - |"), "table\n\n| a | b |\n| \\- | - |");
});
