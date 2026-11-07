// services, features, and other libraries
import { Predicate } from "effect";

// constants
import { NOINDEX_FOLLOW, NO_STORE, RETRY_AFTER } from "@/domain/http";

const unavailableHtmlRequests = new WeakSet<Request>();

// Only the tag decides the outcome here, so a plain tag check is enough: a full
// Schema.is would validate a payload none of the callers ever read
export const markHtmlDataUnavailable = (request: Request, error: unknown) => {
  if (Predicate.isTagged("RequiredDataError")(error)) unavailableHtmlRequests.add(request);
};

export const applyHtmlDataUnavailableResponse = (request: Request, response: Response) => {
  if (!unavailableHtmlRequests.has(request) || !response.headers.get("content-type")?.includes("text/html")) return response;

  unavailableHtmlRequests.delete(request);
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", NO_STORE);
  headers.set("X-Robots-Tag", NOINDEX_FOLLOW);
  // The downgrade is a temporary data-layer outage, not a missing page, so the rendered error page
  // tells the crawler when to retry rather than leaving it to guess.
  headers.set("Retry-After", RETRY_AFTER);

  return new Response(response.body, { status: 503, statusText: "Service Unavailable", headers });
};
