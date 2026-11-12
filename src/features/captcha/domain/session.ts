// services, features, and other libraries
import { Bytes, Effect, Option, Schema, String } from "effect";
import { Digest, Mac } from "effect/crypto";

// constants
const textEncoder = new TextEncoder();

// The sealed value is exactly two base64url segments (salt.digest); anything else is a
// mismatch, not an error; built once at module scope and reused on every verification
const decodeSealed = Schema.decodeUnknownOption(Schema.Tuple([Schema.Uint8ArrayFromBase64Url, Schema.Uint8ArrayFromBase64Url]));

// Binds a captcha answer to a one-time salt under the session secret (digest commitment)
export const commitToCaptcha = Effect.fnUntraced(function* (secret: string, salt: Uint8Array, captchaString: string) {
  const digest = yield* Digest.Digest;
  return yield* digest.digest(Digest.sha256, Bytes.concat([textEncoder.encode(secret), salt, textEncoder.encode(captchaString)]));
});

export const verifyCaptchaString = Effect.fnUntraced(function* (secret: string, sealed: string, captchaInput: string) {
  const sealedParts = decodeSealed(String.split(sealed, "."));
  if (Option.isNone(sealedParts)) return false;

  const [salt, expected] = sealedParts.value;
  const actual = yield* commitToCaptcha(secret, salt, captchaInput);

  // The commitment is a secret-keyed digest, so the comparison must not leak how many leading bytes matched
  return Mac.timingSafeEqual(actual, expected);
});
