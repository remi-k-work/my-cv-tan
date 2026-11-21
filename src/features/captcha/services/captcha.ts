// services, features, and other libraries
import { Array, Config, Context, Effect, Layer, Option, pipe, Record, Redacted, String } from "effect";
import { Mac, SecureRandom } from "effect/crypto";
import { Base64Url } from "effect/encoding";
import { Cookies, Headers } from "effect/http";
import { BrowserCrypto } from "@effect/platform-browser";
import { captchaKey, commitToCaptcha, verifyCaptchaString } from "@/features/captcha/domain/session";
import { CaptchaError } from "@/domain/errors";

// constants
import { CAPTCHA_COOKIE_NAME, PERMITTED_CHARS, SALT_BYTES, STRENGTH } from "@/features/captcha/domain/constants";

export class Captcha extends Context.Service<Captcha>()("my-cv-v4-tan/features/captcha/services/Captcha", {
  make: Effect.gen(function* () {
    const secureRandom = yield* SecureRandom.SecureRandom;
    const mac = yield* Mac.Mac;

    // Read the signing secret once when the service boots, like the other feature services
    const secret = yield* Config.Redacted("SESSION_SECRET").pipe(Effect.map(Redacted.value));
    const key = yield* captchaKey(secret);

    // One draw per character over the alphabet's half-open index range, then projection into its characters
    const generate = Effect.map(Effect.replicateEffect(STRENGTH)(secureRandom.intBetween(0, String.length(PERMITTED_CHARS), { halfOpen: true })), (indices) =>
      pipe(
        indices,
        Array.map((index) => PERMITTED_CHARS[index]),
        Array.join("")
      )
    );

    const seal = Effect.fnUntraced(
      function* (captchaString: string) {
        const salt = yield* secureRandom.randomBytes(SALT_BYTES);
        const commitment = yield* commitToCaptcha(key, salt, captchaString);
        return `${Base64Url.encode(salt)}.${Base64Url.encode(commitment)}`;
      },
      Effect.provideService(Mac.Mac, mac),
      Effect.mapError((error) => new CaptchaError({ cause: error }))
    );

    // Verification needs the captured MAC service and key, but none of the entropy sealing requires
    const verify = (headers: Headers.Headers, captchaInput: string): Effect.Effect<boolean, CaptchaError> =>
      pipe(
        Headers.get(headers, "cookie"),
        Option.map(Cookies.parseHeader),
        Option.flatMap(Record.get(CAPTCHA_COOKIE_NAME)),
        Option.match({
          // A missing captcha cookie is a failed verification, not an error: there is no sealed
          // commitment to compare against
          onNone: () => Effect.succeed(false),
          onSome: (sealedValue) => verifyCaptchaString(key, sealedValue, captchaInput),
        }),
        Effect.provideService(Mac.Mac, mac),
        Effect.mapError((error) => new CaptchaError({ cause: error }))
      );

    return { generate, seal, verify } as const;
  }),
}) {
  static readonly layer = Layer.effect(this, this.make).pipe(Layer.provide([BrowserCrypto.layerSecureRandom, BrowserCrypto.layerMac]));
}
