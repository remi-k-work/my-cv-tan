// services, features, and other libraries
import { assert, it } from "@effect/vitest";
import { Effect } from "effect";
import { Base64Url } from "effect/encoding";
import { BrowserCrypto } from "@effect/platform-browser";

// domain
import { captchaKey, commitToCaptcha, verifyCaptchaString } from "../session";

it.effect("rejects sealed captcha values that are not two segments", () =>
  Effect.gen(function* () {
    const key = yield* captchaKey("test");

    assert.isFalse(yield* verifyCaptchaString(key, "only-one-segment", "ABCDEF"));
    assert.isFalse(yield* verifyCaptchaString(key, "salt.digest.extra", "ABCDEF"));
  }).pipe(Effect.provide(BrowserCrypto.layerMac))
);

it.effect("accepts a sealed captcha only for the same key and input", () =>
  Effect.gen(function* () {
    const key = yield* captchaKey("test");
    const otherKey = yield* captchaKey("other");
    const salt = new Uint8Array(16);
    const commitment = yield* commitToCaptcha(key, salt, "ABCDEF");
    const sealed = `${Base64Url.encode(salt)}.${Base64Url.encode(commitment)}`;

    assert.isTrue(yield* verifyCaptchaString(key, sealed, "ABCDEF"));
    assert.isFalse(yield* verifyCaptchaString(key, sealed, "ABCDEG"));
    assert.isFalse(yield* verifyCaptchaString(otherKey, sealed, "ABCDEF"));
  }).pipe(Effect.provide(BrowserCrypto.layerMac))
);

it.effect("rejects a commitment whose tag is not the HMAC length", () =>
  Effect.gen(function* () {
    const key = yield* captchaKey("test");
    const salt = new Uint8Array(16);
    const commitment = yield* commitToCaptcha(key, salt, "ABCDEF");

    // A strict prefix shares every byte it has with the real tag, so verification must also check length
    const truncated = `${Base64Url.encode(salt)}.${Base64Url.encode(commitment.slice(0, -1))}`;
    const padded = `${Base64Url.encode(salt)}.${Base64Url.encode(new Uint8Array(commitment.length + 1))}`;

    assert.isFalse(yield* verifyCaptchaString(key, truncated, "ABCDEF"));
    assert.isFalse(yield* verifyCaptchaString(key, padded, "ABCDEF"));
  }).pipe(Effect.provide(BrowserCrypto.layerMac))
);
