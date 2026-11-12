// services, features, and other libraries
import { Option, Predicate, pipe } from "effect";

// constants
import { NOINDEX_FOLLOW, NO_STORE, RETRY_AFTER } from "@/domain/http";

const unavailableHtmlRequests = new WeakSet<Request>();

// Only the tag decides the outcome here, so a plain tag check is enough: a full
// Schema.is would validate a payload none of the callers ever read
export const markHtmlDataUnavailable = (request: Request, error: unknown) => {
  if (Predicate.isTagged("RequiredDataError")(error)) unavailableHtmlRequests.add(request);
};

export const applyHtmlDataUnavailableResponse = (request: Request, response: Response) => {
  // Consume the mark on read: it stands for one failed loader run, so it must not outlive the
  // response it was raised for — a later response for the same Request is a fresh, healthy one,
  // and a mark left in place would downgrade that one too
  const marked = unavailableHtmlRequests.delete(request);
  if (!marked) return response;

  // Only an HTML document carries the rendered error page the downgrade describes; a JSON or asset
  // answer for the same request is unaffected, so the header read decides like the mark does
  const isHtml = pipe(
    Option.fromNullishOr(response.headers.get("content-type")),
    Option.exists((contentType) => contentType.includes("text/html"))
  );
  if (!isHtml) return response;

  const headers = new Headers(response.headers);
  headers.set("Cache-Control", NO_STORE);
  headers.set("X-Robots-Tag", NOINDEX_FOLLOW);
  // The downgrade is a temporary data-layer outage, not a missing page, so the rendered error page
  // tells the crawler when to retry rather than leaving it to guess.
  headers.set("Retry-After", RETRY_AFTER);

  return new Response(response.body, { status: 503, statusText: "Service Unavailable", headers });
};
