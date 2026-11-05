// Direct unit tests for the Markdown serialization toolkit in ./format.
// These primitives are security-sensitive: authored or translated content must never be able to
// fabricate Markdown structure, so each builder's escaping is pinned here rather than only
// indirectly through the twin and index builder tests.

// services, features, and other libraries
import { assert, it } from "@effect/vitest";

// domain
import {
  demoteHeadings,
  escapeMd,
  escapeMdInline,
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

it("mdLink escapes the label and percent-encodes parens in the href", () => {
  assert.strictEqual(mdLink("Evil](label", "https://x.test/a"), "[Evil\\](label](https://x.test/a)");
  assert.strictEqual(mdLink("Label", "https://x.test/a(b)"), "[Label](https://x.test/a%28b%29)");
});

it("demoteHeadings appends two levels to every heading", () => {
  // The companion document wraps twins under a site H1, so each twin heading is demoted by two
  // (H1 document title → H3, H2 section → H4, etc.) to keep a single-document hierarchy.
  assert.strictEqual(demoteHeadings("# Home\n## Section\n### Deep"), "### Home\n#### Section\n##### Deep");
  assert.strictEqual(demoteHeadings("no headings here"), "no headings here");
});

it("mdBody filters out falsy blocks and joins the rest with blank lines", () => {
  assert.strictEqual(mdBody(["a", "", "b", "c"]), "a\n\nb\n\nc");
  assert.strictEqual(mdBody(["only"]), "only");
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
