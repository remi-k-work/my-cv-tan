// services, features, and other libraries
import { Config, Crypto, Effect, Encoding, Match, Option, Redacted, Schema } from "effect";

// constants
const textEncoder = new TextEncoder();
const decodePart = Schema.decodeOption(Schema.Uint8ArrayFromBase64Url);

const concatBytes = (parts: ReadonlyArray<Uint8Array>) => {
  const out = new Uint8Array(parts.reduce((length, part) => length + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
};

export const commitToCaptcha = Effect.fn("commitToCaptcha")(function* (salt: Uint8Array, captchaString: string) {
  const crypto = yield* Crypto.Crypto;
  const secret = yield* Config.Redacted("SESSION_SECRET").pipe(Effect.map((secret) => textEncoder.encode(Redacted.value(secret))));
  const answer = textEncoder.encode(captchaString);
  return yield* crypto.digest("SHA-256", concatBytes([secret, salt, answer]));
});

export const verifyCaptchaString = Effect.fn("verifyCaptchaString")((sealed: string, captchaInput: string) =>
  Match.value(sealed.split(".")).pipe(
    Match.when(
      (parts): parts is [string, string] => parts.length === 2,
      ([saltPart, expectedPart]) =>
        Effect.gen(function* () {
          const parts = Option.all([decodePart(saltPart), decodePart(expectedPart)]);
          if (Option.isNone(parts)) return false;
          const [salt, expected] = parts.value;
          const actual = yield* commitToCaptcha(salt, captchaInput);
          return Encoding.encodeBase64Url(actual) === Encoding.encodeBase64Url(expected);
        })
    ),
    Match.orElse(() => Effect.succeed(false))
  )
);
