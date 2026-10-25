// services, features, and other libraries
import { Bytes, Crypto, Effect, Option, Schema } from "effect";

// constants
const textEncoder = new TextEncoder();

// Binds a captcha answer to a one-time salt under the session secret (digest commitment)
export const commitToCaptcha = Effect.fnUntraced(function* (secret: string, salt: Uint8Array, captchaString: string) {
  const crypto = yield* Crypto.Crypto;
  return yield* crypto.digest("SHA-256", Bytes.concat([textEncoder.encode(secret), salt, textEncoder.encode(captchaString)]));
});

export const verifyCaptchaString = Effect.fnUntraced(function* (secret: string, sealed: string, captchaInput: string) {
  // The sealed value is exactly two base64url segments (salt.digest); anything else is a mismatch, not an error
  const parts = Schema.decodeUnknownOption(Schema.Tuple([Schema.Uint8ArrayFromBase64Url, Schema.Uint8ArrayFromBase64Url]))(sealed.split("."));
  if (Option.isNone(parts)) return false;

  const [salt, expected] = parts.value;
  const actual = yield* commitToCaptcha(secret, salt, captchaInput);
  return Bytes.Equivalence(actual, expected);
});
