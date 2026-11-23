// services, features, and other libraries
import { Bytes, Effect, Option, Schema, String, pipe } from "effect";
import { Mac } from "effect/crypto";

// constants
const textEncoder = new TextEncoder();

// The sealed value is exactly two base64url segments (salt.tag); anything else is a
// mismatch, not an error; built once at module scope and reused on every verification
const decodeSealed = Schema.decodeUnknownOption(Schema.Tuple([Schema.Uint8ArrayFromBase64Url, Schema.Uint8ArrayFromBase64Url]));

export const captchaKey = (secret: string) => Mac.key(Mac.hmacSha256, textEncoder.encode(secret));

const captchaMessage = (salt: Uint8Array, captchaString: string) => Bytes.concat([salt, textEncoder.encode(captchaString)]);

// Binds a captcha answer to a one-time salt with HMAC-SHA-256 under the session secret
export const commitToCaptcha = (key: Mac.Key, salt: Uint8Array, captchaString: string) =>
  Effect.flatMap(Mac.Mac, (mac) => mac.sign(key, captchaMessage(salt, captchaString)));

export const verifyCaptchaString = (key: Mac.Key, sealed: string, captchaInput: string) =>
  pipe(
    decodeSealed(String.split(sealed, ".")),
    Option.match({
      // A malformed seal is a failed verification, not an error: there is no commitment to compare against
      onNone: () => Effect.succeed(false),
      onSome: ([salt, expected]) => Effect.flatMap(Mac.Mac, (mac) => mac.verify(key, expected, captchaMessage(salt, captchaInput))),
    })
  );
