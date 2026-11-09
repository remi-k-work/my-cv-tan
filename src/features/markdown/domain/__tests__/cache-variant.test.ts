import { assert, describe, it } from "@effect/vitest";
import { withoutNegotiationVary } from "../cache-variant";
import { documentHeaders } from "@/features/meta/domain/helpers";

describe("withoutNegotiationVary", () => {
  it("drops both negotiation tokens, leaving no Vary value", () => {
    assert.isNull(withoutNegotiationVary("Cookie, Accept-Language"));
    assert.isNull(withoutNegotiationVary("accept-language,Cookie"));
  });

  it("preserves unrelated tokens the runtime added", () => {
    // Retains transport-level Vary tokens such as Accept-Encoding.
    assert.strictEqual(withoutNegotiationVary("Cookie, Accept-Language, Accept-Encoding"), "Accept-Encoding");
    assert.strictEqual(withoutNegotiationVary("Accept-Encoding"), "Accept-Encoding");
  });

  it("passes through an absent header and trims empty or padded tokens", () => {
    assert.isNull(withoutNegotiationVary(null));
    assert.strictEqual(withoutNegotiationVary(" Accept-Encoding ,  Origin "), "Accept-Encoding, Origin");
    assert.strictEqual(withoutNegotiationVary("Cookie,,Accept-Encoding"), "Accept-Encoding");
  });

  it("strips exactly the negotiation tokens documentHeaders advertises, for both languages", () => {
    // Verifies round-trip removal of documentHeaders negotiation tokens.
    for (const language of ["en", "pl"] as const) {
      const vary = documentHeaders(language);
      assert.isNull(withoutNegotiationVary(vary.Vary));
    }
  });
});
