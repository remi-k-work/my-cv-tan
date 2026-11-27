// types
import type { Effect, Option } from "effect";
import type { PageHighlights, PageTitles } from "@/domain/models";
import type { ExperienceList } from "@/features/experience/domain/models";
import type { EducationList } from "@/features/education/domain/models";

// The localized datasets every page loader reads, as ready-to-run Effects.
// The server binds the Data service to the request's language (see
// shared.server.ts); the browser gets the data RPC client's requests, which
// resolve the language the same way on the server side of the RPC
export interface PageData<E = never> {
  readonly randomPageHighlights: Effect.Effect<Option.Option<PageHighlights>, E>;
  readonly stablePageTitles: Effect.Effect<Option.Option<PageTitles>, E>;
  readonly experienceList: Effect.Effect<Option.Option<ExperienceList>, E>;
  readonly educationList: Effect.Effect<Option.Option<EducationList>, E>;
}
