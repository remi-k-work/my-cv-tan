import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { INDEXABLE_ROBOTS, NOINDEX_FOLLOW } from "@/domain/http";
import { CONTENT_SIGNAL } from "@/features/meta/domain/discovery";
import { absoluteUrl } from "@/features/meta/domain/urls";
import { documentHeaders, txtResponse, txtUnavailableResponse } from "@/features/meta/domain/responses";
import { requireData, recoverDataFailure } from "@/features/data/domain/required";
import { experienceFromList } from "@/features/experience/domain/helpers";
import { mdNotFoundResponse, mdResponse, mdUnavailableResponse, pinCacheVariant, withoutCaching, withoutNegotiationVary } from "../responses";
import { sampleExperience } from "@/features/markdown/__tests__/fixtures";

describe("withoutNegotiationVary", () => {
  it("drops both negotiation tokens, leaving no Vary value", () => {
    assert.deepStrictEqual(withoutNegotiationVary("Cookie, Accept-Language"), Option.none());
    assert.deepStrictEqual(withoutNegotiationVary("accept-language,Cookie"), Option.none());
  });

  it("preserves unrelated tokens the runtime added", () => {
    // Retains transport-level Vary tokens such as Accept-Encoding.
    assert.deepStrictEqual(withoutNegotiationVary("Cookie, Accept-Language, Accept-Encoding"), Option.some("Accept-Encoding"));
    assert.deepStrictEqual(withoutNegotiationVary("Accept-Encoding"), Option.some("Accept-Encoding"));
  });

  it("passes through an absent header and trims empty or padded tokens", () => {
    assert.deepStrictEqual(withoutNegotiationVary(null), Option.none());
    assert.deepStrictEqual(withoutNegotiationVary(" Accept-Encoding ,  Origin "), Option.some("Accept-Encoding, Origin"));
    assert.deepStrictEqual(withoutNegotiationVary("Cookie,,Accept-Encoding"), Option.some("Accept-Encoding"));
  });

  it("strips exactly the negotiation tokens documentHeaders advertises, for both languages", () => {
    for (const language of ["en", "pl"] as const) {
      const vary = documentHeaders(language);
      assert.deepStrictEqual(withoutNegotiationVary(vary.Vary), Option.none());
    }
  });
});

it("pins a response to its URL language while retaining other cache metadata", async () => {
  const response = new Response("# Portfolio", {
    status: 200,
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": "text/markdown; charset=utf-8",
      Vary: "Cookie, Accept-Language, Accept-Encoding",
    },
  });

  const pinned = pinCacheVariant(response);

  assert.strictEqual(pinned.status, 200);
  assert.strictEqual(pinned.headers.get("Cache-Control"), "public, max-age=3600");
  assert.strictEqual(pinned.headers.get("Content-Type"), "text/markdown; charset=utf-8");
  assert.strictEqual(pinned.headers.get("Vary"), "Accept-Encoding");
  assert.strictEqual(await pinned.text(), "# Portfolio");
});

it("a response that carries no Vary header stays Vary-free", async () => {
  // Strips Vary cleanly without introducing an empty header.
  const bare = pinCacheVariant(new Response("# Gone", { status: 404, headers: { "Content-Type": "text/markdown; charset=utf-8" } }));

  assert.strictEqual(bare.status, 404);
  assert.isNull(bare.headers.get("Vary"));
  assert.strictEqual(await bare.text(), "# Gone");
});

it("a translation fallback refuses shared caching without weakening its negotiation", async () => {
  // A fallback is English at a URL that asked for another language. It must not be pinned as a
  // public variant of that URL, so the response is marked no-store and the negotiated Vary stays.
  const response = mdResponse({
    body: "# English fallback",
    preferredLanguage: "en",
    canonical: "https://www.remiforge.dev/",
    markdownPath: "/index.md",
  });

  const uncached = withoutCaching(response);

  assert.strictEqual(uncached.status, 200);
  assert.strictEqual(uncached.headers.get("Cache-Control"), "no-store");
  assert.strictEqual(uncached.headers.get("Vary"), "Cookie, Accept-Language");
  assert.strictEqual(await uncached.text(), "# English fallback");
});

