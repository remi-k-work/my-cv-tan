// The escape engine of ./escape exercised directly rather than only through the twin and index
// builders that call it. These primitives are the one boundary authored or translated content
// crosses before it reaches a crawler-parseable document, so their invariants are pinned here:
// nothing may be deleted, nothing may survive as structure, and frontmatter must stay parseable
// YAML whatever a value carries.

// services, features, and other libraries
import { assert, it } from "@effect/vitest";

// domain
import { escapeMd, escapeMdInline } from "../escape";
import { fencedFacts, frontmatter, mdLink, twinDocument } from "../format";

// types
import type { MarkdownTwin } from "../models";

// Every pass only ever inserts a backslash, so a decoded rendering is byte-equal to the source
// minus the escapes. Case-by-case assertions pin specific rules; this pins the rule-independent
// invariant that every rule below relies on.
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
    // CommonMark decodes a backslash before ASCII punctuation back to that character, so stripping
    // the escape characters a pass wrote returns exactly what the author wrote.
    const decoded = escapeMd(source).replace(/\\(?=[\\!"#$%&'()*+,\-./:;<=>?@[\]^_`{|}~])/g, "");
    assert.strictEqual(decoded.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n").trim(), source.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n").trim());
  }
});

// The invariant above is only as good as the decoder reading it back: a pass that simply strips a
// "\" before any punctuation consumes the backslash of an escaped backslash too, which is exactly
// how a character could be neutralized twice and still round-trip. Decoding left to right, one
// escape at a time, is what actually pins "no stray backslash of the engine's own" — the defect a
// second pass on an already-escaped marker publishes into a document an indexer has to strip.
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
  // A thematic-break run of underscores and the emphasis run of one word are the two families that
  // share a marker: escaping the run first left the run's own markers reading as unescaped
  // boundaries, so each grew a second backslash and the document rendered "\___".
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
  // Four spaces (or a tab) open an indented code block, where a backslash is content rather than
  // an escape: neutralising the marker there prints a stray "\" the author never wrote.
  assert.strictEqual(escapeMd("para\n\n    # indented heading"), "para\n\n    # indented heading");
  assert.strictEqual(escapeMd("para\n\n\t- tab indented bullet"), "para\n\n\t- tab indented bullet");
  // Three spaces is the most an ATX heading may carry, so it stays neutralised
  assert.strictEqual(escapeMd("para\n\n   # heading"), "para\n\n   \\# heading");
  // A delimiter row is the same: at most three spaces of indent claim it
  assert.strictEqual(escapeMd("| a | b |\n    | - | - |"), "| a | b |\n    | - | - |");
  assert.strictEqual(escapeMd("| a | b |\n   | - | - |"), "| a | b |\n   | \\- | - |");
  // The indent that keeps its meaning is the one a *later* block carries, after prose: mdBody joins
  // blocks with a blank line, so only a leading indent is ever stripped — and only the pass's own
  // trim can strip it. A leading indent is therefore normalized off the input before the rules run,
  // which keeps the marker it preceded a line-start marker the rules must neutralize rather than
  // leaving it literal for a code block the published document can never open.
  assert.strictEqual(escapeMd("    # Injected heading"), "\\# Injected heading");
  assert.strictEqual(escapeMd("\t- Injected bullet"), "\\- Injected bullet");
  assert.strictEqual(escapeMd("\n\n    | - |"), "| \\- |");
});

it("frontmatter keeps YAML parseable by escaping the characters JSON quoting leaves raw", () => {
  // DEL, the C1 controls and the two Unicode line separators would end a document outright
  for (const source of ["bel\u007f c1\u0085 ls\u2028 ps\u2029"]) {
    const block = frontmatter({ title: source });
    for (const character of ["\u007f", "\u0085", "\u2028", "\u2029"]) assert.notInclude(block, character);
    assert.include(block, `title: "bel\\u007f c1\\u0085 ls\\u2028 ps\\u2029"`);
  }
});

it("fencedFacts survives a fact value carrying a backtick run of any length", () => {
  // The fence must outrun the longest run inside it, or the authored run closes the block early
  // and every remaining fact publishes as companion prose.
  for (const run of ["`", "``", "```", "````", "`````"]) {
    const fenced = fencedFacts({ title: `a ${run} b` });

    const fence = /^(`+)\w+/.exec(fenced)?.[1] ?? "";
    assert.isAbove(fence.length, run.length, `fence of ${fence.length} could not hold a run of ${run.length}`);
    // Opening and closing fences are one length, so the block stays balanced
    assert.strictEqual((fenced.match(new RegExp(`^${fence}`, "gm")) ?? []).length, 2);
    assert.include(fenced, `a ${run} b`);
  }
});

it("a twin's frontmatter block is delimited, so a value cannot forge a second block", () => {
  // A value carrying "---" is JSON-quoted, so the only delimiters in the document are the two the
  // writer placed: an authored "---" cannot open a second frontmatter a parser would read as one.
  const twin: MarkdownTwin = { facts: { title: "a\n---\nb", description: "---" }, body: "body" };
  const document = twinDocument(twin);

  assert.strictEqual((document.match(/^---$/gm) ?? []).length, 2);
  assert.include(document, `title: "a\\n---\\nb"`);
});

it("mdLink neutralizes a hostile label without the caller pre-escaping it", () => {
  // Every Markdown link the feature prints is built here, so the escape lives in one place instead
  // of once per surface.
  assert.strictEqual(mdLink("Evil](label", "https://x.test/a"), "[Evil\\](label](https://x.test/a)");
  assert.strictEqual(mdLink("A *b* _c_", "https://x.test/a"), "[A \\*b\\* \\_c\\_](https://x.test/a)");
  assert.strictEqual(mdLink("## heading", "https://x.test/a"), "[\\## heading](https://x.test/a)");
});
