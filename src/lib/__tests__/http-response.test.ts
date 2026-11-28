// Direct unit tests for the shared HTTP response policy.

import { assert, it } from "@effect/vitest";
import { documentHeaders } from "../http-response";
import { CONTENT_SIGNAL } from "@/domain/discovery";
import { INDEXABLE_ROBOTS, NEGOTIATED_DOCUMENT_CACHE, NOINDEX_FOLLOW } from "@/domain/http";

it("document headers carry the reuse signal, AI-index advertisements and language negotiation", () => {
  const polish = documentHeaders("pl");
  const english = documentHeaders("en");

  // Varies by Cookie and Accept-Language for proper CDN cache partitioning.
  assert.strictEqual(polish.Vary, "Cookie, Accept-Language");
  assert.strictEqual(polish["Content-Signal"], CONTENT_SIGNAL);
  assert.strictEqual(polish["Content-Language"], "pl");
  assert.strictEqual(english["Content-Language"], "en");
  assert.strictEqual(polish["X-Content-Type-Options"], "nosniff");
  assert.strictEqual(polish["Cache-Control"], NEGOTIATED_DOCUMENT_CACHE);
  assert.strictEqual(polish["X-Robots-Tag"], INDEXABLE_ROBOTS);
  assert.strictEqual(documentHeaders("pl", NOINDEX_FOLLOW)["X-Robots-Tag"], NOINDEX_FOLLOW);
  assert.include(polish.Link, "https://www.remiforge.dev/llms.txt");
  assert.include(polish.Link, "https://www.remiforge.dev/llms-full.txt");
  assert.strictEqual(Object.keys(polish).length, 7);
  // The two languages publish the same policy; only the negotiated Content-Language differs
  assert.deepStrictEqual(
    Object.keys(polish).filter((key) => key !== "Content-Language"),
    Object.keys(english).filter((key) => key !== "Content-Language")
  );
});