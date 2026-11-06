// Direct unit tests for the Markdown request parsing in ./requests. The ?lang= pin and the twin
// slug are read straight off the request URL, so a value the parser cannot resolve has to come
// back as None — a clean 404 — rather than an exception out of the handler.

// services, features, and other libraries
import { assert, it } from "@effect/vitest";
import { Option } from "effect";
import { parseLangParam, slugFromMdPathname } from "../requests";

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
