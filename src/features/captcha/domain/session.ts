// services, features, and other libraries
import { Bytes, Effect, Option, Schema, String } from "effect";
import { Digest } from "effect/crypto";

// constants
const textEncoder = new TextEncoder();

// The sealed value is exactly two base64url segments (salt.digest); anything else is a
// mismatch, not an error; built once at module scope and reused on every verification
const decodeSealed = Schema.decodeUnknownOption(Schema.Tuple([Schema.Uint8ArrayFromBase64Url, Schema.Uint8ArrayFromBase64Url]));

// The commitment is a secret-keyed digest, so comparing it must not leak how many leading bytes
// matched: `Bytes.Equivalence` returns as soon as a byte differs (its own docs say not to use it
// for secrets), which would let a caller who controls the sealed cookie recover a valid digest
// one byte at a time and replay it; fold every byte without an early exit instead
const constantTimeEquals = (self: Uint8Array, that: Uint8Array) => {
  if (self.length !== that.length) return false;

  let difference = 0;
  for (let index = 0; index < self.length; index++) difference |= self[index] ^ that[index];
  return difference === 0;
};

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
  return constantTimeEquals(actual, expected);
});
