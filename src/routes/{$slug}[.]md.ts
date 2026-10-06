// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { Effect } from "effect";
import { RuntimeServer } from "@/lib/runtime-server";
import { Markdown } from "@/features/markdown/services/markdown";

const main = (request: Request) =>
  Effect.gen(function* () {
    const { experience } = yield* Markdown;
    return yield* experience(request);
  });

export const Route = createFileRoute("/{$slug}.md")({ server: { handlers: { GET: ({ request }) => RuntimeServer.runPromise(main(request)) } } });
