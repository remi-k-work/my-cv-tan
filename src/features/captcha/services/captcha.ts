// services, features, and other libraries
import { Array, Config, Context, Effect, Layer, Option, pipe, Record, Redacted } from "effect";
import { Digest, SecureRandom } from "effect/crypto";
import { Base64Url } from "effect/encoding";
import { Cookies, Headers } from "effect/http";
import { BrowserCrypto } from "@effect/platform-browser";
import { commitToCaptcha, verifyCaptchaString } from "@/features/captcha/domain/session";
import { CaptchaError } from "@/domain/errors";

// constants
import { CAPTCHA_COOKIE_NAME, PERMITTED_CHARS, SALT_BYTES, STRENGTH } from "@/features/captcha/domain/constants";

export class Captcha extends Context.Service<Captcha>()("Captcha", {
  make: Effect.gen(function* () {
    const secureRandom = yield* SecureRandom.SecureRandom;
    const digest = yield* Digest.Digest;

    // Read the signing secret once when the service boots, like the other feature services
    const secret = yield* Config.Redacted("SESSION_SECRET").pipe(Effect.map(Redacted.value));

    // One draw per character, then the projection into the permitted alphabet: a combinator pair
    // rather than a generator body, since there is a single effect to sequence
    const generate = Effect.map(Effect.replicateEffect(STRENGTH)(secureRandom.intBetween(0, PERMITTED_CHARS.length - 1)), (indices) =>
      pipe(
        indices,
        Array.map((index) => PERMITTED_CHARS[index]),
        Array.join("")
      )
    );

    const seal = Effect.fnUntraced(
      function* (captchaString: string): Effect.fn.Return<string, CaptchaError, Digest.Digest> {
        const salt = yield* secureRandom.randomBytes(SALT_BYTES);
        const commitment = yield* commitToCaptcha(secret, salt, captchaString);
        return `${Base64Url.encode(salt)}.${Base64Url.encode(commitment)}`;
      },
      Effect.provideService(Digest.Digest, digest),
      Effect.mapError((error) => new CaptchaError({ cause: error }))
    );

    const verify = Effect.fnUntraced(
      function* (headers: Headers.Headers, captchaInput: string): Effect.fn.Return<boolean, CaptchaError, Digest.Digest> {
        // Verification only recomputes a commitment, so `commitToCaptcha` is the whole service
        // requirement: the entropy service `seal` needs is not part of reading one back
        return yield* pipe(
          Headers.get(headers, "cookie"),
          Option.map(Cookies.parseHeader),
          Option.flatMap(Record.get(CAPTCHA_COOKIE_NAME)),
          Option.match({
            // A missing captcha cookie is a failed verification, not an error: there is no sealed
            // commitment to compare against
            onNone: () => Effect.succeed(false),
            onSome: (sealedValue) => verifyCaptchaString(secret, sealedValue, captchaInput),
          })
        );
      },
      Effect.provideService(Digest.Digest, digest),
      Effect.mapError((error) => new CaptchaError({ cause: error }))
    );

    return { generate, seal, verify } as const;
  }),
}) {
  static readonly layer = Layer.effect(this, this.make).pipe(Layer.provide(BrowserCrypto.layer));
}
