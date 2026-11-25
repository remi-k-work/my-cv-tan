// Conditional GET support for public machine-readable documents. Hashing the representation lets
// crawlers revalidate unchanged content without downloading it again.

// services, features, and other libraries
import { Array, Context, Effect, flow, Layer, Option, String, pipe } from "effect";

// constants
import { NO_STORE } from "@/domain/http";

const encoder = new TextEncoder();

const sha256 = Effect.fnUntraced(function* (body: string) {
  const digest = yield* Effect.promise(() => crypto.subtle.digest("SHA-256", encoder.encode(body)));
  return pipe(
    Array.fromIterable(new Uint8Array(digest)),
    Array.map((byte) => pipe(byte.toString(16), String.padStart(2, "0"))),
    Array.join("")
  );
});

// If-None-Match uses weak comparison, so a client may return our strong validator as W/"..."
const matchesValidator = (header: string | null, etag: string) =>
  pipe(
    Option.fromNullishOr(header),
    Option.map((value) =>
      pipe(
        String.split(value, ","),
        Array.map(String.trim),
        Array.some((candidate) => candidate === "*" || pipe(candidate, String.replace(/^W\//, "")) === etag)
      )
    ),
    Option.getOrElse(() => false)
  );

const withEtag = (response: Response, etag: string) => {
  const headers = new Headers(response.headers);
  headers.set("ETag", etag);
  return headers;
};

const forbidsCaching = (response: Response) =>
  pipe(
    Option.fromNullishOr(response.headers.get("Cache-Control")),
    Option.map(flow(String.toLowerCase, String.includes(NO_STORE))),
    Option.getOrElse(() => false)
  );

export class EntityTags extends Context.Service<
  EntityTags,
  {
    readonly apply: (request: Request, response: Response) => Effect.Effect<Response>;
  }
>()("my-cv-v4-tan/lib/EntityTags") {
  static readonly layer = Layer.succeed(
    EntityTags,
    EntityTags.of({
      apply: Effect.fn("EntityTags.apply")(function* (request: Request, response: Response) {
        // Uncacheable responses must not acquire validators or turn into a cacheable-looking 304
        if (response.status !== 200 || forbidsCaching(response) || (request.method !== "GET" && request.method !== "HEAD")) return response;

        // Clone before reading so the original representation remains available for a 200 response
        const body = yield* Effect.promise(() => response.clone().text());
        const etag = `"${yield* sha256(body)}"`;
        const headers = withEtag(response, etag);

        if (matchesValidator(request.headers.get("If-None-Match"), etag)) {
          return new Response(null, { status: 304, statusText: "Not Modified", headers });
        }

        return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
      }),
    })
  );
}
