// tanstack
import { createServerEntry, getResponseHeader, setCookie } from "@tanstack/react-start/server";

// services, features, and other libraries
import { assert, it } from "@effect/vitest";
import { Effect } from "effect";
import { documentRoute } from "../server-route";

const cookieStateAfter = async (keepsVisitorState: boolean) => {
  const route = documentRoute(() => Effect.sync(() => new Response("document")), () => keepsVisitorState);
  const entry = createServerEntry({
    fetch: async (request) => {
      setCookie("locale", "pl");
      const response = await route({ request });
      const body = await response.text();
      return new Response(`${body}:${getResponseHeader("set-cookie") ?? "none"}`);
    },
  });

  return entry.fetch(new Request("https://www.remiforge.dev/robots.txt"));
};

it("a stateless document removes middleware cookie state inside the Effect runtime", async () => {
  const response = await cookieStateAfter(false);

  assert.strictEqual(await response.text(), "document:none");
});

it("a visitor-dependent document retains middleware cookie state", async () => {
  const response = await cookieStateAfter(true);

  assert.strictEqual(await response.text(), "document:locale=pl; Path=/");
});
