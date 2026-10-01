// services, features, and other libraries
import { Atom } from "effect/reactivity";

// services
import { makeTypewriterStream } from "../services/typewriter";

// Builds a per-text animation atom from the typewriter stream. The stream's
// state is exposed as an `AsyncResult`: `isWaiting` is true while the
// animation runs (driving the cursor) and false once it completes.
// `initialValue` seeds the first render with the full text, which preserves
// the SSR markup for SEO and keeps hydration mismatch-free.
export const makeTypewriterAtom = (fullText: string) =>
  Atom.make(makeTypewriterStream(fullText), { initialValue: fullText });
