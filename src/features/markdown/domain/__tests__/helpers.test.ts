import { assert, describe, it } from "@effect/vitest";
import { Option } from "effect";
import { absoluteUrl, experienceMarkdownPath, markdownTwinUrl, withLanguageParam } from "@/features/meta/domain/urls";
import { SITE_LANGUAGES } from "@/domain/constants";
import { documentHeaders } from "@/features/meta/domain/helpers";
import { parseLangParam, slugFromMdPathname, withoutNegotiationVary } from "../helpers";

// parseLangParam honors ?lang= and rejects unknown values
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

// A pin round-trips through the one parameter every publisher writes and the parser reads
it("a pin round-trips through the one parameter every publisher writes and the parser reads", () => {
  // The site advertises twin URLs with `?lang=` in heads, twins, index entries and Link headers.
  // A parameter any one of them names and the others do not would strand a language-pinned
  // advertisement on a negotiated variant, which is the whole defect the shared constant prevents.
  for (const language of ["en", "pl"] as const) {
    for (const mdPath of ["/index.md", "/education.md", "/contact.md", experienceMarkdownPath("a/b )(1)")]) {
      assert.deepStrictEqual(parseLangParam(markdownTwinUrl(mdPath, language)), Option.some(language));
    }
  }
});

// the twin route answers only paths that name one experience segment
it("the twin route answers only paths that name one experience segment", () => {
  // A slug is one path segment, so the route's own matching is what keeps a request inside the
  // published set: a nested or extensionless address is an ordinary 404, never a resolved page.
  assert.deepStrictEqual(slugFromMdPathname("https://www.remiforge.dev/benefit-finance.md"), Option.some("benefit-finance"));
  assert.deepStrictEqual(slugFromMdPathname("https://www.remiforge.dev/benefit-finance.md?lang=pl"), Option.some("benefit-finance"));
  assert.deepStrictEqual(slugFromMdPathname("https://www.remiforge.dev/my%20project.md"), Option.some("my project"));

  for (const address of [
    "https://www.remiforge.dev/",
    "https://www.remiforge.dev/.md",
    "https://www.remiforge.dev/benefit-finance",
    "https://www.remiforge.dev/parent/benefit-finance.md",
    "https://www.remiforge.dev/%zz.md",
  ]) {
    assert.deepStrictEqual(slugFromMdPathname(address), Option.none(), `${address} must not resolve`);
  }
});

// a slug survives the twin route as the very segment it was published from
it("a slug survives the twin route as the very segment it was published from", () => {
  // The site publishes a twin URL derived from a slug and resolves the twin by reading that URL
  // back, so the encoder and the parser are one contract across a feature boundary. A slug that
  // survives one direction only is a twin route answering 404 for a page every index advertises.
  for (const slug of ["benefit-finance", "my project", "résumé & more", "role (senior)", "C# .NET", "a/b"]) {
    // Both spellings an advertised address can take: pinned and unpinned.
    assert.deepStrictEqual(slugFromMdPathname(markdownTwinUrl(experienceMarkdownPath(slug), "pl")), Option.some(slug), `${slug} pinned twin route`);
    assert.deepStrictEqual(slugFromMdPathname(markdownTwinUrl(experienceMarkdownPath(slug), "en")), Option.some(slug), `${slug} unpinned twin route`);
  }
});

describe("withoutNegotiationVary", () => {
  it("drops both negotiation tokens, leaving no Vary value", () => {
    assert.isNull(withoutNegotiationVary("Cookie, Accept-Language"));
    assert.isNull(withoutNegotiationVary("accept-language,Cookie"));
  });

  it("preserves unrelated tokens the runtime added", () => {
    // Retains transport-level Vary tokens such as Accept-Encoding.
    assert.strictEqual(withoutNegotiationVary("Cookie, Accept-Language, Accept-Encoding"), "Accept-Encoding");
    assert.strictEqual(withoutNegotiationVary("Accept-Encoding"), "Accept-Encoding");
  });

  it("passes through an absent header and trims empty or padded tokens", () => {
    assert.isNull(withoutNegotiationVary(null));
    assert.strictEqual(withoutNegotiationVary(" Accept-Encoding ,  Origin "), "Accept-Encoding, Origin");
    assert.strictEqual(withoutNegotiationVary("Cookie,,Accept-Encoding"), "Accept-Encoding");
  });

  it("strips exactly the negotiation tokens documentHeaders advertises, for both languages", () => {
    // Verifies round-trip removal of documentHeaders negotiation tokens.
    for (const language of ["en", "pl"] as const) {
      const vary = documentHeaders(language);
      assert.isNull(withoutNegotiationVary(vary.Vary));
    }
  });
});
