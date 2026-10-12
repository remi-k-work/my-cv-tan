// services, features, and other libraries
import { Array, Config, Context, Crypto, Effect, Layer, Option, Record, Redacted } from "effect";
import { Base64Url } from "effect/encoding";
import { Cookies, Headers } from "effect/http";
import { BrowserCrypto } from "@effect/platform-browser";
import { commitToCaptcha, verifyCaptchaString } from "@/features/captcha/domain";
import { CaptchaError } from "@/domain";

// constants
import { CAPTCHA_COOKIE_NAME, PERMITTED_CHARS, SALT_BYTES, STRENGTH } from "@/features/captcha/domain";

export class Captcha extends Context.Service<Captcha>()("Captcha", {
  make: Effect.gen(function* () {
    const crypto = yield* Crypto.Crypto;

    // Read the signing secret once when the service boots, like the other feature services
    const secret = yield* Config.Redacted("SESSION_SECRET").pipe(Effect.map(Redacted.value));

    const generate = Effect.replicateEffect(STRENGTH)(crypto.randomIntBetween(0, PERMITTED_CHARS.length - 1)).pipe(
      // Indices are guaranteed in-bounds by construction, so each maps directly to a character
      Effect.map((indices) =>
        Array.join(
          indices.map((index) => PERMITTED_CHARS[index]),
          ""
        )
      )
    );

    const seal = Effect.fnUntraced(
      function* (captchaString: string) {
        const salt = yield* crypto.randomBytes(SALT_BYTES);
        const commitment = yield* commitToCaptcha(secret, salt, captchaString);
        return `${Base64Url.encode(salt)}.${Base64Url.encode(commitment)}`;
      },
      Effect.provideService(Crypto.Crypto, crypto),
      Effect.mapError((cause) => new CaptchaError({ cause }))
    );

    const verify = Effect.fnUntraced(
      function* (headers: Headers.Headers, captchaInput: string) {
        const cookie = Headers.get(headers, "cookie").pipe(Option.map(Cookies.parseHeader), Option.flatMap(Record.get(CAPTCHA_COOKIE_NAME)));
        if (Option.isNone(cookie)) return false;
        return yield* verifyCaptchaString(secret, cookie.value, captchaInput);
      },
      Effect.provideService(Crypto.Crypto, crypto),
      Effect.mapError((cause) => new CaptchaError({ cause }))
    );

    return { generate, seal, verify } as const;
  }),
}) {
  static readonly layer = Layer.effect(this, this.make).pipe(Layer.provide(BrowserCrypto.layer));
}
