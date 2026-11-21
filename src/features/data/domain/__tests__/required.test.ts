import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { recoverDataFailure, requireData, requireDataFrom } from "../required";

describe("requireData", () => {
  it.effect("returns present data and identifies an unavailable dataset", () =>
    Effect.gen(function* () {
      assert.strictEqual(yield* requireData(Option.some("ready"), "page titles"), "ready");

      const error = yield* Effect.flip(requireData(Option.none(), "page titles"));
      assert.strictEqual(error._tag, "RequiredDataError");
      assert.strictEqual(error.dataset, "page titles");
      assert.strictEqual(error.message, "Required data is unavailable: page titles");
    })
  );

  it.effect("requireDataFrom flattens maybe-data without hiding an upstream failure", () =>
    Effect.gen(function* () {
      assert.strictEqual(yield* requireDataFrom(Effect.succeedSome("ready"), "education list"), "ready");

      const upstreamFailure: Effect.Effect<Option.Option<string>, "upstream"> = Effect.fail("upstream");
      const error = yield* Effect.flip(requireDataFrom(upstreamFailure, "education list"));
      assert.strictEqual(error, "upstream");
    })
  );
});

it.effect("recoverDataFailure evaluates its log prefix and fallback only when required data fails", () =>
  Effect.gen(function* () {
    let logPrefixCalls = 0;
    let fallbackCalls = 0;
    const recover = recoverDataFailure(
      () => {
        logPrefixCalls += 1;
        return "[TEST]";
      },
      () => {
        fallbackCalls += 1;
        return new Response("Unavailable", { status: 503 });
      }
    );

    const success = new Response("OK");
    assert.strictEqual(yield* recover(Effect.succeed(success)), success);
    assert.strictEqual(logPrefixCalls, 0);
    assert.strictEqual(fallbackCalls, 0);

    const recoveredFailure = recover(requireData(Option.none<Response>(), "page titles"));
    const firstFallback = yield* recoveredFailure;
    const secondFallback = yield* recoveredFailure;
    assert.strictEqual(firstFallback.status, 503);
    assert.notStrictEqual(firstFallback, secondFallback);
    assert.strictEqual(logPrefixCalls, 2);
    assert.strictEqual(fallbackCalls, 2);
  })
);
