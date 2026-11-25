import { assert, it } from "@effect/vitest";
import { Effect } from "effect";
import { EntityTags } from "../entity-tags";

const apply = (request: Request, response: Response) =>
  EntityTags.pipe(Effect.flatMap(({ apply }) => apply(request, response)), Effect.provide(EntityTags.layer));

const request = (validator?: string) =>
  new Request("https://www.remiforge.dev/llms.txt", validator === undefined ? undefined : { headers: { "If-None-Match": validator } });

it.effect("successful documents receive a stable strong validator without consuming their body", () =>
  Effect.gen(function* () {
    const first = yield* apply(request(), new Response("# Portfolio", { headers: { "Cache-Control": "public, max-age=3600" } }));
    const second = yield* apply(request(), new Response("# Portfolio"));
    const changed = yield* apply(request(), new Response("# Updated portfolio"));
    const etag = first.headers.get("ETag");

    assert.match(etag ?? "", /^"[a-f0-9]{64}"$/);
    assert.strictEqual(second.headers.get("ETag"), etag);
    assert.notStrictEqual(changed.headers.get("ETag"), etag);
    assert.strictEqual(first.headers.get("Cache-Control"), "public, max-age=3600");
    assert.strictEqual(yield* Effect.promise(() => first.text()), "# Portfolio");
  })
);

it.effect("matching validators return a bodyless 304 with representation and discovery metadata", () =>
  Effect.gen(function* () {
    const initial = yield* apply(
      request(),
      new Response("# Portfolio", {
        headers: {
          "Cache-Control": "public, max-age=3600",
          "Content-Language": "en",
          "Content-Location": "https://www.remiforge.dev/index.md?lang=en",
          Link: '<https://www.remiforge.dev/>; rel="canonical"',
        },
      })
    );
    const etag = initial.headers.get("ETag");
    assert.isNotNull(etag);

    for (const validator of [etag!, `W/${etag}`, `"unrelated", ${etag}`, "*"]) {
      const revalidated = yield* apply(
        request(validator),
        new Response("# Portfolio", {
          headers: {
            "Cache-Control": "public, max-age=3600",
            "Content-Language": "en",
            "Content-Location": "https://www.remiforge.dev/index.md?lang=en",
            Link: '<https://www.remiforge.dev/>; rel="canonical"',
          },
        })
      );

      assert.strictEqual(revalidated.status, 304);
      assert.strictEqual(revalidated.headers.get("ETag"), etag);
      assert.strictEqual(revalidated.headers.get("Cache-Control"), "public, max-age=3600");
      assert.strictEqual(revalidated.headers.get("Content-Language"), "en");
      assert.strictEqual(revalidated.headers.get("Content-Location"), "https://www.remiforge.dev/index.md?lang=en");
      assert.strictEqual(revalidated.headers.get("Link"), '<https://www.remiforge.dev/>; rel="canonical"');
      assert.isNull(revalidated.body);
    }
  })
);

it.effect("no-store responses bypass validators even when a client supplies one", () =>
  Effect.gen(function* () {
    const response = yield* apply(request("*"), new Response("# Temporary English fallback", { headers: { "Cache-Control": "No-Store" } }));

    assert.strictEqual(response.status, 200);
    assert.isNull(response.headers.get("ETag"));
    assert.strictEqual(response.headers.get("Cache-Control"), "No-Store");
    assert.strictEqual(yield* Effect.promise(() => response.text()), "# Temporary English fallback");
  })
);

it.effect("stale validators and ineligible responses retain their original status", () =>
  Effect.gen(function* () {
    const fresh = yield* apply(request('"stale"'), new Response("# Portfolio"));
    assert.strictEqual(fresh.status, 200);
    assert.strictEqual(yield* Effect.promise(() => fresh.text()), "# Portfolio");

    const missing = yield* apply(request("*"), new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } }));
    assert.strictEqual(missing.status, 404);
    assert.isNull(missing.headers.get("ETag"));
    assert.strictEqual(missing.headers.get("Cache-Control"), "no-store");
  })
);
