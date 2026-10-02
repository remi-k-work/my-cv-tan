// services, features, and other libraries
import { Effect, Stream } from "effect";
import { Atom } from "effect/reactivity";
import { RuntimeAtom } from "@/lib/runtime-client";
import { Typewriter } from "@/features/typewriter/services/typewriter";

// Builds a per-text animation atom from the typewriter service. The family
// memoizes one atom per text, so each paragraph animates independently and
// its stream is cancelled automatically on unmount via scope finalizers.
// The stream's state is exposed as an `AsyncResult`: `isWaiting` is true
// while the animation runs (driving the cursor) and false once it completes.
// `initialValue` seeds the first render with the full text, which preserves
// the SSR markup for SEO and keeps hydration mismatch-free.
export const typewriterAtom = Atom.family((fullText: string) =>
  RuntimeAtom.atom(Stream.unwrap(Effect.map(Typewriter, ({ stream }) => stream(fullText))), { initialValue: fullText })
);
