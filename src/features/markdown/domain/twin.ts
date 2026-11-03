// Markdown twin response pipeline: language negotiation, translation injection, and 503 error recovery.

// services, features, and other libraries
import { removeResponseHeader } from "@tanstack/react-start/server";
import { Effect, Option } from "effect";
import { translateForLanguage } from "@/lib/gt-translations";
import { requestPreferredLanguage } from "@/features/data/domain/helpers";
import { recoverDataFailure, type RequiredDataError } from "@/features/data/domain/required";
import { mdUnavailableResponse } from "@/features/meta/domain/response";
import { unavailableMarkdownBody } from "@/features/markdown/domain/blocks";
import { parseLangParam } from "./request";
import { translateSource } from "./text";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { LocalizedMdInput } from "./models";

type MachineDocumentBody = (request: Request, context: LocalizedMdInput) => Effect.Effect<Response, RequiredDataError>;
export type MachineDocument = (request: Request) => Effect.Effect<Response, never>;

// Drops session cookies and Vary headers when ?lang= explicitly pins the response language for CDN caching.
const pinCacheVariant = (response: Response): Response => {
  const headers = new Headers(response.headers);
  headers.delete("vary");
  removeResponseHeader("set-cookie");

  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};

// Loads translations for language, falling back to source strings on failure.
const translateFor = (preferredLanguage: PreferredLanguage) =>
  Effect.tryPromise(() => translateForLanguage(preferredLanguage)).pipe(
    Effect.catch((error) => Effect.logError(`[MARKDOWN]: translation snapshot unavailable for "${preferredLanguage}"`, error).pipe(Effect.as(translateSource)))
  );

// Wraps a markdown document renderer with language resolution, translation, recovery, and caching.
export const documentResponse = (render: MachineDocumentBody): MachineDocument =>
  Effect.fnUntraced(function* (request: Request) {
    const langOverride = parseLangParam(request.url);
    const preferredLanguage = requestPreferredLanguage(langOverride);
    const translate = yield* translateFor(preferredLanguage);

    const response = yield* render(request, { preferredLanguage, translate }).pipe(
      recoverDataFailure("[MARKDOWN]", () => mdUnavailableResponse(unavailableMarkdownBody(translate), preferredLanguage))
    );

    return Option.isSome(langOverride) ? pinCacheVariant(response) : response;
  });
