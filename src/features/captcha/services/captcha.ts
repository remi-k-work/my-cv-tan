// services, features, and other libraries
import { Array, Config, Context, Crypto, Effect, Layer, Option, pipe, Record, Redacted } from "effect";
import { Base64Url } from "effect/encoding";
import { Cookies, Headers } from "effect/http";
import { BrowserCrypto } from "@effect/platform-browser";
import { commitToCaptcha, verifyCaptchaString } from "@/features/captcha/domain/session";
import { CaptchaError } from "@/domain/errors";

// constants
import { CAPTCHA_COOKIE_NAME, PERMITTED_CHARS, SALT_BYTES, STRENGTH } from "@/features/captcha/domain/constants";

export class Captcha extends Context.Service<Captcha>()("Captcha", {
  make: Effect.gen(function* () {
    const crypto = yield* Crypto.Crypto;

    // Read the signing secret once when the service boots, like the other feature services
    const secret = yield* Config.Redacted("SESSION_SECRET").pipe(Effect.map(Redacted.value));

    const generate = Effect.gen(function* () {
      const indices = yield* Effect.replicateEffect(STRENGTH)(crypto.randomIntBetween(0, PERMITTED_CHARS.length - 1));
      return pipe(
        indices,
        Array.map((index) => PERMITTED_CHARS[index]),
        Array.join("")
      );
    });

    const seal = Effect.fnUntraced(
      function* (captchaString: string) {
        const salt = yield* crypto.randomBytes(SALT_BYTES);
        const commitment = yield* commitToCaptcha(secret, salt, captchaString);
        return `${Base64Url.encode(salt)}.${Base64Url.encode(commitment)}`;
      },
      Effect.provideService(Crypto.Crypto, crypto),
      Effect.mapError((error) => new CaptchaError({ cause: error }))
    );

    const verify = Effect.fnUntraced(
      function* (headers: Headers.Headers, captchaInput: string) {
        // A missing captcha cookie is a failed verification, not an error: no sealed
        // commitment to compare against
        const sealed = pipe(Headers.get(headers, "cookie"), Option.map(Cookies.parseHeader), Option.flatMap(Record.get(CAPTCHA_COOKIE_NAME)));

        if (Option.isNone(sealed)) return false;
        return yield* verifyCaptchaString(secret, sealed.value, captchaInput);
      },
      Effect.provideService(Crypto.Crypto, crypto),
      Effect.mapError((error) => new CaptchaError({ cause: error }))
    );

    return { generate, seal, verify } as const;
  }),
}) {
  static readonly layer = Layer.effect(this, this.make).pipe(Layer.provide(BrowserCrypto.layer));
}
