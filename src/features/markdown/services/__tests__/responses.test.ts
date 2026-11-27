import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { INDEXABLE_ROBOTS, NOINDEX_FOLLOW } from "@/domain/http";
import { CONTENT_SIGNAL } from "@/features/meta/domain/discovery";
import { absoluteUrl } from "@/domain/urls";
import { documentHeaders, txtResponse, txtUnavailableResponse } from "@/features/meta/services/responses";
import { requireData, recoverDataFailure } from "@/features/data/domain/required";
import { experienceFromList } from "@/features/experience/domain/helpers";
import {
  applyRepresentationPolicy,
  mdNotFoundResponse,
  mdResponse,
  mdUnavailableResponse,
  pinCacheVariant,
  temporaryFallbackResponse,
  withoutNegotiationVary,
} from "../responses";
import { sampleExperience } from "@/features/markdown/__tests__/fixtures";

describe("withoutNegotiationVary", () => {
  it("drops both negotiation tokens, leaving no Vary value", () => {
    assert.deepStrictEqual(withoutNegotiationVary("Cookie, Accept-Language"), Option.none());
    assert.deepStrictEqual(withoutNegotiationVary("accept-language,Cookie"), Option.none());
  });

  it("preserves unrelated tokens the runtime added", () => {
    // Retains transport-level Vary tokens such as Accept-Encoding.
    assert.deepStrictEqual(withoutNegotiationVary("Cookie, Accept-Language, Accept-Encoding"), Option.some("Accept-Encoding"));
    assert.deepStrictEqual(withoutNegotiationVary("Cookie, Accept-Encoding, Accept-Language, Origin"), Option.some("Accept-Encoding, Origin"));
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

it("a pinned response deletes Vary when language negotiation was its only cause", () => {
  const response = new Response("# Portfolio", { headers: { Vary: "Cookie, Accept-Language" } });
  const pinned = pinCacheVariant(response);

  assert.isNull(pinned.headers.get("Vary"));
});

it("a response that carries no Vary header stays Vary-free", async () => {
  // Strips Vary cleanly without introducing an empty header.
  const bare = pinCacheVariant(new Response("# Gone", { status: 404, headers: { "Content-Type": "text/markdown; charset=utf-8" } }));

  assert.strictEqual(bare.status, 404);
  assert.isNull(bare.headers.get("Vary"));
  assert.strictEqual(await bare.text(), "# Gone");
});

it("a translation fallback refuses caching and indexing without weakening its negotiation", async () => {
  // Source-language content at another language's URL is temporary, not an indexable variant.
  const response = mdResponse({
    body: "# English fallback",
    preferredLanguage: "en",
    canonical: "https://www.remiforge.dev/",
    markdownPath: "/index.md",
  });

  const fallback = temporaryFallbackResponse(response);

  assert.strictEqual(fallback.status, 200);
  assert.strictEqual(fallback.headers.get("Cache-Control"), "no-store");
  assert.strictEqual(fallback.headers.get("X-Robots-Tag"), NOINDEX_FOLLOW);
  assert.strictEqual(fallback.headers.get("Vary"), "Cookie, Accept-Language");
  assert.strictEqual(await fallback.text(), "# English fallback");
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
    '<https://www.remiforge.dev/>; rel="canonical", <https://www.remiforge.dev/llms.txt>; rel="describedby", <https://www.remiforge.dev/llms-full.txt>; rel="related"; type="text/plain"; title="llms-full.txt", <https://www.remiforge.dev/index.md?lang=en>; rel="alternate"; type="text/markdown"; hreflang="en", <https://www.remiforge.dev/index.md?lang=pl>; rel="alternate"; type="text/markdown"; hreflang="pl", <https://www.remiforge.dev/index.md>; rel="alternate"; type="text/markdown"; hreflang="x-default"'
  );
  assert.strictEqual(ok.headers.get("Content-Signal"), "search=yes, ai-input=yes, ai-train=yes");
  assert.strictEqual(ok.headers.get("X-Content-Type-Options"), "nosniff");

  // 404 twin advertises AI indexes so crawlers can navigate back to the graph.
  const missing = mdNotFoundResponse("# Gone", "pl", Option.some("/gone.md"));
  assert.strictEqual(missing.status, 404);
  assert.strictEqual(missing.headers.get("Content-Type"), "text/markdown; charset=utf-8");
  assert.strictEqual(missing.headers.get("Content-Location"), "https://www.remiforge.dev/gone.md?lang=pl");
  assert.strictEqual(missing.headers.get("X-Robots-Tag"), "noindex, follow");
  assert.strictEqual(missing.headers.get("X-Content-Type-Options"), "nosniff");
  assert.isNull(missing.headers.get("Retry-After"));
  assert.strictEqual(
    missing.headers.get("Link"),
    '<https://www.remiforge.dev/llms.txt>; rel="describedby", <https://www.remiforge.dev/llms-full.txt>; rel="related"; type="text/plain"; title="llms-full.txt"'
  );

  // Missing representation omits Content-Location.
  const unparseable = mdNotFoundResponse("# Gone", "en", Option.none());
  assert.strictEqual(unparseable.status, 404);
  assert.isNull(unparseable.headers.get("Content-Location"));
  assert.include(unparseable.headers.get("Link") ?? "", "llms-full.txt");

  const unavailable = mdUnavailableResponse("# Temporarily unavailable", "pl", Option.some("/sample-role.md"));
  assert.strictEqual(unavailable.status, 503);
  assert.strictEqual(unavailable.headers.get("Content-Type"), "text/markdown; charset=utf-8");
  assert.strictEqual(unavailable.headers.get("Content-Language"), "pl");
  assert.strictEqual(unavailable.headers.get("Content-Location"), "https://www.remiforge.dev/sample-role.md?lang=pl");
  assert.strictEqual(unavailable.headers.get("Cache-Control"), "no-store");
  assert.strictEqual(unavailable.headers.get("X-Robots-Tag"), "noindex, follow");
  assert.strictEqual(unavailable.headers.get("X-Content-Type-Options"), "nosniff");
  // Transient failure retry timing.
  assert.strictEqual(unavailable.headers.get("Retry-After"), "300");
  assert.strictEqual(
    unavailable.headers.get("Link"),
    '<https://www.remiforge.dev/llms.txt>; rel="describedby", <https://www.remiforge.dev/llms-full.txt>; rel="related"; type="text/plain"; title="llms-full.txt"'
  );

  const txt = txtResponse("# Plain");
  assert.strictEqual(txt.status, 200);
  assert.strictEqual(txt.headers.get("Content-Type"), "text/plain; charset=utf-8");
  assert.strictEqual(txt.headers.get("Content-Language"), "en");
  assert.isNull(txt.headers.get("Content-Location"));
  assert.strictEqual(txt.headers.get("Content-Signal"), CONTENT_SIGNAL);
  assert.strictEqual(txt.headers.get("X-Content-Type-Options"), "nosniff");

  const unavailableTxt = txtUnavailableResponse("Unavailable", absoluteUrl("/llms.txt"));
  assert.strictEqual(unavailableTxt.status, 503);
  assert.strictEqual(unavailableTxt.headers.get("Content-Type"), "text/plain; charset=utf-8");
  assert.strictEqual(unavailableTxt.headers.get("Content-Location"), absoluteUrl("/llms.txt"));
  assert.strictEqual(unavailableTxt.headers.get("Cache-Control"), "no-store");
  assert.strictEqual(unavailableTxt.headers.get("X-Robots-Tag"), "noindex, follow");
  assert.strictEqual(unavailableTxt.headers.get("Retry-After"), "300");
  assert.strictEqual(unavailableTxt.headers.get("Content-Signal"), CONTENT_SIGNAL);
  assert.strictEqual(unavailableTxt.headers.get("X-Content-Type-Options"), "nosniff");
  assert.include(unavailableTxt.headers.get("Link") ?? "", "https://www.remiforge.dev/llms-full.txt");
  assert.notInclude(unavailableTxt.headers.get("Link") ?? "", "<https://www.remiforge.dev/llms.txt>;");

  const discovery = txtResponse("# Index", absoluteUrl("/llms.txt"));
  assert.strictEqual(discovery.status, 200);
  assert.strictEqual(discovery.headers.get("Content-Type"), "text/plain; charset=utf-8");
  assert.strictEqual(discovery.headers.get("Cache-Control"), "public, max-age=3600, stale-while-revalidate=86400");
  assert.strictEqual(discovery.headers.get("X-Robots-Tag"), NOINDEX_FOLLOW);
  assert.strictEqual(discovery.headers.get("X-Content-Type-Options"), "nosniff");
  assert.strictEqual(discovery.headers.get("Content-Location"), "https://www.remiforge.dev/llms.txt");
  assert.strictEqual(discovery.headers.get("Link"), '<https://www.remiforge.dev/llms-full.txt>; rel="related"; type="text/plain"; title="llms-full.txt"');
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
      Effect.catchTag("RequiredDataError", () => Effect.succeed(mdUnavailableResponse("# Temporarily unavailable", "pl", Option.some("/sample-role.md"))))
    );
    assert.strictEqual(unavailableMarkdown.status, 503);
    assert.strictEqual(unavailableMarkdown.headers.get("Cache-Control"), "no-store");
    assert.strictEqual(unavailableMarkdown.headers.get("X-Robots-Tag"), "noindex, follow");

    const unavailableIndex = yield* recoverDataFailure(
      () => "[LLMS.TXT]",
      () => txtUnavailableResponse("Unavailable", absoluteUrl("/llms.txt"))
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

it("applyRepresentationPolicy bypasses caching on fallback and strips negotiation Vary when pinned", () => {
  const base = () =>
    new Response("# Portfolio", {
      headers: {
        "Cache-Control": "public, max-age=3600",
        Vary: "Cookie, Accept-Language",
      },
    });

  for (const pin of [Option.some<"pl">("pl"), Option.none<"pl">()] as const) {
    const fallback = applyRepresentationPolicy(base(), true, pin);
    assert.strictEqual(fallback.headers.get("Cache-Control"), "no-store");
    assert.strictEqual(fallback.headers.get("Vary"), "Cookie, Accept-Language");
  }

  const pinned = applyRepresentationPolicy(base(), false, Option.some("pl"));
  assert.strictEqual(pinned.headers.get("Cache-Control"), "public, max-age=3600");
  assert.isNull(pinned.headers.get("Vary"));

  const negotiated = applyRepresentationPolicy(base(), false, Option.none());
  assert.strictEqual(negotiated.headers.get("Cache-Control"), "public, max-age=3600");
  assert.strictEqual(negotiated.headers.get("Vary"), "Cookie, Accept-Language");
});

it("applyRepresentationPolicy leaves non-cacheable errors outside pinned-variant handling", () => {
  for (const response of [mdNotFoundResponse("# Gone", "pl", Option.none()), mdUnavailableResponse("# Unavailable", "pl", Option.none())]) {
    const result = applyRepresentationPolicy(response, false, Option.some("pl"));

    assert.strictEqual(result.headers.get("Cache-Control"), "no-store");
    assert.strictEqual(result.headers.get("Vary"), "Cookie, Accept-Language");
    assert.strictEqual(result.headers.get("X-Robots-Tag"), NOINDEX_FOLLOW);
  }
});
