// services, features, and other libraries
import { Effect } from "effect";
import { RuntimeAtom } from "@/lib/runtime-client";
import { LangApiClient } from "@/features/data/http/client";

// types
import type { PreferredLanguage } from "@/domain";

export const updateAtom = RuntimeAtom.fn(
  Effect.fnUntraced(function* (preferredLanguage: PreferredLanguage) {
    const { Lang } = yield* LangApiClient;
    yield* Lang.lang({ payload: { preferredLanguage } });
  })
);
