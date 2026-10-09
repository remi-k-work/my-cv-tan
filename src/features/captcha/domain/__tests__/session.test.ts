// services, features, and other libraries
import { assert, it } from "@effect/vitest";
import { ConfigProvider, Crypto, Effect } from "effect";
import { Base64Url } from "effect/encoding";

// domain
import { verifyCaptchaString } from "../session";

const testCrypto = Crypto.make({
  randomBytes: (size) => new Uint8Array(size),
  digest: () => Effect.succeed(new Uint8Array()),
});

it.effect("rejects sealed captcha values that are not two segments", () =>
  Effect.gen(function* () {
    assert.isFalse(yield* verifyCaptchaString("only-one-segment", "ABCDEF"));
    assert.isFalse(yield* verifyCaptchaString("salt.digest.extra", "ABCDEF"));
  }).pipe(
    Effect.provideService(Crypto.Crypto, testCrypto),
    Effect.provideService(ConfigProvider.ConfigProvider, ConfigProvider.fromUnknown({ SESSION_SECRET: "test" }))
  )
);

// A digest that returns its input makes the commitment equal the secret-salt-answer concatenation
const echoCrypto = Crypto.make({
  randomBytes: (size) => new Uint8Array(size),
  digest: (_algorithm, data) => Effect.succeed(new Uint8Array(data)),
});

const textEncoder = new TextEncoder();

const sealWith = (secret: string, salt: Uint8Array, answer: string) => {
  const parts = [textEncoder.encode(secret), salt, textEncoder.encode(answer)];
  const out = new Uint8Array(parts.reduce((length, part) => length + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return `${Base64Url.encode(salt)}.${Base64Url.encode(out)}`;
};

it.effect("accepts a sealed captcha only when the input matches the commitment", () =>
  Effect.gen(function* () {
    const salt = new Uint8Array(16);
    const sealed = sealWith("test", salt, "ABCDEF");
    assert.isTrue(yield* verifyCaptchaString(sealed, "ABCDEF"));
    assert.isFalse(yield* verifyCaptchaString(sealed, "ABCDEG"));
  }).pipe(
    Effect.provideService(Crypto.Crypto, echoCrypto),
    Effect.provideService(ConfigProvider.ConfigProvider, ConfigProvider.fromUnknown({ SESSION_SECRET: "test" }))
  )
);
