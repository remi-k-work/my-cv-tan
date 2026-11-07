// Direct unit tests for the Markdown request parsing in ./requests. The ?lang= pin and the twin
// slug are read straight off the request URL, so a value the parser cannot resolve has to come
// back as None — a clean 404 — rather than an exception out of the handler.

// services, features, and other libraries
import { assert, it } from "@effect/vitest";
import { Option } from "effect";
import { parseLangParam, slugFromMdPathname } from "../requests";

// meta (shared)
import { absoluteUrl, experienceMarkdownPath, markdownTwinUrl, withLanguageParam } from "@/features/meta/domain/urls";

// constants
import { SITE_LANGUAGES } from "@/domain/constants";

it("parseLangParam honors ?lang= and rejects unknown values", () => {
  for (const language of SITE_LANGUAGES) {
    assert.deepStrictEqual(parseLangParam(`https://x.test/index.md?lang=${language}`), Option.some(language));
  }
  // The pin is normalized, so an uppercase header-style value still selects a supported language
  assert.deepStrictEqual(parseLangParam("https://x.test/index.md?lang=EN"), Option.some("en"));
  assert.deepStrictEqual(parseLangParam("https://x.test/index.md"), Option.none());
  assert.deepStrictEqual(parseLangParam("https://x.test/index.md?lang=xx"), Option.none());
});

it("a published twin pin round-trips through the one parameter its parser reads", () => {
  // withLanguageParam writes the `?lang=` pin every advertised twin URL carries; parseLangParam reads
  // the override back. They name the parameter through one shared constant, so a rename on either side
  // would break here rather than silently leaving a published, language-pinned pin unread.
  for (const language of SITE_LANGUAGES) {
    assert.deepStrictEqual(parseLangParam(withLanguageParam("https://www.remiforge.dev/index.md", language)), Option.some(language));
  }
});

it("slugFromMdPathname extracts slugs and never throws on hostile input", () => {
  assert.deepStrictEqual(slugFromMdPathname("https://x.test/benefit-finance.md"), Option.some("benefit-finance"));
  assert.deepStrictEqual(slugFromMdPathname("https://x.test/benefit-finance.md?lang=pl"), Option.some("benefit-finance"));
  assert.deepStrictEqual(slugFromMdPathname("https://x.test/my%20project.md"), Option.some("my project"));
  // Malformed percent-encoding, missing slug, and extensionless paths all become None (clean 404)
  assert.deepStrictEqual(slugFromMdPathname("https://x.test/%zz.md"), Option.none());
  assert.deepStrictEqual(slugFromMdPathname("https://x.test/%E0%A4%A.md"), Option.none());
  assert.deepStrictEqual(slugFromMdPathname("https://x.test/"), Option.none());
  assert.deepStrictEqual(slugFromMdPathname("https://x.test/.md"), Option.none());
  // The dynamic twin route represents one encoded slug segment. A nested path must not resolve
  // its final segment as an unrelated top-level experience.
  assert.deepStrictEqual(slugFromMdPathname("https://x.test/parent/benefit-finance.md"), Option.none());
  assert.deepStrictEqual(slugFromMdPathname("https://x.test/parent%2Fbenefit-finance.md"), Option.some("parent/benefit-finance"));
});

it("a published twin route parses back to the very slug it was built from", () => {
  // The site publishes twin URLs derived from a slug and resolves the twin by reading that URL back,
  // so the encoder and the parser are one contract across a feature boundary. A slug that survives
  // one direction only is a twin route answering 404 for a page every index advertises.
  const slugs = ["benefit-finance", "my project", "résumé & more", "role (senior)", "C# .NET", "a/b"];

  for (const slug of slugs) {
    assert.deepStrictEqual(slugFromMdPathname(markdownTwinUrl(experienceMarkdownPath(slug), "pl")), Option.some(slug), `${slug} twin route`);
    assert.deepStrictEqual(slugFromMdPathname(absoluteUrl(experienceMarkdownPath(slug))), Option.some(slug), `${slug} unpinned twin route`);
  }
});
