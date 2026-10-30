// services, features, and other libraries
import { Array, Context, Duration, Effect, Layer, Match, Option, Random, Stream, pipe } from "effect";
import { planScript } from "@/features/typewriter/domain/actions";

// types
import type { TypewriterOp } from "@/features/typewriter/domain/models";

// constants
import { DELETING_SPEED, TYPING_SPEED } from "@/features/typewriter/domain/constants";

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
    // Deleting emits one frame per removed character; split by code point, the same unit typing
    // uses, so an astral character is removed whole rather than leaving a lone surrogate frame
    // `Array.range` always yields at least one element, so an empty text (or zero count) skips
    DeleteChars: ({ count }) => {
      const visible = Array.fromIterable(currText);
      const removalCount = Math.min(count, visible.length);
      if (removalCount === 0) return Effect.succeed([]);

      return pipe(
        Array.range(1, removalCount),
        Effect.forEach((removed) =>
          Effect.map(Random.nextIntBetween(60, DELETING_SPEED), (holdMillis) => ({
            text: Array.join(Array.take(visible, visible.length - removed), ""),
            holdMillis,
          }))
        )
      );
    },
    // A pause re-emits the unchanged text after its hold so the pause actually elapses inside the stream
    Pause: ({ millis }) => Effect.succeed([{ text: currText, holdMillis: millis }]),
  });

// Executes a planned script as a stream of progressively visible texts, threading the visible
// text through the ops and sleeping each frame's hold before emitting it
const run = (script: ReadonlyArray<TypewriterOp>) =>
  Stream.fromIterable(script).pipe(
    Stream.mapAccumEffect(
      () => "",
      (currText, typewriterOp) =>
        Effect.map(
          expandOp(currText, typewriterOp),
          (frames) =>
            [
              Option.match(Array.last(frames), {
                onNone: () => currText,
                onSome: (frame) => frame.text,
              }),
              frames,
            ] as const
        )
    ),
    Stream.mapEffect((frame) => Effect.as(Effect.sleep(Duration.millis(frame.holdMillis)), frame.text))
  );

export class Typewriter extends Context.Service<Typewriter>()("Typewriter", {
  // Pure value: `run` is stateless and `plan` is a function reference, so there is no work to defer
  make: Effect.succeed({ plan: planScript, run }),
}) {
  static readonly layer = Layer.effect(this, this.make);
}
