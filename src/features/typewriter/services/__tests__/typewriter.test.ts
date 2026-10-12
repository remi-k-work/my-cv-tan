// services, features, and other libraries
import { assert, it } from "@effect/vitest";
import { Effect, Fiber, Stream } from "effect";
import { TestClock } from "effect/testing";

// domain
import { DeleteChars, Pause, TypeChars } from "../../domain/models";

// types
import type { TypewriterOp } from "../../domain/models";

// services
import { Typewriter } from "../typewriter";

// The per-frame holds run on the test clock: fork the stream, then jump time forward to run it to completion
const collectFrames = Effect.fnUntraced(function* (script: ReadonlyArray<TypewriterOp>) {
  const { run } = yield* Typewriter;
  const fiber = yield* Stream.runCollect(run(script)).pipe(Effect.forkChild);
  yield* TestClock.adjust("1 hour");
  return yield* Fiber.join(fiber);
});

it.effect("emits one frame per character, then holds the pause", () =>
  Effect.gen(function* () {
    const frames = yield* collectFrames([TypeChars({ text: "hi " }), Pause({ millis: 50 })]);

    assert.deepStrictEqual(Array.from(frames), ["h", "hi", "hi ", "hi "]);
  }).pipe(Effect.provide(Typewriter.layer))
);

it.effect("deletes characters frame by frame", () =>
  Effect.gen(function* () {
    const frames = yield* collectFrames([TypeChars({ text: "hix " }), DeleteChars({ count: 4 }), TypeChars({ text: "hi " })]);

    assert.deepStrictEqual(Array.from(frames), ["h", "hi", "hix", "hix ", "hix", "hi", "h", "", "h", "hi", "hi "]);
  }).pipe(Effect.provide(Typewriter.layer))
);

it.effect("always finishes on the exact full text", () =>
  Effect.gen(function* () {
    const { plan } = yield* Typewriter;

    const frames = yield* collectFrames(yield* plan("hello world"));

    const emitted = Array.from(frames);
    assert.isAbove(emitted.length, 0);
    assert.strictEqual(emitted[emitted.length - 1], "hello world ");
  }).pipe(Effect.provide(Typewriter.layer))
);
