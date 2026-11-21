// services, features, and other libraries
import { assert, it } from "@effect/vitest";
import { Effect } from "effect";
import { clientLoader } from "../shared";

it("abandoning a client loader interrupts its in-flight Effect", async () => {
  const abortController = new AbortController();
  let markStarted!: () => void;
  const started = new Promise<void>((resolve) => {
    markStarted = resolve;
  });
  let finalized = false;

  const pending = clientLoader(
    () =>
      Effect.sync(markStarted).pipe(
        Effect.andThen(Effect.never),
        Effect.ensuring(Effect.sync(() => {
          finalized = true;
        }))
      ),
    abortController.signal
  );

  await started;
  abortController.abort();

  const rejected = await pending.then(
    () => false,
    () => true
  );
  assert.isTrue(rejected);
  assert.isTrue(finalized);
});
