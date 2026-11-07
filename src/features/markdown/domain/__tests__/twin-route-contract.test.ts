// The twin request contract: the ?lang= pin and the slug the twin route resolves. These are the
// GEO surface's own guarantees — the twin route answers only what the site publishes, and a
// published slug survives the route as the very segment it was advertised from — so they are
// pinned here, where a fabricated destination would otherwise look like an ordinary request.

// services, features, and other libraries
import { assert, it } from "@effect/vitest";
import { Option } from "effect";

// domain
import { parseLangParam, slugFromMdPathname } from "../requests";

// meta (shared)
import { experienceMarkdownPath, markdownTwinUrl } from "@/features/meta/domain/urls";

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

it("a slug survives the twin route as the very segment it was published from", () => {
  // The site publishes a twin URL derived from a slug and resolves the twin by reading that URL
  // back, so the encoder and the parser are one contract across a feature boundary. A slug that
  // survives one direction only is a twin route answering 404 for a page every index advertises.
  for (const slug of ["benefit-finance", "my project", "résumé & more", "role (senior)", "C# .NET", "report.md", "a/b"]) {
    // Both spellings an advertised address can take: pinned and unpinned.
    assert.deepStrictEqual(slugFromMdPathname(markdownTwinUrl(experienceMarkdownPath(slug), "pl")), Option.some(slug), `${slug} pinned twin route`);
    assert.deepStrictEqual(slugFromMdPathname(markdownTwinUrl(experienceMarkdownPath(slug), "en")), Option.some(slug), `${slug} unpinned twin route`);
  }
});
