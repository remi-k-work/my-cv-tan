// services, features, and other libraries
import { assert, it } from "@effect/vitest";
import { Bytes, Effect } from "effect";
import { Digest } from "effect/crypto";
import { Base64Url } from "effect/encoding";

// domain
import { verifyCaptchaString } from "../session";

const testDigest = Digest.Digest.of({
  digest: () => Effect.succeed(new Uint8Array()),
  digestHex: () => Effect.succeed(""),
});

it.effect("rejects sealed captcha values that are not two segments", () =>
  Effect.gen(function* () {
    assert.isFalse(yield* verifyCaptchaString("test", "only-one-segment", "ABCDEF"));
    assert.isFalse(yield* verifyCaptchaString("test", "salt.digest.extra", "ABCDEF"));
  }).pipe(Effect.provideService(Digest.Digest, testDigest))
);

// A digest that returns its input makes the commitment equal the secret-salt-answer concatenation
const echoDigest = Digest.Digest.of({
  digest: (_algorithm, data) => Effect.succeed(new Uint8Array(data)),
  digestHex: () => Effect.succeed(""),
});

const textEncoder = new TextEncoder();

const sealWith = (secret: string, salt: Uint8Array, answer: string) =>
  `${Base64Url.encode(salt)}.${Base64Url.encode(Bytes.concat([textEncoder.encode(secret), salt, textEncoder.encode(answer)]))}`;

it.effect("accepts a sealed captcha only when the input matches the commitment", () =>
  Effect.gen(function* () {
    const salt = new Uint8Array(16);
    const sealed = sealWith("test", salt, "ABCDEF");
    assert.isTrue(yield* verifyCaptchaString("test", sealed, "ABCDEF"));
    assert.isFalse(yield* verifyCaptchaString("test", sealed, "ABCDEG"));
  }).pipe(Effect.provideService(Digest.Digest, echoDigest))
);
