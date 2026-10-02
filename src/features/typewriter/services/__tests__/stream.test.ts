// services, features, and other libraries
import { assert, it } from "@effect/vitest";
import { Effect, Stream } from "effect";

// domain
import { DeleteChars, Pause, TypeChars } from "../../domain/models";

// services
import { Typewriter } from "../typewriter";

it.live("emits one frame per character, then holds the pause", () =>
  Effect.gen(function* () {
    const { run } = yield* Typewriter;
    const script = Effect.succeed([TypeChars({ text: "hi " }), Pause({ millis: 50 })] as const);

    const frames = yield* Stream.runCollect(run(script));

    assert.deepStrictEqual(Array.from(frames), ["h", "hi", "hi ", "hi "]);
  }).pipe(Effect.provide(Typewriter.layer))
);

  it.live("deletes characters frame by frame", () =>
    Effect.gen(function* () {
      const { run } = yield* Typewriter;
      const script = Effect.succeed([
        TypeChars({ text: "hix " }),
        DeleteChars({ count: 4 }),
        TypeChars({ text: "hi " }),
      ] as const);

      const frames = yield* Stream.runCollect(run(script));

      assert.deepStrictEqual(Array.from(frames), ["h", "hi", "hix", "hix ", "hix", "hi", "h", "", "h", "hi", "hi "]);
    }).pipe(Effect.provide(Typewriter.layer))
  );

  it.live("always finishes on the exact full text", () =>
    Effect.gen(function* () {
      const { stream } = yield* Typewriter;

      const frames = yield* Stream.runCollect(stream("hello world"));

      const emitted = Array.from(frames);
      assert.isAbove(emitted.length, 0);
      assert.strictEqual(emitted[emitted.length - 1], "hello world ");
    }).pipe(Effect.provide(Typewriter.layer))
  );
