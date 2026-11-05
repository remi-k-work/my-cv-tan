// services, features, and other libraries
import { assert, describe, it } from "@effect/vitest";

// domain
import { withoutNegotiationVary } from "../cache-variant";

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
});
