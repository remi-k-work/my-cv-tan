// The plumbing every machine-readable document route shares: run its Effect pipeline on the server
// runtime, then strip the visitor state a shared cache would otherwise pin to a public document.
// Kept out of both features so the server runtime is entered in exactly one place.

// services, features, and other libraries
import { Effect } from "effect";
import { RuntimeServer } from "./runtime-server";
import { removeSetCookieHeader } from "./server-response-headers";

// types
import type { ServerServices } from "./runtime-server";

// A document route: TanStack hands it the request, it answers with a finished response.
export type DocumentRoute = {
  (event: { readonly request: Request }): Promise<Response>;
  // `removeResponseHeader` only has an effect inside the framework's response context, so this
  // decision is the observable half of the contract a direct handler call can inspect.
  readonly keepsVisitorState: (request: Request) => boolean;
};

// Most machine-readable documents are public and visitor-independent, so stripping is the default.
export const documentRoute = (
  document: (request: Request) => Effect.Effect<Response, never, ServerServices>,
  keepsVisitorState: (request: Request) => boolean = () => false
): DocumentRoute =>
  Object.assign(async ({ request }: { request: Request }) => {
    try {
      return await RuntimeServer.runPromise(document(request));
    } finally {
      if (!keepsVisitorState(request)) removeSetCookieHeader();
    }
  }, { keepsVisitorState });
