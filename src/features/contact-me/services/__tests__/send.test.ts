// services, features, and other libraries
// `live`, not `effect`: the client retries a transient failure on a real (jittered) schedule, and
// the default test clock never advances it
import { assert, it } from "@effect/vitest";
import { Cause, ConfigProvider, Effect, Exit, Layer, Option, pipe } from "effect";
import { FetchHttpClient } from "effect/http";
import { Send } from "../send";

// types
import type { SendError } from "@/domain/errors";

// constants
// The EmailJS credentials the service reads when it boots; supplied from a record so the test
// never depends on the ambient environment (or on a missing one being configured)
const CREDENTIALS = ConfigProvider.layer(ConfigProvider.fromEnvRecord({ EMAILJS_PUB_KEY: "public-key", EMAILJS_PRI_KEY: "private-key" }));

// One contact-form submission, with the fields the schema accepts
const NAME = "Remi";
const EMAIL = "remi@example.dev";
const SUBJECT = "Project inquiry";
const MESSAGE = "Hello there, I would like to talk about a project.";

// Runs one submission against a stubbed fetch and returns it as an Exit, so a caller can tell a
// failed send apart from a delivered one — the whole distinction under test
const sendWith = (fetch: typeof globalThis.fetch) =>
  pipe(
    Effect.flatMap(Send, ({ send }) => Effect.exit(send(NAME, EMAIL, SUBJECT, MESSAGE))),
    // The credentials are provided into the layer, and the stubbed fetch through the reference the
    // fetch client reads per request, so no layer surgery is needed
    Effect.provide(Send.layer.pipe(Layer.provide(CREDENTIALS))),
    Effect.provideService(FetchHttpClient.Fetch, fetch)
  );

// The typed failure a send carries, or None when it delivered — reading it one way in each case
// keeps the assertion about success-vs-failure in one place
const failureOf = (exit: Exit.Exit<void, SendError>): Option.Option<SendError> =>
  Exit.isSuccess(exit) ? Option.none<SendError>() : Cause.findErrorOption(exit.cause);

it.live("an upstream rejection fails the send and carries the upstream status and body", () =>
  Effect.gen(function* () {
    // A rate limit is the case the enriched SendError exists for: EmailJS answered, and its
    // status and body are the only diagnostics that explain why
    const rejected: typeof globalThis.fetch = async () => new Response("EmailJS rejected the message", { status: 429 });

    const failure = failureOf(yield* sendWith(rejected));

    if (Option.isNone(failure)) return assert.fail("an upstream rejection must fail the send, not report success");

    // The upstream status and body are the diagnostic, so the wrapping must keep them
    assert.strictEqual(failure.value._tag, "SendError");
    assert.strictEqual(failure.value.status, 429);
    assert.strictEqual(failure.value.responseBody, "EmailJS rejected the message");
  })
);

it.live("a transport failure leaves the raw client error as the only cause", () =>
  Effect.gen(function* () {
    // No response ever arrived, so there is no status or body to report
    const offline: typeof globalThis.fetch = async () => {
      throw new Error("offline");
    };

    const failure = failureOf(yield* sendWith(offline));

    if (Option.isNone(failure)) return assert.fail("a transport failure must fail the send");

    assert.strictEqual(failure.value._tag, "SendError");
    assert.isUndefined(failure.value.status);
    assert.isUndefined(failure.value.responseBody);
  })
);

it.live("an accepted upstream request resolves", () =>
  Effect.gen(function* () {
    const accepted: typeof globalThis.fetch = async () => new Response("OK", { status: 200 });

    assert.isTrue(Exit.isSuccess(yield* sendWith(accepted)));
  })
);
