// services, features, and other libraries
import { Config, Context, Effect, flow, Layer, Option, Schedule } from "effect";
import { FetchHttpClient, HttpClient, HttpClientRequest } from "effect/http";
import { SendError } from "@/domain/errors";
import { SendRequest } from "@/features/contact-me/domain/models";

// types
import type { Name, Email, Message, Subject } from "@/features/contact-me/domain/models";

export class Send extends Context.Service<Send>()("Send", {
  make: Effect.gen(function* () {
    const user_id = yield* Config.Redacted("EMAILJS_PUB_KEY");
    const accessToken = yield* Config.Redacted("EMAILJS_PRI_KEY");

    // Configure common client settings, base URL, auth, and retry policies
    const client = (yield* HttpClient.HttpClient).pipe(
      HttpClient.mapRequest(flow(HttpClientRequest.prependUrl("https://api.emailjs.com/api/v1.0"), HttpClientRequest.acceptJson)),
      HttpClient.filterStatusOk,
      HttpClient.retryTransient({
        retryOn: "errors-only",
        // Jittered so clients that share a rate-limit response do not all retry on the same beat
        schedule: Schedule.jittered(Schedule.exponential("100 millis")),
        times: 3,
      })
    );

    // Send the contact form with validated data
    const send = Effect.fnUntraced(function* (name: Name, email: Email, subject: Subject, message: Message) {
      // schemaBodyJson encodes before setting the body: constructor defaults apply and Redacted fields serialize to their plain values
      const request = yield* HttpClientRequest.post("/email/send").pipe(
        HttpClientRequest.schemaBodyJson(SendRequest)(SendRequest.make({ user_id, accessToken, template_params: { name, email, subject, message } })),
        Effect.mapError((error) => new SendError({ cause: error }))
      );

      yield* Effect.catchTag(client.execute(request), "HttpClientError", (clientError) =>
        // Surface upstream status + body (e.g. rate-limit details) instead of burying them in `cause`;
        // a response the failure did not produce leaves the raw error as the only cause
        Option.match(Option.fromNullishOr(clientError.response), {
          onNone: () => Effect.fail(new SendError({ cause: clientError })),
          // `flatMap` into a second `fail`, not `map` into an error value: the enriched SendError is
          // the failure, and mapping it into the success channel would answer the caller with the
          // error as a value — a rejected send that looks like a delivered one
          onSome: (response) =>
            Effect.flatMap(response.text.pipe(Effect.orElseSucceed(() => "<unreadable body>")), (responseBody) =>
              Effect.fail(new SendError({ cause: clientError, status: response.status, responseBody }))
            ),
        })
      );
    });

    return { send } as const;
  }),
}) {
  static readonly layer = Layer.effect(this, this.make).pipe(Layer.provide(FetchHttpClient.layer));
}
