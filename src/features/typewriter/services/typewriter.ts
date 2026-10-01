// services, features, and other libraries
import { Context, Effect, Layer, Stream } from "effect";
import { applyOp, expandOp, planScript } from "@/features/typewriter/domain";

// types
import type { TypewriterOp } from "@/features/typewriter/domain";

// Runs a planned script as a stream of progressively visible texts, threading
// the visible text through the ops via the pure `applyOp` reducer and
// sleeping each frame's hold before emitting it.
export const streamFromScript = (script: Effect.Effect<ReadonlyArray<TypewriterOp>>): Stream.Stream<string> =>
  Stream.fromIterableEffect(script).pipe(
    Stream.mapAccumEffect(
      () => "",
      (current, op) => Effect.map(expandOp(current, op), (frames) => [applyOp(current, op), frames] as const)
    ),
    Stream.mapEffect((frame) => Effect.as(Effect.sleep(`${frame.holdMillis} millis`), frame.text))
  );

// Builds the animation stream for a full text: plan the script, then run it.
export const makeTypewriterStream = (fullText: string): Stream.Stream<string> => streamFromScript(planScript(fullText));

export class Typewriter extends Context.Service<Typewriter>()("Typewriter", {
  make: Effect.sync(() => {
    // Builds the animation stream for a full text; plan the script, then run it
    const stream = (fullText: string): Stream.Stream<string> => streamFromScript(planScript(fullText));

    return { stream } as const;
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);
}
