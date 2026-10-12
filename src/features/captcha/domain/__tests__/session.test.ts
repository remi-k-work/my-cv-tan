// services, features, and other libraries
import { assert, it } from "@effect/vitest";
import { Crypto, Effect } from "effect";
import { Base64Url } from "effect/encoding";

// domain
import { concatBytes, verifyCaptchaString } from "../session";

const testCrypto = Crypto.make({
  randomBytes: (size) => new Uint8Array(size),
  digest: () => Effect.succeed(new Uint8Array()),
});

it.effect("rejects sealed captcha values that are not two segments", () =>
  Effect.gen(function* () {
    assert.isFalse(yield* verifyCaptchaString("test", "only-one-segment", "ABCDEF"));
    assert.isFalse(yield* verifyCaptchaString("test", "salt.digest.extra", "ABCDEF"));
  }).pipe(Effect.provideService(Crypto.Crypto, testCrypto))
);

// A digest that returns its input makes the commitment equal the secret-salt-answer concatenation
const echoCrypto = Crypto.make({
  randomBytes: (size) => new Uint8Array(size),
  digest: (_algorithm, data) => Effect.succeed(new Uint8Array(data)),
});

const textEncoder = new TextEncoder();

const sealWith = (secret: string, salt: Uint8Array, answer: string) =>
  `${Base64Url.encode(salt)}.${Base64Url.encode(concatBytes([textEncoder.encode(secret), salt, textEncoder.encode(answer)]))}`;

it.effect("accepts a sealed captcha only when the input matches the commitment", () =>
  Effect.gen(function* () {
    const salt = new Uint8Array(16);
    const sealed = sealWith("test", salt, "ABCDEF");
    assert.isTrue(yield* verifyCaptchaString("test", sealed, "ABCDEF"));
    assert.isFalse(yield* verifyCaptchaString("test", sealed, "ABCDEG"));
  }).pipe(Effect.provideService(Crypto.Crypto, echoCrypto))
);
