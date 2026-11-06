// services, features, and other libraries
import { assert, describe, it } from "@effect/vitest";

// domain
import { withoutNegotiationVary } from "../cache-variant";

// meta (shared)
import { documentHeaders } from "@/features/meta/services/headers";

describe("withoutNegotiationVary", () => {
  it("drops both negotiation tokens, leaving no Vary value", () => {
    assert.isNull(withoutNegotiationVary("Cookie, Accept-Language"));
    assert.isNull(withoutNegotiationVary("accept-language,Cookie"));
  });

  it("preserves unrelated tokens the runtime added", () => {
    // A pin fixes the document from the URL, but compression still varies per request
    assert.strictEqual(withoutNegotiationVary("Cookie, Accept-Language, Accept-Encoding"), "Accept-Encoding");
    assert.strictEqual(withoutNegotiationVary("Accept-Encoding"), "Accept-Encoding");
  });

  it("passes through an absent header and trims empty or padded tokens", () => {
    assert.isNull(withoutNegotiationVary(null));
    assert.strictEqual(withoutNegotiationVary(" Accept-Encoding ,  Origin "), "Accept-Encoding, Origin");
    assert.strictEqual(withoutNegotiationVary("Cookie,,Accept-Encoding"), "Accept-Encoding");
  });

  it("strips exactly the negotiation tokens documentHeaders advertises, for both languages", () => {
    // documentHeaders writes a twin's Vary and this strip reads it back, both from one shared token
    // list. Round-tripping to null is the contract: a token advertised but not stripped would leave a
    // language-pinned twin varying on inputs its pin replaced, and a token stripped but never
    // advertised would be drift that no response currently exercises.
    for (const language of ["en", "pl"] as const) {
      const vary = documentHeaders(language);
      assert.isNull(withoutNegotiationVary(vary.Vary));
    }
  });
});
