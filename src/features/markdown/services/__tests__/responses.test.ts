// services, features, and other libraries
import { assert, it } from "@effect/vitest";

// services
import { pinCacheVariant } from "../responses";

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
