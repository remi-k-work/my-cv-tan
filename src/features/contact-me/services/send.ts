// services, features, and other libraries
import { Config, Context, Effect, flow, Layer, Schedule } from "effect";
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
      HttpClient.retryTransient({ retryOn: "errors-only", schedule: Schedule.exponential(100), times: 3 })
    );

    // Send the contact form with validated data
    const send = Effect.fnUntraced(function* (name: Name, email: Email, subject: Subject, message: Message) {
      // schemaBodyJson encodes before setting the body: constructor defaults apply and Redacted fields serialize to their plain values
      const request = yield* HttpClientRequest.post("/email/send").pipe(
        HttpClientRequest.schemaBodyJson(SendRequest)(SendRequest.make({ user_id, accessToken, template_params: { name, email, subject, message } })),
        Effect.mapError((cause) => new SendError({ cause }))
      );
      yield* client.execute(request).pipe(
        // Surface upstream status + body (e.g. rate-limit details) instead of burying them in `cause`
        Effect.catchTag("HttpClientError", (clientError) =>
          Effect.gen(function* () {
            const response = clientError.response;
            if (response === undefined) return yield* new SendError({ cause: clientError });

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
