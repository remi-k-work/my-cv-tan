// services, features, and other libraries
import { Effect, Stream } from "effect";
import { Atom } from "effect/reactivity";
import { RuntimeAtom } from "@/lib/runtime-client";
import { Typewriter } from "@/features/typewriter/services/typewriter";

// Builds a per-text animation atom from the typewriter service; the family memoizes one atom per text, so each typewriter animates independently
export const typewriterAtom = Atom.family((fullText: string) =>
  RuntimeAtom.atom(Stream.unwrap(Effect.map(Typewriter, ({ plan, run }) => run(plan(fullText)))), { initialValue: fullText })
);
