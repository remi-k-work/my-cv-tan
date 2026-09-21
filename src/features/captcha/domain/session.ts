// services, features, and other libraries
import { Config, Effect, Encoding, Option, Redacted, Schema } from "effect";
import { Headers, HttpServerRequest } from "effect/unstable/http";
import { CaptchaPayloadJson } from ".";
import { CaptchaCryptoError } from "@/domain";

// constants
import { CAPTCHA_COOKIE_NAME } from ".";

const decodeSealed = (sealed: string): { iv: Uint8Array; data: Uint8Array } | undefined => {
  const dot = sealed.indexOf(".");
  if (dot <= 0) return undefined;
  const iv = Encoding.decodeBase64Url(sealed.slice(0, dot));
  if (iv._tag === "Failure") return undefined;
  const data = Encoding.decodeBase64Url(sealed.slice(dot + 1));
  if (data._tag === "Failure") return undefined;
  if (iv.success.length !== 12) return undefined;
  return { iv: iv.success, data: data.success };
};

const importAesKey = Effect.fn("importAesKey")(
  function* () {
    const secret = yield* Config.Redacted("SESSION_SECRET");
    const secretBytes = new TextEncoder().encode(Redacted.value(secret));
    const keyHash = yield* Effect.promise(() => crypto.subtle.digest("SHA-256", secretBytes));
    return yield* Effect.promise(() => crypto.subtle.importKey("raw", keyHash, "AES-GCM", false, ["encrypt", "decrypt"]));
  },
  Effect.mapError((cause) => new CaptchaCryptoError({ cause }))
);

export const sealCaptchaString = Effect.fn("sealCaptchaString")(function* (captchaString: string) {
  const key = yield* importAesKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(
    yield* Schema.encodeEffect(CaptchaPayloadJson)({ captchaString }).pipe(Effect.mapError((cause) => new CaptchaCryptoError({ cause })))
  );
  const ciphertext = yield* Effect.promise(() => crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, plaintext as BufferSource)).pipe(
    Effect.mapError((cause) => new CaptchaCryptoError({ cause }))
  );
  return `${Encoding.encodeBase64Url(iv)}.${Encoding.encodeBase64Url(new Uint8Array(ciphertext))}`;
});

const unsealStrict = Effect.fn("unsealStrict")(function* (sealed: string) {
  const parts = decodeSealed(sealed);
  if (parts === undefined) return yield* new CaptchaCryptoError({ cause: "malformed sealed captcha cookie" });
  const key = yield* importAesKey();
  const decrypted = yield* Effect.tryPromise(() =>
    crypto.subtle.decrypt({ name: "AES-GCM", iv: parts.iv as BufferSource }, key, parts.data as BufferSource)
  ).pipe(Effect.mapError((cause) => new CaptchaCryptoError({ cause })));
  const { captchaString } = yield* Schema.decodeEffect(CaptchaPayloadJson)(new TextDecoder().decode(decrypted)).pipe(
    Effect.mapError((cause) => new CaptchaCryptoError({ cause }))
  );
  return captchaString;
});

export const unsealCaptchaString = (sealed: string): Effect.Effect<Option.Option<string>> =>
  unsealStrict(sealed).pipe(
    Effect.asSome,
    Effect.orElseSucceed((): Option.Option<string> => Option.none())
  );

export const getSealedCaptchaFromCookieHeader = (cookieHeader: string | undefined): string | undefined => {
  if (cookieHeader === undefined) return undefined;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === CAPTCHA_COOKIE_NAME) {
      const raw = part.slice(eq + 1).trim();
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    }
  }
  return undefined;
};

export const getCaptchaStringFromCookieHeader = Effect.fn("getCaptchaStringFromCookieHeader")(function* (cookieHeader: string | undefined) {
  const sealed = getSealedCaptchaFromCookieHeader(cookieHeader);
  if (sealed === undefined) return Option.none();
  return yield* unsealCaptchaString(sealed);
});

export const getCaptchaStringFromHeaders = Effect.fn("getCaptchaStringFromHeaders")(function* (headers: Headers.Headers) {
  const cookieHeader = Headers.get(headers, "cookie");
  if (Option.isNone(cookieHeader)) return Option.none();
  return yield* getCaptchaStringFromCookieHeader(cookieHeader.value);
});

export const getCaptchaStringFromRequest = Effect.fn("getCaptchaStringFromRequest")(function* () {
  const request = yield* HttpServerRequest.HttpServerRequest;
  return yield* getCaptchaStringFromCookieHeader(request.headers.cookie);
});
