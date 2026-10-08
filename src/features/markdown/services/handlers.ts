// services, features, and other libraries
import { Effect } from "effect";
import { RuntimeServer } from "@/lib/runtime-server";
import { Markdown } from "./markdown";

// Route-handler factory: every machine-readable document route wires its request to
// the Markdown service with this one line instead of repeating Effect/runtime plumbing.
export const markdownHandler =
  (pick: (markdown: Markdown["Service"]) => (request: Request) => Effect.Effect<Response>) =>
  ({ request }: { request: Request }) =>
    RuntimeServer.runPromise(
      Effect.gen(function* () {
        return yield* pick(yield* Markdown)(request);
      })
    );
