import { assert, it } from "@effect/vitest";
import { Option } from "effect";
import { parseLangParam, slugFromMdPathname } from "../requests";
import { absoluteUrl, experienceMarkdownPath, markdownTwinUrl, withLanguageParam } from "@/features/meta/domain/urls";
import { SITE_LANGUAGES } from "@/domain/constants";

it("parseLangParam honors ?lang= and rejects unknown values", () => {
  for (const language of SITE_LANGUAGES) {
    assert.deepStrictEqual(parseLangParam(`https://x.test/index.md?lang=${language}`), Option.some(language));
  }
  // Case-insensitive normalization.
  assert.deepStrictEqual(parseLangParam("https://x.test/index.md?lang=EN"), Option.some("en"));
  assert.deepStrictEqual(parseLangParam("https://x.test/index.md"), Option.none());
  assert.deepStrictEqual(parseLangParam("https://x.test/index.md?lang=xx"), Option.none());
});

it("a published twin pin round-trips through the one parameter its parser reads", () => {
  for (const language of SITE_LANGUAGES) {
    assert.deepStrictEqual(parseLangParam(withLanguageParam("https://www.remiforge.dev/index.md", language)), Option.some(language));
  }
});

it("slugFromMdPathname extracts slugs and never throws on hostile input", () => {
  assert.deepStrictEqual(slugFromMdPathname("https://x.test/benefit-finance.md"), Option.some("benefit-finance"));
  assert.deepStrictEqual(slugFromMdPathname("https://x.test/benefit-finance.md?lang=pl"), Option.some("benefit-finance"));
  assert.deepStrictEqual(slugFromMdPathname("https://x.test/my%20project.md"), Option.some("my project"));
  // Degrades gracefully to None on malformed encodings, root, or extensionless paths.
  assert.deepStrictEqual(slugFromMdPathname("https://x.test/%zz.md"), Option.none());
  assert.deepStrictEqual(slugFromMdPathname("https://x.test/%E0%A4%A.md"), Option.none());
  assert.deepStrictEqual(slugFromMdPathname("https://x.test/"), Option.none());
  assert.deepStrictEqual(slugFromMdPathname("https://x.test/.md"), Option.none());
  // Nested paths are rejected to match flat route structure.
  assert.deepStrictEqual(slugFromMdPathname("https://x.test/parent/benefit-finance.md"), Option.none());
  assert.deepStrictEqual(slugFromMdPathname("https://x.test/parent%2Fbenefit-finance.md"), Option.some("parent/benefit-finance"));
});

it("a published twin route parses back to the very slug it was built from", () => {
  const slugs = ["benefit-finance", "my project", "résumé & more", "role (senior)", "C# .NET", "a/b"];

  for (const slug of slugs) {
    assert.deepStrictEqual(slugFromMdPathname(markdownTwinUrl(experienceMarkdownPath(slug), "pl")), Option.some(slug), `${slug} twin route`);
    assert.deepStrictEqual(slugFromMdPathname(absoluteUrl(experienceMarkdownPath(slug))), Option.some(slug), `${slug} unpinned twin route`);
  }
});
