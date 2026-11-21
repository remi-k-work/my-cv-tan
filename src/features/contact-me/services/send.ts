// services, features, and other libraries
import { Config, Context, Effect, flow, Layer, Schedule } from "effect";
import { FetchHttpClient, HttpClient, HttpClientRequest } from "effect/http";
import { SendError } from "@/domain/errors";
import { SendRequest } from "@/features/contact-me/domain/models";

// types
import type { Name, Email, Message, Subject } from "@/features/contact-me/domain/models";

export class Send extends Context.Service<Send>()("my-cv-v4-tan/features/contact-me/services/Send", {
  make: Effect.gen(function* () {
    const user_id = yield* Config.Redacted("EMAILJS_PUB_KEY");
    const accessToken = yield* Config.Redacted("EMAILJS_PRI_KEY");

    // Configure common client settings, base URL, auth, and retry policies
    const client = (yield* HttpClient.HttpClient).pipe(
      HttpClient.mapRequest(flow(HttpClientRequest.prependUrl("https://api.emailjs.com/api/v1.0"), HttpClientRequest.acceptJson)),
      // Retry only explicit transient responses; a transport failure is ambiguous — EmailJS may
      // already have accepted the message — so repeating it could deliver duplicate email
      HttpClient.retryTransient({
        retryOn: "response-only",
        // Jittered so clients that share a rate-limit response do not all retry on the same beat
        schedule: Schedule.jittered(Schedule.exponential("100 millis")),
        times: 3,
      }),
      // Convert the final non-OK response to a typed error after the response retries are exhausted
      HttpClient.filterStatusOk
    );

    // Send the contact form with validated data
    const send = Effect.fnUntraced(function* (name: Name, email: Email, subject: Subject, message: Message) {
      // schemaBodyJson encodes before setting the body: constructor defaults apply and Redacted fields serialize to their plain values
      const request = yield* HttpClientRequest.schemaBodyJson(SendRequest)(
        HttpClientRequest.post("/email/send"),
        SendRequest.make({ user_id, accessToken, template_params: { name, email, subject, message } })
      ).pipe(Effect.mapError((error) => new SendError({ cause: error })));

      yield* client.execute(request).pipe(
        Effect.catchTag("HttpClientError", (clientError) =>
          Effect.gen(function* () {
            const response = clientError.response;
            // A transport failure has no response to enrich the error with
            if (response === undefined) return yield* new SendError({ cause: clientError });

            // Preserve upstream diagnostics such as rate-limit details alongside the client error
            const responseBody = yield* response.text.pipe(Effect.orElseSucceed(() => "<unreadable body>"));
            return yield* new SendError({ cause: clientError, status: response.status, responseBody });
          })
        )
      );
    });

    return { send } as const;
  }),
}) {
  static readonly layer = Layer.effect(this, this.make).pipe(Layer.provide(FetchHttpClient.layer));
}
