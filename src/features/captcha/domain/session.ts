// services, features, and other libraries
import { Config, Crypto, Effect, Encoding, Option, Redacted, Schema } from "effect";

// constants
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

const readSecretBytes = Effect.fn("readSecretBytes")(function* () {
  const secret = yield* Config.Redacted("SESSION_SECRET");
  return new TextEncoder().encode(Redacted.value(secret));
});

export const commitToCaptcha = Effect.fn("commitToCaptcha")(function* (salt: Uint8Array, captchaString: string) {
  const crypto = yield* Crypto.Crypto;
  const secret = yield* readSecretBytes();
  const answer = new TextEncoder().encode(captchaString);
  return yield* crypto.digest("SHA-256", concatBytes([secret, salt, answer]));
});

export const verifyCaptchaString = Effect.fn("verifyCaptchaString")(function* (sealed: string, captchaInput: string) {
  const dot = sealed.indexOf(".");
  if (dot <= 0) return false;
  const salt = decodePart(sealed.slice(0, dot));
  const expected = decodePart(sealed.slice(dot + 1));
  if (Option.isNone(salt) || Option.isNone(expected)) return false;
  const actual = yield* commitToCaptcha(salt.value, captchaInput);
  return Encoding.encodeBase64Url(actual) === Encoding.encodeBase64Url(expected.value);
});
