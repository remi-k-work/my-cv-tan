// tanstack
import { createServerEntry, getResponseHeader, setCookie } from "@tanstack/react-start/server";

// services, features, and other libraries
import { assert, it } from "@effect/vitest";
import { Effect } from "effect";
import { documentRoute } from "../server-route";

const cookieStateAfter = async (
  keepsVisitorState: boolean,
  document: Parameters<typeof documentRoute>[0] = () => Effect.sync(() => new Response("document")),
  signal?: AbortSignal
) => {
  const route = documentRoute(document, () => keepsVisitorState);
  const entry = createServerEntry({
    fetch: async (request) => {
      setCookie("locale", "pl");
      try {
        const response = await route({ request });
        const body = await response.text();
        return new Response(`${body}:${getResponseHeader("set-cookie") ?? "none"}`);
      } catch {
        return new Response(`rejected:${getResponseHeader("set-cookie") ?? "none"}`);
      }
    },
  });

  return entry.fetch(new Request("https://www.remiforge.dev/robots.txt", { signal }));
};

it("a stateless document removes middleware cookie state inside the Effect runtime", async () => {
  const response = await cookieStateAfter(false);

  assert.strictEqual(await response.text(), "document:none");
});

it("a visitor-dependent document retains middleware cookie state", async () => {
  const response = await cookieStateAfter(true);

  assert.strictEqual(await response.text(), "document:locale=pl; Path=/");
});

it("a failed stateless document still removes middleware cookie state", async () => {
  const response = await cookieStateAfter(false, () => Effect.die("document failed"));

  assert.strictEqual(await response.text(), "rejected:none");
});

it("aborting a stateless document interrupts it and removes middleware cookie state", async () => {
  const abortController = new AbortController();
  let markStarted!: () => void;
  const started = new Promise<void>((resolve) => {
    markStarted = resolve;
  });

  const pending = cookieStateAfter(false, () => Effect.sync(markStarted).pipe(Effect.andThen(Effect.never)), abortController.signal);

  await started;
  abortController.abort();

  const response = await pending;
  assert.strictEqual(await response.text(), "rejected:none");
});
