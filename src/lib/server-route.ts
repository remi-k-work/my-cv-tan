// The plumbing every machine-readable document route shares: run its Effect pipeline on the server
// runtime, then strip the visitor state a shared cache would otherwise pin to a public document
// Kept out of both features so the server runtime is entered in exactly one place

// tanstack
import { removeResponseHeader } from "@tanstack/react-start/server";

// services, features, and other libraries
import { Effect } from "effect";
import { RuntimeServer } from "./runtime-server";

// types
import type { ServerServices } from "./runtime-server";

// A document route: TanStack hands it the request, it answers with a finished response
type DocumentRoute = {
  (event: { readonly request: Request }): Promise<Response>;
  // `removeResponseHeader` only has an effect inside the framework's response context, so this
  // decision is the observable half of the contract a direct handler call can inspect
  readonly keepsVisitorState: (request: Request) => boolean;
};

// Server routes can inherit Set-Cookie from request middleware even when their content is public
// and independent of the visitor; direct handler tests have no Start response context
const removeSetCookieHeader = () => {
  try {
    removeResponseHeader("set-cookie");
  } catch {
    // A direct handler call has no Start response context to update
  }
};

// Most machine-readable documents are public and visitor-independent, so stripping is the default
export const documentRoute = (
  document: (request: Request) => Effect.Effect<Response, never, ServerServices>,
  keepsVisitorState: (request: Request) => boolean = () => false
): DocumentRoute =>
  Object.assign(
    async ({ request }: { request: Request }) => {
      try {
        return await RuntimeServer.runPromise(document(request));
      } finally {
        if (!keepsVisitorState(request)) removeSetCookieHeader();
      }
    },
    { keepsVisitorState }
  );
