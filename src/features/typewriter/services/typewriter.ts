// services, features, and other libraries
import { Array, Context, Effect, Layer, Match, Option, Random, Stream, String, pipe } from "effect";
import { planScript } from "@/features/typewriter/domain";

// types
import type { TypewriterOp } from "@/features/typewriter/domain";

// constants
import { DELETING_SPEED, TYPING_SPEED } from "@/features/typewriter/domain";

// Expands a single script op into the timed frames it produces, starting from the currently visible text
const expandOp = (currText: string, typewriterOp: TypewriterOp) =>
  Match.valueTags(typewriterOp, {
    // Typing emits one frame per character with a human-like hold
    TypeChars: ({ text }) =>
      pipe(
        Array.fromIterable(text),
        Array.scan(currText, (acc, char) => acc + char),
        Array.drop(1),
        Effect.forEach((typed) => Effect.map(Random.nextIntBetween(60, TYPING_SPEED), (holdMillis) => ({ text: typed, holdMillis })))
      ),
    // Deleting emits one frame per removed character
    DeleteChars: ({ count }) =>
      pipe(
        Array.makeBy(Math.min(count, String.length(currText)), (index) => index + 1),
        Effect.forEach((removed) =>
          Effect.map(Random.nextIntBetween(60, DELETING_SPEED), (holdMillis) => ({
            text: pipe(currText, String.takeLeft(String.length(currText) - removed)),
            holdMillis,
          }))
        )
      ),
    // A pause re-emits the unchanged text after its hold so the pause actually elapses inside the stream
    Pause: ({ millis }) => Effect.succeed([{ text: currText, holdMillis: millis }]),
  });

export class Typewriter extends Context.Service<Typewriter>()("Typewriter", {
  make: Effect.sync(() => {
    // Executes a planned script as a stream of progressively visible texts, threading
    // the visible text through the ops and sleeping each frame's hold before emitting it
    const run = (script: ReadonlyArray<TypewriterOp>) =>
      Stream.fromIterable(script).pipe(
        Stream.mapAccumEffect(
          () => "",
          (currText, typewriterOp) =>
            Effect.map(
              expandOp(currText, typewriterOp),
              (frames) =>
                [
                  pipe(
                    frames,
                    Array.last,
                    Option.map((frame) => frame.text),
                    Option.getOrElse(() => currText)
                  ),
                  frames,
                ] as const
            )
        ),
        Stream.mapEffect((frame) => Effect.as(Effect.sleep(`${frame.holdMillis} millis`), frame.text))
      );

    return { plan: planScript, run } as const;
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);
}
