// services, features, and other libraries
import { Config, Context, Effect, flow, Layer, Schedule, Schema } from "effect";
import { FetchHttpClient, HttpClient, HttpClientRequest } from "effect/http";
import { SendError } from "@/domain";
import { SendRequest } from "@/features/contact-me/domain";

// types
import type { Name, Email, Message, Subject } from "@/features/contact-me/domain";

export class Send extends Context.Service<Send>()("Send", {
  make: Effect.gen(function* () {
    const user_id = yield* Config.Redacted("EMAILJS_PUB_KEY");
    const accessToken = yield* Config.Redacted("EMAILJS_PRI_KEY");

    // Configure common client settings, base URL, auth, and retry policies
    const client = (yield* HttpClient.HttpClient).pipe(
      HttpClient.mapRequest(flow(HttpClientRequest.prependUrl("https://api.emailjs.com/api/v1.0"), HttpClientRequest.acceptJson)),
      HttpClient.filterStatusOk,
      HttpClient.retryTransient({ schedule: Schedule.exponential(100), times: 3 })
    );

    // Send the contact form with validated data
    const send = Effect.fn("send")(
      function* (name: Name, email: Email, subject: Subject, message: Message) {
        // Execute request
        const sendRequest = SendRequest.make({ user_id, accessToken, template_params: { name, email, subject, message } as const });
        yield* HttpClientRequest.post("/email/send").pipe(
          HttpClientRequest.bodyJsonUnsafe(yield* Schema.encodeEffect(SendRequest)(sendRequest)),
          client.execute,
          // Surface upstream status + body (e.g. rate-limit details) instead of burying them in `cause`
          Effect.catchTag("HttpClientError", (clientError) => {
            const response = clientError.response;
            if (response === undefined) return Effect.fail(new SendError({ cause: clientError }));
            return response.text.pipe(
              Effect.orElseSucceed(() => "<unreadable body>"),
              Effect.flatMap((responseBody) => Effect.fail(new SendError({ cause: clientError, status: response.status, responseBody })))
            );
          })
        );
      },
      Effect.mapError((cause) => (Schema.is(SendError)(cause) ? cause : new SendError({ cause })))
    );

    return { send } as const;
  }),
}) {
  static readonly layer = Layer.effect(this, this.make).pipe(Layer.provide(FetchHttpClient.layer));
}