it("response helpers set content types, indexing, cache, canonical, and language-variant headers", () => {
  const ok = mdResponse({
    body: "# Hi",
    preferredLanguage: "en",
    canonical: "https://www.remiforge.dev/",
    markdownPath: "/index.md",
  });
  assert.strictEqual(ok.status, 200);
  assert.strictEqual(ok.headers.get("Content-Type"), "text/markdown; charset=utf-8");
  assert.strictEqual(ok.headers.get("Content-Language"), "en");
  assert.strictEqual(ok.headers.get("Vary"), "Cookie, Accept-Language");
  assert.strictEqual(ok.headers.get("X-Robots-Tag"), INDEXABLE_ROBOTS);
  assert.strictEqual(ok.headers.get("Content-Location"), "https://www.remiforge.dev/index.md?lang=en");
  // RFC 8288 parameter order: rel, type, title, hreflang.
  assert.strictEqual(
    ok.headers.get("Link"),
    '<https://www.remiforge.dev/>; rel="canonical", <https://www.remiforge.dev/llms.txt>; rel="alternate"; type="text/plain"; title="llms.txt", <https://www.remiforge.dev/llms-full.txt>; rel="alternate"; type="text/plain"; title="llms-full.txt", <https://www.remiforge.dev/index.md?lang=en>; rel="alternate"; type="text/markdown"; hreflang="en", <https://www.remiforge.dev/index.md?lang=pl>; rel="alternate"; type="text/markdown"; hreflang="pl", <https://www.remiforge.dev/index.md?lang=en>; rel="alternate"; type="text/markdown"; hreflang="x-default"'
  );
  assert.strictEqual(ok.headers.get("Content-Signal"), "search=yes, ai-input=yes, ai-train=yes");

  // 404 twin advertises AI indexes so crawlers can navigate back to the graph.
  const missing = mdNotFoundResponse("# Gone", "pl", Option.some("/gone.md"));
  assert.strictEqual(missing.status, 404);
  assert.strictEqual(missing.headers.get("Content-Type"), "text/markdown; charset=utf-8");
  assert.strictEqual(missing.headers.get("Content-Location"), "https://www.remiforge.dev/gone.md?lang=pl");
  assert.strictEqual(missing.headers.get("X-Robots-Tag"), "noindex, follow");
  assert.isNull(missing.headers.get("Retry-After"));
  assert.strictEqual(
    missing.headers.get("Link"),
    '<https://www.remiforge.dev/llms.txt>; rel="alternate"; type="text/plain"; title="llms.txt", <https://www.remiforge.dev/llms-full.txt>; rel="alternate"; type="text/plain"; title="llms-full.txt"'
  );

  // Missing representation omits Content-Location.
  const unparseable = mdNotFoundResponse("# Gone", "en", Option.none());
  assert.strictEqual(unparseable.status, 404);
  assert.isNull(unparseable.headers.get("Content-Location"));
  assert.include(unparseable.headers.get("Link") ?? "", "llms-full.txt");

  const unavailable = mdUnavailableResponse("# Temporarily unavailable", "pl");
  assert.strictEqual(unavailable.status, 503);
  assert.strictEqual(unavailable.headers.get("Content-Type"), "text/markdown; charset=utf-8");
  assert.strictEqual(unavailable.headers.get("Content-Language"), "pl");
  assert.strictEqual(unavailable.headers.get("Cache-Control"), "no-store");
  assert.strictEqual(unavailable.headers.get("X-Robots-Tag"), "noindex, follow");
  // Transient failure retry timing.
  assert.strictEqual(unavailable.headers.get("Retry-After"), "300");
  assert.strictEqual(
    unavailable.headers.get("Link"),
    '<https://www.remiforge.dev/llms.txt>; rel="alternate"; type="text/plain"; title="llms.txt", <https://www.remiforge.dev/llms-full.txt>; rel="alternate"; type="text/plain"; title="llms-full.txt"'
  );

  const txt = txtResponse("# Plain");
  assert.strictEqual(txt.status, 200);
  assert.strictEqual(txt.headers.get("Content-Type"), "text/plain; charset=utf-8");
  assert.strictEqual(txt.headers.get("Content-Language"), "en");
  assert.isNull(txt.headers.get("Content-Location"));
  assert.strictEqual(txt.headers.get("Content-Signal"), CONTENT_SIGNAL);

  const unavailableTxt = txtUnavailableResponse("Unavailable");
  assert.strictEqual(unavailableTxt.status, 503);
  assert.strictEqual(unavailableTxt.headers.get("Content-Type"), "text/plain; charset=utf-8");
  assert.strictEqual(unavailableTxt.headers.get("Cache-Control"), "no-store");
  assert.strictEqual(unavailableTxt.headers.get("X-Robots-Tag"), "noindex, follow");
  assert.strictEqual(unavailableTxt.headers.get("Retry-After"), "300");
  assert.strictEqual(unavailableTxt.headers.get("Content-Signal"), CONTENT_SIGNAL);
  assert.include(unavailableTxt.headers.get("Link") ?? "", "https://www.remiforge.dev/llms.txt");

  const discovery = txtResponse("# Index", absoluteUrl("/llms.txt"));
  assert.strictEqual(discovery.status, 200);
  assert.strictEqual(discovery.headers.get("Content-Type"), "text/plain; charset=utf-8");
  assert.strictEqual(discovery.headers.get("Cache-Control"), "public, max-age=3600, stale-while-revalidate=86400");
  assert.strictEqual(discovery.headers.get("X-Robots-Tag"), NOINDEX_FOLLOW);
  assert.strictEqual(discovery.headers.get("Content-Location"), "https://www.remiforge.dev/llms.txt");
  assert.strictEqual(
    discovery.headers.get("Link"),
    '<https://www.remiforge.dev/llms.txt>; rel="alternate"; type="text/plain"; title="llms.txt", <https://www.remiforge.dev/llms-full.txt>; rel="alternate"; type="text/plain"; title="llms-full.txt"'
  );
});

