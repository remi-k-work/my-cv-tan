// The HTTP envelopes every machine-readable document is served through: the twin and index
// responses, their cache variants, and the failure shapes the document pipelines recover into.
// The document bodies themselves are unit-tested in ./domain/__tests__.

// services, features, and other libraries
import { assert, it } from "@effect/vitest";
import { Effect, Option } from "effect";

// meta (shared)
import { INDEXABLE_ROBOTS, NOINDEX_FOLLOW } from "@/domain/http";
import { CONTENT_SIGNAL } from "@/features/meta/domain/constants";
import { absoluteUrl } from "@/features/meta/domain/urls";
import { txtResponse, txtUnavailableResponse } from "@/features/meta/services/responses";
import { requireData, recoverDataFailure } from "@/features/data/domain/required";
import { experienceFromList } from "@/features/experience/domain/helpers";

// services under test
import { mdNotFoundResponse, mdResponse, mdUnavailableResponse, pinCacheVariant } from "../services/responses";

// types
import type { Experience } from "@/features/experience/domain/models";

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
  // Failure envelopes (404/503) are built without a Vary before pinning; the absent header must
  // stay absent rather than being resurrected as an empty value
  const bare = pinCacheVariant(new Response("# Gone", { status: 404, headers: { "Content-Type": "text/markdown; charset=utf-8" } }));

  assert.strictEqual(bare.status, 404);
  assert.isNull(bare.headers.get("Vary"));
  assert.strictEqual(await bare.text(), "# Gone");
});

it("response helpers set content types, indexing, cache, canonical, and language-variant headers", () => {
  const ok = mdResponse({
    body: "# Hi",
    preferredLanguage: "en",
    canonical: "https://www.remiforge.dev/",
    // The site-relative twin route the declaration names; mdResponse makes it absolute once
    markdownPath: "/index.md",
  });
  assert.strictEqual(ok.status, 200);
  assert.strictEqual(ok.headers.get("Content-Type"), "text/markdown; charset=utf-8");
  assert.strictEqual(ok.headers.get("Content-Language"), "en");
  assert.strictEqual(ok.headers.get("Vary"), "Cookie, Accept-Language");
  // The twins inherit the same indexing directive the HTML heads emit
  assert.strictEqual(ok.headers.get("X-Robots-Tag"), INDEXABLE_ROBOTS);
  // The response identifies its exact representation and exposes both stable language variants.
  assert.strictEqual(ok.headers.get("Content-Location"), "https://www.remiforge.dev/index.md?lang=en");
  // The AI indexes are advertised in the same Link header, so a crawler landing on a single twin
  // reaches the whole document graph without a second request or a body parse
  //
  // Parameters serialize in one fixed order (rel, type, title, hreflang) regardless of the order
  // each builder wrote its literal in, so every surface emitting a link emits the same bytes.
  assert.strictEqual(
    ok.headers.get("Link"),
    '<https://www.remiforge.dev/>; rel="canonical", <https://www.remiforge.dev/llms.txt>; rel="alternate"; type="text/plain"; title="llms.txt", <https://www.remiforge.dev/llms-full.txt>; rel="alternate"; type="text/plain"; title="llms-full.txt", <https://www.remiforge.dev/index.md?lang=en>; rel="alternate"; type="text/markdown"; hreflang="en", <https://www.remiforge.dev/index.md?lang=pl>; rel="alternate"; type="text/markdown"; hreflang="pl", <https://www.remiforge.dev/index.md?lang=en>; rel="alternate"; type="text/markdown"; hreflang="x-default"'
  );
  // The reuse signal mirrors robots.txt, so a crawler reading only the response headers learns
  // the policy without fetching the crawl directives document
  assert.strictEqual(ok.headers.get("Content-Signal"), "search=yes, ai-input=yes, ai-train=yes");

  // A 404 twin keeps advertising the AI indexes, so a crawler that lands on a dead slug can still
  // walk to the live document graph from the HTTP layer. The twin path is the site-relative route,
  // and Content-Location is the absolute representation a crawler can actually fetch
  const missing = mdNotFoundResponse("# Gone", "pl", Option.some("/gone.md"));
  assert.strictEqual(missing.status, 404);
  assert.strictEqual(missing.headers.get("Content-Type"), "text/markdown; charset=utf-8");
  assert.strictEqual(missing.headers.get("Content-Location"), "https://www.remiforge.dev/gone.md?lang=pl");
  assert.strictEqual(missing.headers.get("X-Robots-Tag"), "noindex, follow");
  assert.strictEqual(
    missing.headers.get("Link"),
    '<https://www.remiforge.dev/llms.txt>; rel="alternate"; type="text/plain"; title="llms.txt", <https://www.remiforge.dev/llms-full.txt>; rel="alternate"; type="text/plain"; title="llms-full.txt"'
  );

  // No parseable twin path: the indexes are still advertised, but there is no representation to name
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
  // An outage keeps advertising the retrieval surface, the same way the 404 twin does: a failure is
  // the response where a fetcher most needs to be told the rest of the site is still reachable,
  // and the twins' whole design premise is that the index is reachable from any surface.
  assert.strictEqual(
    unavailable.headers.get("Link"),
    '<https://www.remiforge.dev/llms.txt>; rel="alternate"; type="text/plain"; title="llms.txt", <https://www.remiforge.dev/llms-full.txt>; rel="alternate"; type="text/plain"; title="llms-full.txt"'
  );

  const txt = txtResponse("# Plain");
  assert.strictEqual(txt.status, 200);
  assert.strictEqual(txt.headers.get("Content-Type"), "text/plain; charset=utf-8");
  // Plain-text discovery documents are always English
  assert.strictEqual(txt.headers.get("Content-Language"), "en");
  // robots.txt is one site-wide document rather than a representation of a specific index URL, so
  // only the discovery indexes pass the content location through
  assert.isNull(txt.headers.get("Content-Location"));
  // The reuse signal is mirrored from robots.txt into the header, so a crawler reading only the
  // HTTP layer learns the same policy without fetching the crawl directives document
  assert.strictEqual(txt.headers.get("Content-Signal"), CONTENT_SIGNAL);

  const unavailableTxt = txtUnavailableResponse("Unavailable");
  assert.strictEqual(unavailableTxt.status, 503);
  assert.strictEqual(unavailableTxt.headers.get("Content-Type"), "text/plain; charset=utf-8");
  assert.strictEqual(unavailableTxt.headers.get("Cache-Control"), "no-store");
  assert.strictEqual(unavailableTxt.headers.get("X-Robots-Tag"), "noindex, follow");

  // llms.txt indexes serve AI fetchers, not search results: noindex, but still crawlable
  const discovery = txtResponse("# Index", absoluteUrl("/llms.txt"));
  assert.strictEqual(discovery.status, 200);
  assert.strictEqual(discovery.headers.get("Content-Type"), "text/plain; charset=utf-8");
  assert.strictEqual(discovery.headers.get("Cache-Control"), "public, max-age=3600, stale-while-revalidate=86400");
  assert.strictEqual(discovery.headers.get("X-Robots-Tag"), NOINDEX_FOLLOW);
  // Content-Location is the already-absolute URL the response names, byte-equal to the URL the
  // <head> and Link header advertise
  assert.strictEqual(discovery.headers.get("Content-Location"), "https://www.remiforge.dev/llms.txt");
  // A fetcher landing on one index learns about the other from the HTTP layer, the same way a
  // Markdown twin does — the discovery indexes were the one document family missing this header
  assert.strictEqual(
    discovery.headers.get("Link"),
    '<https://www.remiforge.dev/llms.txt>; rel="alternate"; type="text/plain"; title="llms.txt", <https://www.remiforge.dev/llms-full.txt>; rel="alternate"; type="text/plain"; title="llms-full.txt"'
  );
});

