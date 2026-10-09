// services, features, and other libraries
import { Config, Crypto, Effect, Option, Redacted, Schema } from "effect";
import { Base64Url } from "effect/encoding";

// constants
const textEncoder = new TextEncoder();

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

export const verifyCaptchaString = Effect.fn("verifyCaptchaString")(function* (sealed: string, captchaInput: string) {
  // The sealed value is exactly two base64url segments (salt.digest); anything else is a mismatch, not an error
  const parts = Schema.decodeUnknownOption(Schema.Tuple([Schema.Uint8ArrayFromBase64Url, Schema.Uint8ArrayFromBase64Url]))(sealed.split("."));
  if (Option.isNone(parts)) return false;

  const [salt, expected] = parts.value;
  const actual = yield* commitToCaptcha(salt, captchaInput);
  return Base64Url.encode(actual) === Base64Url.encode(expected);
});
