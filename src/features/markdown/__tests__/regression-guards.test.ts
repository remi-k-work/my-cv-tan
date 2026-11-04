// services, features, and other libraries
import { assert, it } from "@effect/vitest";
import { escapeMd, escapeMdInline as escapeInline, mdFact, mdIndexEntry, mdLink } from "../domain/format";
import { buildExperienceMd } from "../domain/twins";

// types
import type { Experience } from "@/features/experience/domain/models";

// These assertions pin the two defects the GEO/Markdown refactor fixed. Both corrupted rendered
// text rather than breaking it outright, so neither could ever surface as a failing diff — only as
// a stray backslash an AI indexer has to strip before it can quote the content.

const sampleExperience: Experience = {
  type: "e",
  slug: "sample-role",
  year: "Mar 2026",
  role: "Full-Stack Developer",
  company: "Sample Co",
  txt: "Built things with care.",
  gitHubLink: "https://github.com/example/repo",
  imageName: "01",
  skillsUsed: ["TypeScript", "React"],
};

it("a fact label is escaped exactly once, so no stray backslash reaches the twin", () => {
  // mdFact neutralizes both halves of a `Label: value` line. buildExperienceMd previously escaped
  // its labels a second time before handing them over, which doubled every backslash the first
  // pass had written — so an authored "Role _" rendered as "Role \\_" with a literal stray "\".
  const hostile = (source: string): string => (source === "Role" ? "Role _" : source);

  const md = buildExperienceMd({ experience: sampleExperience, preferredLanguage: "en", translate: hostile });

  // Exactly one backslash: the one mdFact added, rendering back as the authored underscore
  assert.include(md, "- Role \\_: Full-Stack Developer");
  // The doubled form the second pass produced, which renders as a stray "\" the site never wrote
  assert.notInclude(md, "- Role \\\\\\_: Full-Stack Developer");
});

it("mdFact neutralizes a hostile label without needing the caller to pre-escape it", () => {
  // One pass is the whole contract: the builder is the only escaper, and a caller that escapes
  // first is what produced the defect above.
  assert.strictEqual(mdFact("Role _", "value"), "Role \\_: value");
  assert.strictEqual(mdFact("Evil]_# [", "value"), "Evil\\]\\_# \\[: value");
});

it("escapeMd never destroys an authored character, whatever the shape it arrives in", () => {
  // The strikethrough rule used to match a whole run and replace all of it with one "\~\~", so a
  // four-tilde run reached the twin as two tildes: authored characters deleted, not neutralized.
  // A Genuine tilde run is also prose in this content model (a marketing "until ~~date~~"), so both
  // spellings must come back with every character the author wrote.
  assert.strictEqual(escapeMd("~~deprecated~~"), "\\~\\~deprecated\\~\\~");
  assert.strictEqual(escapeMd("~~~~"), "\\~\\~\\~\\~");
  assert.strictEqual(escapeMd("~~~~~~"), "\\~\\~\\~\\~\\~\\~");
  // A lone marker still needs no run, so it stays literal
  assert.strictEqual(escapeMd("roughly ~30% of the time"), "roughly ~30% of the time");
});

it("mdLink neutralizes a hostile label without the caller pre-escaping it", () => {
  // Every Markdown link the feature prints is built here, so the escape lives in one place instead
  // of once per surface — a call site that escaped its own label would double the backslashes above.
  assert.strictEqual(mdLink("Evil](label", "https://x.test/a"), "[Evil\\](label](https://x.test/a)");
  assert.strictEqual(mdLink("A *b* _c_", "https://x.test/a"), "[A \\*b\\* \\_c\\_](https://x.test/a)");
});

it("mdIndexEntry keeps summaries inline and escapes their authored formatting", () => {
  const entry = mdIndexEntry("Role", "https://site.test/role", "https://site.test/role.md", "A *bold* summary\n- hidden item");

  assert.include(entry, "A \\*bold\\* summary - hidden item");
  assert.notInclude(entry, "\n- hidden item");
});

it("escapeMd neutralizes a GFM table so authored pipes cannot fabricate one", () => {
  // A delimiter row under a pipe-separated header row opens a GFM table, and the pipe itself is
  // prose punctuation ("the ratio A | B mattered") so it cannot be escaped. The row is escaped
  // instead: the leading "\" makes its first cell invalid, and CommonMark renders "\-" back as the
  // authored "-", so no character is lost and no table forms.
  assert.strictEqual(escapeMd("a | b\n--- | ---\n1 | 2"), "a | b\n\\--- | ---\n1 | 2");
  // The alignment variant is a delimiter row too, and its escape lands after the colon. The
  // invariant being asserted is "add a backslash, lose no character": every row above comes back
  // exactly one "\" longer than the authored line, so no authored character is destroyed.
  assert.strictEqual(escapeMd(":--|--:"), ":\\--|--:");
  assert.strictEqual(escapeMd("| --- |"), "| \\--- |");
  // Prose pipes are untouched in either direction: a pipe line that starts with a letter never
  // matches the block anchor, and a pipe line with no dash run is not a delimiter row
  assert.strictEqual(escapeMd("the ratio A | B mattered"), "the ratio A | B mattered");
  assert.strictEqual(escapeMd("a | b"), "a | b");
  // A bare thematic break and a setext underline are claimed by their own rules, so the table rule
  // never sees their already-escaped output
  assert.strictEqual(escapeMd("---"), "\\---");
  assert.strictEqual(escapeMd("Sub\n--"), "Sub\n\\--");
  // A bullet is escaped by the bullet rule, which runs first: the table rule does not re-escape it
  assert.strictEqual(escapeMd("- item one"), "\\- item one");
});

it("escapeMdInline drops padding through the escape pass's own trim, not a second one", () => {
  assert.strictEqual(escapeInline("  spaced   out\nvalue  "), "spaced   out value");
  assert.strictEqual(escapeInline("> quoted"), "\\> quoted");
  // Block-level escaping is unchanged: the trim is shared, not duplicated
  assert.strictEqual(escapeMd("# heading\n\n\n\nmore"), "\\# heading\n\nmore");
});
