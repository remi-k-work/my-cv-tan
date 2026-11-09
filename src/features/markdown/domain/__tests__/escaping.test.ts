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
