// services, features, and other libraries
import { Array, Context, Crypto, Effect, Layer, Option, Record } from "effect";
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

    const generate = Effect.replicateEffect(STRENGTH)(crypto.randomIntBetween(0, PERMITTED_CHARS.length - 1)).pipe(
      // Indices are guaranteed in-bounds by construction, so each maps directly to a character
      Effect.map((indices) =>
        Array.join(
          indices.map((index) => PERMITTED_CHARS[index]),
          ""
        )
      )
    );

    const seal = Effect.fn("seal")(
      function* (captchaString: string) {
        const salt = yield* crypto.randomBytes(SALT_BYTES);
        const commitment = yield* commitToCaptcha(salt, captchaString);
        return `${Base64Url.encode(salt)}.${Base64Url.encode(commitment)}`;
      },
      Effect.provideService(Crypto.Crypto, crypto),
      Effect.mapError((cause) => new CaptchaError({ cause }))
    );

    const verify = Effect.fn("verify")(
      (headers: Headers.Headers, captchaInput: string) =>
        Headers.get(headers, "cookie").pipe(
          Option.map(Cookies.parseHeader),
          Option.flatMap(Record.get(CAPTCHA_COOKIE_NAME)),
          Option.match({
            onNone: () => Effect.succeed(false),
            onSome: (sealed) => verifyCaptchaString(sealed, captchaInput),
          })
        ),
      Effect.provideService(Crypto.Crypto, crypto),
      Effect.mapError((cause) => new CaptchaError({ cause }))
    );

    return { generate, seal, verify } as const;
  }),
}) {
  static readonly layer = Layer.effect(this, this.make).pipe(Layer.provide(BrowserCrypto.layer));
}
