// services, features, and other libraries
import { Array, Context, Crypto, Effect, Encoding, Layer, Option, Record, String } from "effect";
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
      Effect.map((indices) =>
        Option.all(indices.map((index) => String.charAt(PERMITTED_CHARS, index))).pipe(
          Option.map(Array.join("")),
          Option.getOrElse(() => "")
        )
      )
    );

    const seal = Effect.fn("seal")(
      function* (captchaString: string) {
        const salt = yield* crypto.randomBytes(SALT_BYTES);
        const commitment = yield* commitToCaptcha(salt, captchaString);
        return `${Encoding.encodeBase64Url(salt)}.${Encoding.encodeBase64Url(commitment)}`;
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
