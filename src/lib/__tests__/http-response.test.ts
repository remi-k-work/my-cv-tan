// Direct unit tests for the shared HTTP response policy.

import { assert, it } from "@effect/vitest";
import { documentHeaders } from "../http-response";
import { CONTENT_SIGNAL } from "@/domain/discovery";

it("document headers carry the reuse signal, AI-index advertisements and language negotiation", () => {
  const polish = documentHeaders("pl");
  const english = documentHeaders("en");

  // Varies by Cookie and Accept-Language for proper CDN cache partitioning.
  assert.strictEqual(polish.Vary, "Cookie, Accept-Language");
  assert.strictEqual(polish["Content-Signal"], CONTENT_SIGNAL);
  assert.strictEqual(polish["Content-Language"], "pl");
  assert.strictEqual(english["Content-Language"], "en");
  assert.strictEqual(polish["X-Content-Type-Options"], "nosniff");
  assert.include(polish.Link, "https://www.remiforge.dev/llms.txt");
  assert.include(polish.Link, "https://www.remiforge.dev/llms-full.txt");
  assert.strictEqual(Object.keys(polish).length, 5);
  // The two languages publish the same policy; only the negotiated Content-Language differs
  assert.deepStrictEqual(
    Object.keys(polish).filter((key) => key !== "Content-Language"),
    Object.keys(english).filter((key) => key !== "Content-Language")
  );
});