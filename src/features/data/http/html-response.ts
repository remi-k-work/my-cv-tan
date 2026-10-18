// services, features, and other libraries
import { Schema } from "effect";
import { RequiredDataError } from "@/features/data/domain/required";

// constants
import { NOINDEX_FOLLOW, NO_STORE } from "@/features/meta/domain/constants";

const unavailableHtmlRequests = new WeakSet<Request>();

export const markHtmlDataUnavailable = (request: Request, error: unknown) => {
  if (Schema.is(RequiredDataError)(error)) unavailableHtmlRequests.add(request);
};

export const applyHtmlDataUnavailableResponse = (request: Request, response: Response) => {
  if (!unavailableHtmlRequests.has(request) || !response.headers.get("content-type")?.includes("text/html")) return response;

  unavailableHtmlRequests.delete(request);
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", NO_STORE);
  headers.set("X-Robots-Tag", NOINDEX_FOLLOW);

  return new Response(response.body, { status: 503, statusText: "Service Unavailable", headers });
};
