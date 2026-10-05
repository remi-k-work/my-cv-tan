// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { Effect, Option } from "effect";
import { RuntimeServer } from "@/lib/runtime-server";
import { Data } from "@/features/data/services/data";
import { buildLlmsTxt, txtResponse } from "@/features/markdown/domain";

// Machine-readable site index for AI systems (GEO); the document itself is built in
// features/markdown alongside the .md twins so all AI-facing content lives together.
const main = Effect.gen(function* () {
  const data = yield* Data;

  const maybeList = yield* data.experienceList(Option.some("en"), Option.none());
  if (Option.isNone(maybeList)) yield* Effect.logError("[LLMS.TXT]: experienceList decode failed, emitting pages only");

  return txtResponse(buildLlmsTxt(Option.getOrElse(maybeList, () => [])));
});

export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: () => RuntimeServer.runPromise(main),
    },
  },
});