it.effect("a failed experience-list decode is an error, while a valid missing slug is a 404 candidate", () =>
  Effect.gen(function* () {
    const decodeError = yield* Effect.flip(requireData(Option.none(), "experience list"));
    assert.strictEqual(decodeError._tag, "RequiredDataError");

    assert.deepStrictEqual(experienceFromList([], "missing"), Option.none());
    assert.deepStrictEqual(experienceFromList([sampleExperience], "missing"), Option.none());
    assert.deepStrictEqual(experienceFromList([sampleExperience], sampleExperience.slug), Option.some(sampleExperience));
  })
);

it.effect("required-content failures map to non-cacheable 503s and valid missing slugs map to 404s", () =>
  Effect.gen(function* () {
    const unavailableMarkdown = yield* requireData(Option.none(), "experience list").pipe(
      Effect.catchTag("RequiredDataError", () => Effect.succeed(mdUnavailableResponse("# Temporarily unavailable", "pl")))
    );
    assert.strictEqual(unavailableMarkdown.status, 503);
    assert.strictEqual(unavailableMarkdown.headers.get("Cache-Control"), "no-store");
    assert.strictEqual(unavailableMarkdown.headers.get("X-Robots-Tag"), "noindex, follow");

    const unavailableIndex = yield* recoverDataFailure(
      () => "[LLMS.TXT]",
      () => txtUnavailableResponse("Unavailable")
    )(requireData(Option.none(), "experience list"));
    assert.strictEqual(unavailableIndex.status, 503);
    assert.strictEqual(unavailableIndex.headers.get("Content-Type"), "text/plain; charset=utf-8");

    const noMatch = experienceFromList([], "missing");
    const notFound = Option.isNone(noMatch)
      ? mdNotFoundResponse("# Not Found", "en", Option.some("/missing.md"))
      : mdResponse({ body: "# Found", preferredLanguage: "en", canonical: "https://www.remiforge.dev/", markdownPath: "/index.md" });
    assert.strictEqual(notFound.status, 404);
    assert.strictEqual(notFound.headers.get("X-Robots-Tag"), "noindex, follow");
  })
);
