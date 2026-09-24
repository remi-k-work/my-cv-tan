// services, features, and other libraries
import { Effect } from "effect";
import { RuntimeAtom } from "@/lib/runtime-client";

// types
import type { PreferredLanguage } from "@/domain";

export const updateAtom = RuntimeAtom.fn(
  Effect.fnUntraced(function* (preferredLanguage: PreferredLanguage) {
    yield* Effect.log("updateAtom", preferredLanguage);
  })
);
