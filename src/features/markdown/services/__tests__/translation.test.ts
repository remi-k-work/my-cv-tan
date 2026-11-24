import { assert, it } from "@effect/vitest";
import { Effect } from "effect";
import { translateSource } from "@/domain/helpers";
import { resolveTranslation } from "../translation";

it.effect("a supported translation keeps its requested language and dictionary", () =>
  Effect.map(
    resolveTranslation("pl", () => Effect.succeed((source: string) => `pl:${source}`)),
    (resolved) => {
      assert.strictEqual(resolved.fallback, false);
      assert.strictEqual(resolved.context.preferredLanguage, "pl");
      assert.strictEqual(resolved.context.translate("Pages"), "pl:Pages");
    }
  )
);

it.effect("an unavailable translation falls back to the whole English context, not English copy behind Polish metadata", () =>
  Effect.map(
    resolveTranslation("pl", () => Effect.tryPromise(() => Promise.reject(new Error("snapshot unavailable")))),
    (resolved) => {
      assert.strictEqual(resolved.fallback, true);
      assert.strictEqual(resolved.context.preferredLanguage, "en");
      assert.strictEqual(resolved.context.translate, translateSource);
      assert.strictEqual(resolved.context.translate("Pages"), "Pages");
    }
  )
);

it.effect("the source language never loads a dictionary and is never marked as a fallback", () => {
  let loads = 0;

  return Effect.map(
    resolveTranslation("en", () => {
      loads++;
      return Effect.succeed((source: string) => `unexpected:${source}`);
    }),
    (resolved) => {
      assert.strictEqual(loads, 0);
      assert.strictEqual(resolved.fallback, false);
      assert.strictEqual(resolved.context.preferredLanguage, "en");
      assert.strictEqual(resolved.context.translate, translateSource);
    }
  );
});
