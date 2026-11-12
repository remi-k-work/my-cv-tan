// services, features, and other libraries
import { assert, describe, it } from "@effect/vitest";
import { Array, ConfigProvider, Effect, Layer } from "effect";
import { Headers } from "effect/http";
import { Captcha } from "../captcha";

// constants
import { CAPTCHA_COOKIE_NAME, PERMITTED_CHARS, STRENGTH } from "@/features/captcha/domain/constants";

// The service reads its signing secret from Config when it boots, so the tests supply one from a
// record rather than depending on the ambient environment (or on one being configured)
const SECRETS = ConfigProvider.layer(ConfigProvider.fromEnvRecord({ SESSION_SECRET: "test-session-secret" }));

// One layer for every case: the captcha service over the secrets it reads at construction
const CAPTCHA = Captcha.layer.pipe(Layer.provide(SECRETS));

// Cookie header carrying one sealed commitment, built the way a browser sends it back
const cookieHeader = (sealed: string) => Headers.fromInput({ cookie: `${CAPTCHA_COOKIE_NAME}=${sealed}` });

describe("Captcha", () => {
  it.effect("generate draws the permitted alphabet at the field's declared length", () =>
    Effect.gen(function* () {
      const { generate } = yield* Captcha;

      for (const captcha of yield* Effect.replicateEffect(generate, 16)) {
        assert.strictEqual(captcha.length, STRENGTH);
        // The input schema caps the answer at this length and the alphabet is all it accepts, so a
        // generated value must satisfy both for the gate to be passable at all
        assert.isTrue(Array.every(Array.fromIterable(captcha), (char) => PERMITTED_CHARS.includes(char)), `"${captcha}" left the alphabet`);
      }
    }).pipe(Effect.provide(CAPTCHA))
  );

  it.effect("a sealed answer verifies only against the same answer", () =>
    Effect.gen(function* () {
      const { generate, seal, verify } = yield* Captcha;

      const captcha = yield* generate;
      const sealed = yield* seal(captcha);
      const headers = cookieHeader(sealed);

      assert.isTrue(yield* verify(headers, captcha));
      // A longer answer, a truncated one, and nothing at all are each a different answer
      assert.isFalse(yield* verify(headers, `${captcha}x`));
      assert.isFalse(yield* verify(headers, captcha.slice(0, -1)));
      assert.isFalse(yield* verify(headers, ""));
    }).pipe(Effect.provide(CAPTCHA))
  );

  it.effect("a commitment does not validate an answer it was not sealed for", () =>
    Effect.gen(function* () {
      const { generate, seal, verify } = yield* Captcha;

      const captcha = yield* generate;
      const sealed = yield* seal(captcha);
      const headers = cookieHeader(sealed);

      // A second, independent answer: the commitment is keyed to the first draw, so the second must
      // fail. Two draws coinciding (one in 26^6) leaves nothing to tell apart, and the matching
      // case is already covered above
      const other = yield* generate;
      if (other !== captcha) assert.isFalse(yield* verify(headers, other));
    }).pipe(Effect.provide(CAPTCHA))
  );

  it.effect("a request with no readable commitment is a failed verification, not an error", () =>
    Effect.gen(function* () {
      const { generate, seal, verify } = yield* Captcha;

      const captcha = yield* generate;
      const sealed = yield* seal(captcha);

      // No cookie header at all, a cookie under another name, and a cookie too malformed to parse
      // are the same answer, and none of them may take the error path
      const unreadable: ReadonlyArray<Headers.Headers> = [
        Headers.fromInput({}),
        Headers.fromInput({ cookie: `other=${sealed}` }),
        Headers.fromInput({ cookie: `${CAPTCHA_COOKIE_NAME}=not-a-sealed-value` }),
      ];

      for (const headers of unreadable) {
        assert.isFalse(yield* verify(headers, captcha));
      }
    }).pipe(Effect.provide(CAPTCHA))
  );
});