it.effect("a failed experience-list decode is an error, while a valid missing slug is a 404 candidate", () =>
  Effect.gen(function* () {
    // The failed decode stays an error in the fetch + require pipeline
    const decodeError = yield* Effect.flip(requireData(Option.none(), "experience list"));
    assert.strictEqual(decodeError._tag, "RequiredDataError");

    // A decoded list without the slug is a pure lookup returning None
    assert.deepStrictEqual(experienceFromList([], "missing"), Option.none());
    assert.deepStrictEqual(experienceFromList([sampleExperience], "missing"), Option.none());
    assert.deepStrictEqual(experienceFromList([sampleExperience], sampleExperience.slug), Option.some(sampleExperience));
  })
);

it.effect("required-content failures map to non-cacheable 503s and valid missing slugs map to 404s", () =>
  Effect.gen(function* () {
    // The pipeline's own recovery is now part of documentResponse; the 503 shape it produces is
    // still the shared meta/response builder, asserted here so a regression in the recovery
    // combinator is caught directly
    const unavailableMarkdown = yield* requireData(Option.none(), "experience list").pipe(
      Effect.catchTag("RequiredDataError", () => Effect.succeed(mdUnavailableResponse("# Temporarily unavailable", "pl")))
    );
    assert.strictEqual(unavailableMarkdown.status, 503);
    assert.strictEqual(unavailableMarkdown.headers.get("Cache-Control"), "no-store");
    assert.strictEqual(unavailableMarkdown.headers.get("X-Robots-Tag"), "noindex, follow");

    // The discovery documents recover through the same shared recovery, with a plain-text 503
    const unavailableIndex = yield* recoverDataFailure("[LLMS.TXT]", () => txtUnavailableResponse("Unavailable"))(
      requireData(Option.none(), "experience list")
    );
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
