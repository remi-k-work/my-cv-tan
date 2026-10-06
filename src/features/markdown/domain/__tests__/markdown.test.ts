// services, features, and other libraries
import { assert, it } from "@effect/vitest";
import { Effect, Option } from "effect";

// domain
import {
  buildContactMd,
  buildEducationMd,
  buildExperienceMd,
  buildHomeMd,
  buildLlmsTxt,
  buildNotFoundMd,
  escapeMd,
  frontmatter,
  mdNotFoundResponse,
  mdResponse,
  parseLangParam,
  slugFromMdPathname,
  txtResponse,
} from "../index";
import { MARKDOWN_CONTENT_TYPE } from "../constants";

// types
import type { Experience } from "@/features/experience/domain";

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

it("frontmatter emits a delimited block with quoted values", () => {
  const block = frontmatter({ title: "Hello", canonical: "https://www.remiforge.dev/sample-role" });
  assert.isTrue(block.startsWith("---\n"));
  assert.include(block, `title: "Hello"`);
  assert.include(block, `canonical: "https://www.remiforge.dev/sample-role"`);
});

it("escapeMd neutralizes heading characters and collapses blank lines", () => {
  assert.strictEqual(escapeMd("# Hello\n\n\nWorld *bold* [link]"), "\\# Hello\n\nWorld \\*bold\\* \\[link\\]");
});

it("buildExperienceMd renders frontmatter, H1, skills and links with a canonical note", () => {
  const md = buildExperienceMd(sampleExperience, "en");
  assert.include(md, `canonical: "https://www.remiforge.dev/sample-role"`);
  assert.include(md, `# Full-Stack Developer at Sample Co`);
  assert.include(md, `- TypeScript`);
  assert.include(md, `https://github.com/example/repo`);
  assert.include(md, `lang: "en"`);
  assert.include(md, `type: "work-experience"`);
  // Body prose must be escaped (frontmatter is YAML-quoted, so raw chars are fine there)
  assert.include(md, "\\*\\*care\\*\\*");
  assert.include(md, "\\#hashtags");
});

it("buildHomeMd groups work and projects and links to .md twins", () => {
  const md = buildHomeMd({ pageTitles: null, localizedContent: null, experienceList: [sampleExperience], preferredLanguage: "en" });
  assert.include(md, `canonical: "https://www.remiforge.dev/"`);
  assert.include(md, `https://www.remiforge.dev/sample-role.md`);
  assert.include(md, `https://www.remiforge.dev/education.md`);
});

it("buildEducationMd and buildNotFoundMd stay parseable with canonical links", () => {
  const edu = buildEducationMd({ pageTitles: null, educationList: [], preferredLanguage: "pl" });
  assert.include(edu, `lang: "pl"`);
  assert.include(edu, `_No entries._`);

  const missing = buildNotFoundMd("bogus", "en");
  assert.include(missing, `# Not Found`);
  assert.include(missing, `https://www.remiforge.dev/index.md`);
});

it("buildContactMd advertises the same social profiles as the HTML page", () => {
  const md = buildContactMd({ pageTitles: null, preferredLanguage: "en" });
  assert.include(md, `GitHub: https://github.com/remi-k-work`);
  assert.include(md, `LinkedIn: https://linkedin.com/in/remi-k-work`);
});

it("buildLlmsTxt indexes pages, grouped experience and AI guidance", () => {
  const txt = buildLlmsTxt([sampleExperience]);
  assert.include(txt, `# Remi Forge`);
  assert.include(txt, `## Pages`);
  assert.include(txt, `https://www.remiforge.dev/index.md`);
  assert.include(txt, `## Work Experience`);
  assert.include(txt, `- [Full-Stack Developer at Sample Co](https://www.remiforge.dev/sample-role.md)`);
  assert.include(txt, `## Notes for AI systems`);
});

it("mdResponse uses text/markdown while the 404 variant keeps the same content type", () => {
  const ok = mdResponse("# Hi", "en");
  assert.strictEqual(ok.status, 200);
  assert.strictEqual(ok.headers.get("Content-Type"), MARKDOWN_CONTENT_TYPE);
  assert.strictEqual(ok.headers.get("Content-Language"), "en");

  const missing = mdNotFoundResponse("# Gone", "pl");
  assert.strictEqual(missing.status, 404);
  assert.strictEqual(missing.headers.get("Content-Type"), MARKDOWN_CONTENT_TYPE);

  const txt = txtResponse("# Plain");
  assert.strictEqual(txt.status, 200);
  assert.strictEqual(txt.headers.get("Content-Type"), "text/plain; charset=utf-8");
});

it.effect("parseLangParam honors ?lang= and rejects unknown values", () =>
  Effect.gen(function* () {
    assert.deepStrictEqual(yield* parseLangParam("https://x.test/index.md?lang=pl"), Option.some("pl"));
    assert.deepStrictEqual(yield* parseLangParam("https://x.test/index.md"), Option.none());
    assert.deepStrictEqual(yield* parseLangParam("https://x.test/index.md?lang=de"), Option.none());
  })
);

it.effect("slugFromMdPathname extracts slugs and never throws on hostile input", () =>
  Effect.gen(function* () {
    assert.deepStrictEqual(yield* slugFromMdPathname("https://x.test/benefit-finance.md"), Option.some("benefit-finance"));
    assert.deepStrictEqual(yield* slugFromMdPathname("https://x.test/benefit-finance.md?lang=pl"), Option.some("benefit-finance"));
    assert.deepStrictEqual(yield* slugFromMdPathname("https://x.test/my%20project.md"), Option.some("my project"));
    // Malformed percent-encoding, missing slug, and extensionless paths all become None (clean 404)
    assert.deepStrictEqual(yield* slugFromMdPathname("https://x.test/%zz.md"), Option.none());
    assert.deepStrictEqual(yield* slugFromMdPathname("https://x.test/%E0%A4%A.md"), Option.none());
    assert.deepStrictEqual(yield* slugFromMdPathname("https://x.test/"), Option.none());
    assert.deepStrictEqual(yield* slugFromMdPathname("https://x.test/.md"), Option.none());
  })
);
