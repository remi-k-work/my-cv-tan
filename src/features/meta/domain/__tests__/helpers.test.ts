// Temporary holding file for the HTTP response-header policy test. The policy moves out of `meta`
// in Phase 4; until then this test stays here so the suite keeps covering it.

import { assert, it } from "@effect/vitest";
import { documentHeaders } from "@/features/meta/services/responses";
import { CONTENT_SIGNAL } from "@/domain/discovery";

it("robots.txt responses are English, noindex, and carry the shared reuse signal", () => {
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
  assert.deepStrictEqual(
    Object.keys(polish).filter((key) => key !== "Content-Language"),
    Object.keys(english).filter((key) => key !== "Content-Language")
  );
});