import { assert, it } from "@effect/vitest";
import { Effect } from "effect";
import { vi } from "vite-plus/test";
import { experienceHandler, homeHandler } from "../handlers";

vi.mock("@/lib/gt-translations", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/gt-translations")>()),
  translateForLanguage: () => Effect.tryPromise(() => Promise.reject(new Error("snapshot unavailable"))),
}));

it("a failed pinned translation serves an uncached English document without pinning the requested variant", async () => {
  const response = await homeHandler({ request: new Request("https://www.remiforge.dev/index.md?lang=pl") });

  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.headers.get("Content-Language"), "en");
  assert.strictEqual(response.headers.get("Content-Location"), "https://www.remiforge.dev/index.md?lang=en");
  assert.strictEqual(response.headers.get("Cache-Control"), "no-store");
  assert.strictEqual(response.headers.get("Vary"), "Cookie, Accept-Language");

  const body = await response.text();
  assert.include(body, 'lang: "en"');
  assert.include(body, "## Experience");
  assert.notInclude(body, "## Doświadczenie");
});

it("a failed translation keeps a missing experience's 404 and fallback language consistent", async () => {
  const response = await experienceHandler({ request: new Request("https://www.remiforge.dev/no-such-page.md?lang=pl") });

  assert.strictEqual(response.status, 404);
  assert.strictEqual(response.headers.get("Content-Language"), "en");
  assert.strictEqual(response.headers.get("Content-Location"), "https://www.remiforge.dev/no-such-page.md?lang=en");
  assert.strictEqual(response.headers.get("Cache-Control"), "no-store");
  assert.strictEqual(response.headers.get("X-Robots-Tag"), "noindex, follow");
  assert.strictEqual(response.headers.get("Vary"), "Cookie, Accept-Language");

  const body = await response.text();
  assert.include(body, 'lang: "en"');
  assert.include(body, "# Not Found");
  assert.notInclude(body, "# Nie znaleziono");
});
