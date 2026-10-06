// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { Effect } from "effect";
import { RuntimeServer } from "@/lib/runtime-server";
import { Markdown } from "@/features/markdown/services/markdown";

// Machine-readable site index for AI systems (GEO); the document itself is built in
// features/markdown alongside the .md twins so all AI-facing content lives together.
const main = Effect.gen(function* () {
  const { siteIndex } = yield* Markdown;
  return yield* siteIndex();
});

export const Route = createFileRoute("/llms.txt")({ server: { handlers: { GET: () => RuntimeServer.runPromise(main) } } });
