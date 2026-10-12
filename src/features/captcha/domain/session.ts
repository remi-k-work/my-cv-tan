// services, features, and other libraries
import { Crypto, Effect, Equal, Option, Schema } from "effect";

// constants
const textEncoder = new TextEncoder();

export const concatBytes = (parts: ReadonlyArray<Uint8Array>) => {
  const out = new Uint8Array(parts.reduce((length, part) => length + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
};

// Binds a captcha answer to a one-time salt under the session secret (digest commitment)
export const commitToCaptcha = Effect.fnUntraced(function* (secret: string, salt: Uint8Array, captchaString: string) {
  const crypto = yield* Crypto.Crypto;
  return yield* crypto.digest("SHA-256", concatBytes([textEncoder.encode(secret), salt, textEncoder.encode(captchaString)]));
});

export const verifyCaptchaString = Effect.fnUntraced(function* (secret: string, sealed: string, captchaInput: string) {
  // The sealed value is exactly two base64url segments (salt.digest); anything else is a mismatch, not an error
  const parts = Schema.decodeUnknownOption(Schema.Tuple([Schema.Uint8ArrayFromBase64Url, Schema.Uint8ArrayFromBase64Url]))(sealed.split("."));
  if (Option.isNone(parts)) return false;

  const [salt, expected] = parts.value;
  const actual = yield* commitToCaptcha(secret, salt, captchaInput);
  return Equal.equals(actual, expected);
});
