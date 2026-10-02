// services, features, and other libraries
import { Context, Effect, Layer, Stream } from "effect";
import { applyOp, expandOp, planScript } from "@/features/typewriter/domain";

// types
import type { TypewriterOp } from "@/features/typewriter/domain";

export class Typewriter extends Context.Service<Typewriter>()("Typewriter", {
  make: Effect.sync(() => {
    // Plans the animation script for a full text; mirrors `typeFullText`
    const plan = (fullText: string) => planScript(fullText);

    // Executes a planned script as a stream of progressively visible texts,
    // threading the visible text through the ops via the pure `applyOp`
    // reducer and sleeping each frame's hold before emitting it; mirrors `start`
    const run = (script: Effect.Effect<ReadonlyArray<TypewriterOp>>) =>
      Stream.fromIterableEffect(script).pipe(
        Stream.mapAccumEffect(
          () => "",
          (currText, typewriterOp) => Effect.map(expandOp(currText, typewriterOp), (frames) => [applyOp(currText, typewriterOp), frames] as const)
        ),
        Stream.mapEffect((frame) => Effect.as(Effect.sleep(`${frame.holdMillis} millis`), frame.text))
      );

    // Plans the script, then runs it
    const stream = (fullText: string) => run(plan(fullText));

    return { plan, run, stream } as const;
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);
}
