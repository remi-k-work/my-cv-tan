// --- The twin pipeline ---
//
// Every machine-readable document runs the same steps: pin the language, inject the translate,
// render, recover data failures into a non-cacheable 503, and pin the cache variant when ?lang= made
// the response independent of the session. One pipeline means none of the steps can be forgotten by
// a new endpoint.

// tanstack
import { removeResponseHeader } from "@tanstack/react-start/server";

// services, features, and other libraries
import { Effect, Option } from "effect";
import { translateForLanguage } from "@/lib/gt-translations";
import { requestPreferredLanguage } from "@/features/data/domain/helpers";
import { recoverDataFailure } from "@/features/data/domain/required";
import { discoveryResponse, mdUnavailableResponse } from "@/features/meta/domain/response";
import { unavailableMarkdownBody } from "@/features/markdown/domain/blocks";
import { parseLangParam } from "./request";
import { translateSource } from "./text";

// types
import type { PreferredLanguage, Translate } from "@/domain/models";
import type { LocalizedMdInput } from "./models";
import type { RequiredDataError } from "@/features/data/domain/required";

// A document renderer, before the pipeline is applied. Every renderer reads already-bound dataset
// accessors, so a document body never carries a service requirement of its own.
//
// The context is the shared LocalizedMdInput: the pipeline's own context and the builders' input
// are one type instead of two spellings of `{ preferredLanguage, translate }`.
export type MachineDocumentBody = (request: Request, context: LocalizedMdInput) => Effect.Effect<Response, RequiredDataError>;

// A finished document endpoint: language, translation and failure recovery have all been applied by
// `documentResponse`, so a caller hands it a request and gets a Response with nothing left to satisfy.
//
// Named apart from the DOM's own `Document` — which is in scope in every file that also imports
// `Response` — so a reader never has to ask which of the two a signature means.
export type MachineDocument = (request: Request) => Effect.Effect<Response, never>;

// An explicit ?lang= pins the cache variant: the response no longer depends on the locale cookie,
// so drop Vary and the GT set-cookie to keep it shared-cacheable at the CDN.
//
// A new header record is built rather than mutating a Headers copy: the original Response is never
// edited underneath a caller, and no header object is mutated after creation. removeResponseHeader is
// a TanStack side effect recorded against the returned response; it runs alongside the Vary drop,
// before the new Response is minted from the rebuilt headers.
const pinCacheVariant = (response: Response): Response => {
  const headers: Record<string, string> = {};
  for (const [key, value] of response.headers.entries()) {
    if (key.toLowerCase() !== "vary") headers[key] = value;
  }
  removeResponseHeader("set-cookie");

  return discoveryResponse(response.body, headers, {
    status: response.status,
    statusText: response.statusText,
  });
};

// A failed dictionary load must not 500 a machine-readable endpoint: log it and render source-language
// copy, the same fallback the dictionary itself applies per missing key.
//
// `Effect.fnUntraced` keeps this out of traces — it is not a useful tracing boundary, and the
// pipeline owns the single span that matters. The dictionary failure is caught inside the generator
// so the function never fails, matching `Effect.fn.Return<Translate>`'s error-free contract.
export const translateFor = Effect.fnUntraced(function* (preferredLanguage: PreferredLanguage): Effect.fn.Return<Translate> {
  return yield* Effect.tryPromise(() => translateForLanguage(preferredLanguage)).pipe(
    Effect.catch((error) => Effect.logError(`[MARKDOWN]: translation snapshot unavailable for "${preferredLanguage}"`, error).pipe(Effect.as(translateSource)))
  );
});

// Language, translation and recovery are requirements of every twin, so they are provided once here
// instead of being repeated in each route handler's layer. `Effect.fnUntraced` keeps the pipeline
// itself out of the traces — it is the boundary a tracing tool already sees.
export const documentResponse = (render: MachineDocumentBody): MachineDocument =>
  Effect.fnUntraced(function* (request: Request) {
    // ?lang= overrides request-level Accept-Language and the GT locale cookie, so a crawler can pin
    // each language variant without relying on the visitor's negotiated session.
    const langOverride = parseLangParam(request.url);
    const preferredLanguage = requestPreferredLanguage(langOverride);
    const translate = yield* translateFor(preferredLanguage);

    const document = render(request, { preferredLanguage, translate });

    // Twin pipeline recovery: a data failure logs, then answers with the non-cacheable 503 that keeps
    // incomplete content out of both the cache and the index. Documents are requirement-free here, so
    // the recovered effect leaves nothing for the caller to satisfy.
    const response = yield* document.pipe(recoverDataFailure("[MARKDOWN]", () => mdUnavailableResponse(unavailableMarkdownBody(translate), preferredLanguage)));

    // A pinned language already decided the variant, so the cache key no longer needs the session.
    return yield* Option.match(langOverride, {
      onNone: () => Effect.succeed(response),
      onSome: () => Effect.sync(() => pinCacheVariant(response)),
    });
  });
