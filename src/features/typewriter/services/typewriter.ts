// services, features, and other libraries
import { Array, Context, Duration, Effect, Layer, Match, Number, Option, Random, Stream, pipe } from "effect";
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
    DeleteChars: ({ count }) => {
      const visible = Array.fromIterable(currText);
      const removalCount = Number.min(count, visible.length);
      // Array.range(1, 0) is [1], so this guard keeps an empty text (or a zero request) from
      // emitting a deletion frame for a character that is not there
      if (removalCount <= 0) return Effect.succeed([]);

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
              pipe(
                Array.last(frames),
                Option.map((frame) => frame.text),
                Option.getOrElse(() => currText)
              ),
              frames,
            ] as const
        )
    ),
    Stream.mapEffect((frame) => Effect.as(Effect.sleep(Duration.millis(frame.holdMillis)), frame.text))
  );

export class Typewriter extends Context.Service<
  Typewriter,
  {
    readonly plan: typeof planScript;
    readonly run: typeof run;
  }
>()("my-cv-v4-tan/features/typewriter/services/Typewriter") {
  // The implementation is a pure value, so it needs no effectful layer construction
  static readonly layer = Layer.succeed(this, { plan: planScript, run });
}
