// services, features, and other libraries
import { Effect, Stream } from "effect";
import { Atom } from "effect/reactivity";
import { RuntimeAtom } from "@/lib/runtime-client";
import { Typewriter } from "@/features/typewriter/services/typewriter";

// Builds a per-text animation atom from the typewriter service; the family memoizes one atom per text, so each typewriter animates independently
export const typewriterAtom = Atom.family((fullText: string) =>
  RuntimeAtom.atom(Stream.unwrap(Effect.flatMap(Typewriter, ({ plan, run }) => Effect.map(plan(fullText), run))), { initialValue: fullText })
);
