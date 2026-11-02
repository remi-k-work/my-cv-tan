// The shared vocabulary of a twin: the resolved language plus its translate injection. This is also
// the twin pipeline's render context (see twin.ts), so the two are one type instead of two spellings
// of the same pair. The catalogue pins it to English for the full-content companion (see catalogue.ts).
//
// `translate` is injected so the pure builders stay testable; the service decides where translations
// come from.

// types
import type { Option } from "effect";
import type { PageTitles, PreferredLanguage, Translate } from "@/domain/models";
import type { Experience, ExperienceList } from "@/features/experience/domain/models";
import type { EducationList } from "@/features/education/domain/models";

export interface LocalizedMdInput {
  readonly preferredLanguage: PreferredLanguage;
  readonly translate: Translate;
}

// Static-page twins read the same stable page copy the HTML head resolves from, beside the one
// dataset each renders: a twin declares exactly what it reads, so an unrelated asset failing cannot
// turn it into a 503.
export type HomeMdInput = LocalizedMdInput & {
  readonly pageTitles: PageTitles;
  readonly experienceList: ExperienceList;
};

export type EducationMdInput = LocalizedMdInput & {
  readonly pageTitles: PageTitles;
  readonly educationList: EducationList;
};

export type ContactMdInput = LocalizedMdInput & { readonly pageTitles: PageTitles };

export type ExperienceMdInput = LocalizedMdInput & { readonly experience: Experience };

// None when the URL carried no decodable slug: the not-found twin then says so instead of quoting a
// fabricated identifier (see buildNotFoundMd). An AI citation must never read back an identifier
// that was never requested.
export type BuildNotFoundMdInput = LocalizedMdInput & { readonly slug: Option.Option<string> };

// Which URL one experience entry leads with. `twin` is the Markdown sibling a document navigates
// to; `canonical` is the clean HTML page an AI index cites from, with the twin stated beside it —
// the same two spellings the Pages section prints.
export type ExperienceEntryLink = "twin" | "canonical";

// One experience section in an AI index. Extends LocalizedMdInput, so translate and language are
// required: the English-only indexes pass the source copy explicitly (see catalogue.ts) instead of
// the builder silently defaulting, and every caller names the language it renders.
export type ExperienceLinesInput = LocalizedMdInput & {
  readonly experienceList: ExperienceList;
  readonly type: Experience["type"];
  readonly entry: ExperienceEntryLink;
};
