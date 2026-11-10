import { assert, it } from "@effect/vitest";
import { Effect } from "effect";
import { translateSource } from "@/domain/helpers";
import { resolveTranslation } from "../translation";

it("a supported translation keeps its requested language and dictionary", async () => {
  const translate = (source: string) => `pl:${source}`;
  const resolved = await Effect.runPromise(resolveTranslation("pl", () => Promise.resolve(translate)));

  assert.strictEqual(resolved.fallback, false);
  assert.strictEqual(resolved.context.preferredLanguage, "pl");
  assert.strictEqual(resolved.context.translate("Pages"), "pl:Pages");
});

it("an unavailable translation falls back to the whole English context, not English copy behind Polish metadata", async () => {
  const resolved = await Effect.runPromise(resolveTranslation("pl", () => Promise.reject(new Error("snapshot unavailable"))));

  assert.strictEqual(resolved.fallback, true);
  assert.strictEqual(resolved.context.preferredLanguage, "en");
  assert.strictEqual(resolved.context.translate, translateSource);
  assert.strictEqual(resolved.context.translate("Pages"), "Pages");
});

it("the source language never loads a dictionary and is never marked as a fallback", async () => {
  let loads = 0;
  const resolved = await Effect.runPromise(
    resolveTranslation("en", () => {
      loads++;
      return Promise.resolve((source: string) => `unexpected:${source}`);
    })
  );

  assert.strictEqual(loads, 0);
  assert.strictEqual(resolved.fallback, false);
  assert.strictEqual(resolved.context.preferredLanguage, "en");
  assert.strictEqual(resolved.context.translate, translateSource);
});
