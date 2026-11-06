// services, features, and other libraries
import { assert, it } from "@effect/vitest";
import { Option } from "effect";
import { absoluteUrl, cvPdfHref, encodeParens, experienceMarkdownPath, experiencePath, httpUrlOption, markdownTwinUrl, validatedHref, withLanguageParam } from "../urls";
import { authorLink, canonicalLink, LLMS_DISCOVERY_LINK, markdownAlternateLink, SITEMAP_LINK } from "../link-tags";

// constants
import { CV_EN_HREF, CV_PL_HREF } from "../constants";

// These tests pin the URL math the HTML heads, Markdown twins, discovery documents and HTTP
// responses share. The Link-header serialization itself is covered in link-header.test.ts.

it("absoluteUrl resolves a site path against the canonical origin", () => {
  assert.strictEqual(absoluteUrl("/"), "https://www.remiforge.dev/");
  assert.strictEqual(absoluteUrl("/education"), "https://www.remiforge.dev/education");
  assert.strictEqual(absoluteUrl("/images/01-a.webp"), "https://www.remiforge.dev/images/01-a.webp");
});

it("httpUrlOption publishes only parseable http(s) destinations", () => {
  // Both web schemes pass through the URL parser, which normalizes what it can
  assert.deepStrictEqual(httpUrlOption("https://github.com/example/repo"), Option.some("https://github.com/example/repo"));
  assert.deepStrictEqual(httpUrlOption("http://example.com"), Option.some("http://example.com/"));
  // Content fields accept any non-empty string, so every other shape is dropped before a head,
  // graph or twin can publish it as a destination
  assert.deepStrictEqual(httpUrlOption("javascript:alert(1)"), Option.none());
  assert.deepStrictEqual(httpUrlOption("ftp://example.com/file"), Option.none());
  assert.deepStrictEqual(httpUrlOption("/relative"), Option.none());
  assert.deepStrictEqual(httpUrlOption("not a url"), Option.none());
});

it("validatedHref folds an absent authored field into the same None as a refused scheme", () => {
  // Every publisher of an experience link reads the field through this guard, so the optional
  // `gitHubLink` / `liveLink` / `videoLink` cases and the hostile-scheme case are one answer.
  assert.deepStrictEqual(validatedHref(undefined), Option.none());
  assert.deepStrictEqual(validatedHref(""), Option.none());
  assert.deepStrictEqual(validatedHref("https://github.com/example/repo"), Option.some("https://github.com/example/repo"));
  assert.deepStrictEqual(validatedHref("javascript:alert(1)"), Option.none());
  assert.deepStrictEqual(validatedHref("/relative"), Option.none());
});

it("withLanguageParam pins the lang parameter without disturbing the rest of the URL", () => {
  assert.strictEqual(withLanguageParam("https://www.remiforge.dev/index.md", "pl"), "https://www.remiforge.dev/index.md?lang=pl");
  // An existing pin is updated in place rather than appended as a duplicate
  assert.strictEqual(withLanguageParam("https://www.remiforge.dev/index.md?lang=en", "pl"), "https://www.remiforge.dev/index.md?lang=pl");
  // Unrelated parameters and the fragment survive the rewrite
  assert.strictEqual(
    withLanguageParam("https://www.remiforge.dev/index.md?view=full&lang=en#top", "pl"),
    "https://www.remiforge.dev/index.md?view=full&lang=pl#top"
  );
  // An input that is not a URL is returned untouched, so callers never publish a half-built href
  assert.strictEqual(withLanguageParam("not a url", "pl"), "not a url");
});

it("markdownTwinUrl resolves a site-relative twin route to an absolute, language-pinned URL", () => {
  assert.strictEqual(markdownTwinUrl("/index.md", "en"), "https://www.remiforge.dev/index.md?lang=en");
  assert.strictEqual(markdownTwinUrl("/education.md", "pl"), "https://www.remiforge.dev/education.md?lang=pl");
});

it("cvPdfHref selects the authored CV file for the visitor's language", () => {
  assert.strictEqual(cvPdfHref("en"), CV_EN_HREF);
  assert.strictEqual(cvPdfHref("pl"), CV_PL_HREF);
  // The two languages must not share one file, or a Polish reader downloads English copy
  assert.notStrictEqual(CV_EN_HREF, CV_PL_HREF);
});

it("experience paths encode one URL segment, including parentheses that would close a Markdown destination", () => {
  // encodeURIComponent leaves parentheses raw; the shared helper closes that gap everywhere a path
  // can be embedded in Markdown or XML.
  assert.strictEqual(encodeParens("a(b)c"), "a%28b%29c");
  assert.strictEqual(experiencePath("role (senior) & more"), "/role%20%28senior%29%20%26%20more");
  // Non-ASCII slugs are percent-encoded rather than emitted raw
  assert.strictEqual(experiencePath("résumé"), "/r%C3%A9sum%C3%A9");
  // The twin route is the detail path with one suffix, so both always name the same document
  assert.strictEqual(experienceMarkdownPath("role (senior)"), "/role%20%28senior%29.md");
});

it("link builders name the canonical, author, and language-pinned Markdown twin", () => {
  assert.deepStrictEqual(canonicalLink("https://www.remiforge.dev/education"), {
    rel: "canonical",
    href: "https://www.remiforge.dev/education",
  });
  assert.deepStrictEqual(authorLink("https://www.remiforge.dev/"), { rel: "author", href: "https://www.remiforge.dev/" });
  // The HTML alternate is pinned to the negotiated language but deliberately carries no hreflang:
  // the HTML pages are one URL, so claiming distinct language documents would be false.
  assert.deepStrictEqual(markdownAlternateLink("/index.md", "pl"), {
    rel: "alternate",
    type: "text/markdown",
    href: "https://www.remiforge.dev/index.md?lang=pl",
  });
});

it("discovery links declare the sitemap and the canonical llms index", () => {
  assert.deepStrictEqual(SITEMAP_LINK, { rel: "sitemap", href: "https://www.remiforge.dev/sitemap.xml" });
  assert.deepStrictEqual(LLMS_DISCOVERY_LINK, { rel: "llms", href: "https://www.remiforge.dev/llms.txt" });
});
