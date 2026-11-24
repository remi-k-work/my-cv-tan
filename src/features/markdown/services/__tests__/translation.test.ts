import { assert, it } from "@effect/vitest";
import { Effect } from "effect";
import { translateSource } from "@/domain/helpers";
import { makeTranslation, Translation } from "../translation";
import type { LoadTranslation } from "../translation";
import type { PreferredLanguage } from "@/domain/models";

const resolveWith = (preferredLanguage: PreferredLanguage, load: LoadTranslation) =>
  Effect.flatMap(Translation, (translation) => translation.resolve(preferredLanguage)).pipe(
    Effect.provideService(Translation, makeTranslation(load))
  );

it.effect("a supported translation keeps its requested language and dictionary", () =>
  Effect.map(
    resolveWith("pl", () => Effect.succeed((source: string) => `pl:${source}`)),
    (resolved) => {
      assert.strictEqual(resolved.fallback, false);
      assert.strictEqual(resolved.context.preferredLanguage, "pl");
      assert.strictEqual(resolved.context.translate("Pages"), "pl:Pages");
    }
  )
);

it.effect("an unavailable translation falls back to the whole English context, not English copy behind Polish metadata", () =>
  Effect.map(
    resolveWith("pl", () => Effect.tryPromise(() => Promise.reject(new Error("snapshot unavailable")))),
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
    resolveWith("en", () => {
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
