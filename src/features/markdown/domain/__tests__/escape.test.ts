import { assert, it } from "@effect/vitest";
import { escapeMd, escapeMdInline } from "../escape";
import { fencedFacts, frontmatter, mdLink, twinDocument } from "../format";
import type { MarkdownTwin } from "../models";

it("escapeMd never deletes an authored character, whatever the input carries", () => {
  const hostile = [
    "# heading",
    "> quoted",
    "- item",
    "1. ordered",
    "12) ordered",
    "---",
    "***",
    "Sub\n--",
    "Sub\n===",
    "~~~",
    "~~~~",
    "~~~~~~",
    "_em_",
    "__strong__",
    "intra_word_stays",
    "![alt](url)",
    "[link](url)",
    "`code`",
    "<div>raw</div>",
    "a | b",
    "| a | b |\n|---|---|\n1 | 2",
    ":--|--:",
    "| --- |",
    "|- item|",
    "literal \\ backslash",
    "C:\\src\\test",
    "financed by the EU initiative “STOP Exclusion!”",
    "ASP.NET and C#",
    ")> line continuation",
    "v1.5 draft",
    "roughly ~30% of the time",
    "plain = math",
    "\r\nCRLF line",
  ];

  for (const source of hostile) {
    // Stripping backslashes before punctuation restores authored characters without losses.
    const decoded = escapeMd(source).replace(/\\(?=[\\!"#$%&'()*+,\-./:;<=>?@[\]^_`{|}~])/g, "");
    assert.strictEqual(
      decoded
        .replace(/\r\n?/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim(),
      source
        .replace(/\r\n?/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
    );
  }
});

// Sequentially decodes escape sequences left-to-right to verify round-trip fidelity.
const decodeEscapes = (markdown: string) => {
  const escapable = /[\\!"#$%&'()*+,\-./:;<=>?@[\]^_`{|}~]/;
  let decoded = "";

  for (let index = 0; index < markdown.length; index++) {
    if (markdown[index] === "\\" && escapable.test(markdown[index + 1] ?? "")) index++;
    decoded += markdown[index];
  }

  return decoded;
};

it("escapeMd renders every authored character back, with no stray backslash of its own", () => {
  for (const source of ["___", "____", "_ _ _", "literal \\ backslash", "\\_x\\_", "**bold** _em_ ~~gone~~", "roughly ~30% of the time", "C:\\src\\test"]) {
    assert.strictEqual(decodeEscapes(escapeMd(source)), source);
  }
});

it("escapeMdInline always renders one line, so a value cannot become structure below its label", () => {
  for (const source of ["a\nb", "a\n\n\n\nb", "- x\n- y", "# h\n> q", "a\r\n- b"]) {
    const escaped = escapeMdInline(source);
    assert.notInclude(escaped, "\n");
    assert.notInclude(escaped, "\r");
  }
});

it("escapeMd leaves an indented code block's markers literal rather than one backslash heavier", () => {
  // Four spaces or tab open indented code blocks where backslashes are literal content.
  assert.strictEqual(escapeMd("para\n\n    # indented heading"), "para\n\n    # indented heading");
  assert.strictEqual(escapeMd("para\n\n\t- tab indented bullet"), "para\n\n\t- tab indented bullet");
  assert.strictEqual(escapeMd("para\n\n   # heading"), "para\n\n   \\# heading");
  assert.strictEqual(escapeMd("| a | b |\n    | - | - |"), "| a | b |\n    | - | - |");
  assert.strictEqual(escapeMd("| a | b |\n   | - | - |"), "| a | b |\n   | \\- | - |");
  assert.strictEqual(escapeMd("    # Injected heading"), "\\# Injected heading");
  assert.strictEqual(escapeMd("\t- Injected bullet"), "\\- Injected bullet");
  assert.strictEqual(escapeMd("\n\n    | - |"), "| \\- |");
});

it("frontmatter keeps YAML parseable by escaping the characters JSON quoting leaves raw", () => {
  for (const source of ["bel\u007f c1\u0085 ls\u2028 ps\u2029"]) {
    const block = frontmatter({ title: source });
    for (const character of ["\u007f", "\u0085", "\u2028", "\u2029"]) assert.notInclude(block, character);
    assert.include(block, `title: "bel\\u007f c1\\u0085 ls\\u2028 ps\\u2029"`);
  }
});

it("fencedFacts survives a fact value carrying a backtick run of any length", () => {
  for (const run of ["`", "``", "```", "````", "`````"]) {
    const fenced = fencedFacts({ title: `a ${run} b` });

    const fence = /^(`+)\w+/.exec(fenced)?.[1] ?? "";
    assert.isAbove(fence.length, run.length, `fence of ${fence.length} could not hold a run of ${run.length}`);
    assert.strictEqual((fenced.match(new RegExp(`^${fence}`, "gm")) ?? []).length, 2);
    assert.include(fenced, `a ${run} b`);
  }
});

it("a twin's frontmatter block is delimited, so a value cannot forge a second block", () => {
  const twin: MarkdownTwin = { facts: { title: "a\n---\nb", description: "---" }, body: "body" };
  const document = twinDocument(twin);

  assert.strictEqual((document.match(/^---$/gm) ?? []).length, 2);
  assert.include(document, `title: "a\\n---\\nb"`);
});

it("mdLink neutralizes a hostile label without the caller pre-escaping it", () => {
  assert.strictEqual(mdLink("Evil](label", "https://x.test/a"), "[Evil\\](label](https://x.test/a)");
  assert.strictEqual(mdLink("A *b* _c_", "https://x.test/a"), "[A \\*b\\* \\_c\\_](https://x.test/a)");
  assert.strictEqual(mdLink("## heading", "https://x.test/a"), "[\\## heading](https://x.test/a)");
});

// escapeMd neutralizes heading characters and collapses blank lines
it("escapeMd neutralizes heading characters and collapses blank lines", () => {
  assert.strictEqual(escapeMd("# Hello\n\n\nWorld *bold* [link]"), "\\# Hello\n\nWorld \\*bold\\* \\[link\\]");
  // Bare "=" / "--" runs under a paragraph would otherwise become setext headings
  assert.strictEqual(escapeMd("Title\n====="), "Title\n\\=====");
  assert.strictEqual(escapeMd("Sub\n--"), "Sub\n\\--");
  // Inline "=" characters are meaningless and stay untouched
  assert.strictEqual(escapeMd("plain = math"), "plain = math");
});

// escapeMd neutralizes the image constructor, so authored data cannot fabricate one
it("escapeMd neutralizes the image constructor, so authored data cannot fabricate one", () => {
  // The "!" rule reads the raw author text and therefore has to run before the bracket rule: once
  // that rule has written "\[" the lookahead no longer matches, and the "!" would never be escaped
  assert.strictEqual(escapeMd("![alt](https://evil.test/a-b.png)"), "\\!\\[alt\\](https://evil.test/a-b.png)");
  // An image marker inside prose is neutralized the same way
  assert.strictEqual(escapeMdInline("a ![b](c) d"), "a \\!\\[b\\](c) d");
});

// escapeMd neutralizes list markers at line end, not only before inline content
it("escapeMd neutralizes list markers at line end, not only before inline content", () => {
  // A bare marker opens an empty list item in CommonMark, so trailing markers are structure too
  assert.strictEqual(escapeMd("Come and see\n-"), "Come and see\n\\-");
  assert.strictEqual(escapeMd("Ordered steps\n1."), "Ordered steps\n1\\.");
  assert.strictEqual(escapeMd("Ordered steps\n12)"), "Ordered steps\n12\\)");
  // The inline case keeps working: the marker binds at the line start either way
  assert.strictEqual(escapeMd("- item one"), "\\- item one");
  // An ordered marker escapes at its trailing punctuation, never at the digit: a digit is not
  // ASCII punctuation, so "\1." would print a literal backslash instead of the authored text
  assert.strictEqual(escapeMd("1. item one"), "1\\. item one");
  // Thematic-break runs and setext underlines are claimed by their own rules, not the bullet rule
  assert.strictEqual(escapeMd("---"), "\\---");
  assert.strictEqual(escapeMd("Sub\n--"), "Sub\n\\--");
  // A number followed by inline content is prose, not a marker: only "." / ")" + space-or-EOL binds
  assert.strictEqual(escapeMd("v1.5 draft"), "v1.5 draft");
});

// escapeMd only escapes what can actually build markup, leaving authored punctuation intact
it("escapeMd only escapes what can actually build markup, leaving authored punctuation intact", () => {
  // Headings and blockquotes bind at the start of a line, so mid-sentence markers are literal text
  assert.strictEqual(escapeMd("Built with ASP.NET and C#"), "Built with ASP.NET and C#");
  assert.strictEqual(escapeMd(")> line continuation"), ")> line continuation");
  // ...while the same characters at a line start still lose their markup meaning
  assert.strictEqual(escapeMd("# heading\n> quoted"), "\\# heading\n\\> quoted");
  // An image needs "![", so a sentence-final "!" is plain punctuation
  assert.strictEqual(escapeMd("financed by the EU initiative “STOP Exclusion!”"), "financed by the EU initiative “STOP Exclusion!”");
  // "_" is literal inside a word (CommonMark's intraword rule), but emphasis still binds at a boundary
  assert.strictEqual(escapeMd("node_modules and snake_case names"), "node_modules and snake_case names");
  assert.strictEqual(escapeMd("an _emphasized_ word"), "an \\_emphasized\\_ word");
  // Strikethrough needs a run of two; a lone "~" and a pipe cannot build markup at all
  assert.strictEqual(escapeMd("roughly ~30% of the time"), "roughly ~30% of the time");
  assert.strictEqual(escapeMd("the ratio A | B mattered"), "the ratio A | B mattered");
  assert.strictEqual(escapeMd("~~deprecated~~ in favour of the new one"), "\\~\\~deprecated\\~\\~ in favour of the new one");
  // Entity references change rendered text unless their ampersands are escaped.
  assert.strictEqual(escapeMd("&copy; &amp; &#169;"), "\\&copy; \\&amp; \\&#169;");
  // Raw HTML is the one thing an author string must never reach the document, so "<" is always escaped
  assert.strictEqual(escapeMdInline("evil </script><script>alert(1)</script>"), "evil \\</script>\\<script>alert(1)\\</script>");
});

// escapeMdInline flattens newlines before escaping, so labels never inherit the bullet marker
it("escapeMdInline flattens newlines before escaping, so labels never inherit the bullet marker", () => {
  // "Design\n- Systems" would otherwise become a real list item nested inside the bullet
  assert.strictEqual(escapeMdInline("Design\n- Systems"), "Design - Systems");
  // Only the newline runs flatten: runs of spaces inside prose are content, not structure
  assert.strictEqual(escapeMdInline("  spaced   out\nvalue  "), "spaced   out value");
});
