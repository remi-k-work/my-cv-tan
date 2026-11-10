import { assert, it } from "@effect/vitest";
import { Option } from "effect";
import { absoluteUrl, experienceMarkdownPath, markdownTwinUrl, withLanguageParam } from "@/features/meta/domain/urls";
import { SITE_LANGUAGES } from "@/domain/constants";
import { documentName, parseLangParam, slugFromMdPathname } from "../request";

it("parseLangParam honors ?lang= and rejects unknown values", () => {
  for (const language of SITE_LANGUAGES) {
    assert.deepStrictEqual(parseLangParam(`https://x.test/index.md?lang=${language}`), Option.some(language));
  }
  // Case-insensitive normalization.
  assert.deepStrictEqual(parseLangParam("https://x.test/index.md?lang=EN"), Option.some("en"));
  assert.deepStrictEqual(parseLangParam("https://x.test/index.md"), Option.none());
  assert.deepStrictEqual(parseLangParam("https://x.test/index.md?lang=xx"), Option.none());
});

it("a published twin pin round-trips through the one parameter every publisher writes and the parser reads", () => {
  // Heads, twins, index entries and Link headers all advertise twin URLs with `?lang=`, so the
  // publisher and the parser are one contract across the feature boundary.
  for (const language of SITE_LANGUAGES) {
    for (const mdPath of ["/index.md", "/education.md", "/contact.md", experienceMarkdownPath("a/b )(1)")]) {
      assert.deepStrictEqual(parseLangParam(markdownTwinUrl(mdPath, language)), Option.some(language));
    }
    assert.deepStrictEqual(parseLangParam(withLanguageParam("https://www.remiforge.dev/index.md", language)), Option.some(language));
  }
});

it("slugFromMdPathname extracts one decodable segment and never throws on hostile input", () => {
  assert.deepStrictEqual(slugFromMdPathname("https://x.test/benefit-finance.md"), Option.some("benefit-finance"));
  assert.deepStrictEqual(slugFromMdPathname("https://x.test/benefit-finance.md?lang=pl"), Option.some("benefit-finance"));
  assert.deepStrictEqual(slugFromMdPathname("https://x.test/my%20project.md"), Option.some("my project"));
  // A percent-encoded slash is data inside the one segment, not a nested route.
  assert.deepStrictEqual(slugFromMdPathname("https://x.test/parent%2Fbenefit-finance.md"), Option.some("parent/benefit-finance"));
  // Degrades gracefully to None on malformed encodings, root, missing extension, or a nested path.
  for (const address of [
    "https://x.test/%zz.md",
    "https://x.test/%E0%A4%A.md",
    "https://x.test/",
    "https://x.test/.md",
    "https://x.test/benefit-finance",
    "https://x.test/parent/benefit-finance.md",
  ]) {
    assert.deepStrictEqual(slugFromMdPathname(address), Option.none(), `${address} must not resolve`);
  }
});

it("a published twin route parses back to the very slug it was built from", () => {
  for (const slug of ["benefit-finance", "my project", "résumé & more", "role (senior)", "C# .NET", "a/b"]) {
    // Both spellings an advertised address can take: pinned and unpinned.
    assert.deepStrictEqual(slugFromMdPathname(markdownTwinUrl(experienceMarkdownPath(slug), "pl")), Option.some(slug), `${slug} pinned twin route`);
    assert.deepStrictEqual(slugFromMdPathname(absoluteUrl(experienceMarkdownPath(slug))), Option.some(slug), `${slug} unpinned twin route`);
  }
});

it("documentName names a route by its pathname and tolerates an unparseable URL", () => {
  assert.strictEqual(documentName(new Request("https://www.remiforge.dev/benefit-finance.md?lang=pl")), "/benefit-finance.md");
  assert.strictEqual(documentName({ url: "not a URL" } as Request), "not a URL");
});
