// --- The Markdown service ---
//
// One home for every AI-facing document pipeline (GEO): a table of finished documents, each naming
// the page it serves, the data it indexes, and the pure builder that renders it. Datasets are pinned
// to the language the request pipeline resolves through the shared `Datasets` service, so no entry
// re-negotiates a language of its own.
//
// The page twins are routed straight from their catalogue declarations: the same declarations
// llms.txt advertises and llms-full.txt concatenates, so serving a route and publishing it in an
// index are one edit instead of two tables that have to agree.
//
// Traced: the layer construction names its span so the service boundary appears in traces.

// services, features, and other libraries
import { Context, Effect, Layer } from "effect";
import { Datasets } from "@/features/meta/services/datasets";
import { DEFAULT_LANGUAGE } from "@/features/meta/domain/constants";
import { buildLlmsFullTxt } from "@/features/markdown/domain/full-content";
import { buildLlmsTxt } from "@/features/markdown/domain/site-index";
import { CONTACT_TWIN, EDUCATION_TWIN, HOME_TWIN } from "@/features/markdown/domain/catalogue";
import { discoveryDocument, experienceTwin, pageTwinDocument } from "./documents";

// types
import type { MachineDocument } from "@/features/markdown/domain/twin";

// The finished-document table every machine-readable route reads. Named as an interface rather than
// inferred from the `make` body, so the contract is readable at the top of the file instead of by
// reconstructing it from a projection of the dataset binding.
export interface MarkdownService {
  // Request-aware twins, language-negotiated from the URL.
  readonly home: MachineDocument;
  readonly education: MachineDocument;
  readonly contact: MachineDocument;
  // Detail twin: resolves the slug against the localized list, in the request's language.
  readonly experience: MachineDocument;
  // The English-only GEO indexes: no language negotiation and no translate injection.
  readonly siteIndex: MachineDocument;
  readonly siteIndexFull: MachineDocument;
}

export class Markdown extends Context.Service<Markdown, MarkdownService>()("Markdown", {
  make: Effect.fn("Markdown.make")(function* () {
    const datasets = yield* Datasets;
    return {
      home: pageTwinDocument(HOME_TWIN, datasets),
      education: pageTwinDocument(EDUCATION_TWIN, datasets),
      contact: pageTwinDocument(CONTACT_TWIN, datasets),
      experience: experienceTwin(datasets.experienceList),
      // Each entry is a thunk of its document effect, so the dataset lookups run per request instead
      // of once when the layer is built.
      //
      // The two indexes are English-only, so both pin DEFAULT_LANGUAGE explicitly rather than
      // inheriting a negotiated one: an index must describe the same documents on every request, or
      // a crawler caching one variant learns a different retrieval surface from the next.
      //
      // llms-full.txt needs all three assets, so it fans out once around a named record: Record form
      // means each value names the dataset it resolves, so the body reads the values it renders
      // instead of a `[titles, list, schools]` tuple whose order is only correct while the three
      // lookups stay in step. Sequential by default, because the assets are decoded once when the
      // Data layer is built and read as in-memory lookups.
      siteIndex: discoveryDocument(
        "llms.txt",
        () => datasets.experienceList(DEFAULT_LANGUAGE).pipe(Effect.map(buildLlmsTxt)),
        "/llms.txt"
      ),
      siteIndexFull: discoveryDocument(
        "llms-full.txt",
        () =>
          Effect.all({
            pageTitles: datasets.pageTitles(DEFAULT_LANGUAGE),
            experienceList: datasets.experienceList(DEFAULT_LANGUAGE),
            educationList: datasets.educationList(DEFAULT_LANGUAGE),
          }).pipe(Effect.map(buildLlmsFullTxt)),
        "/llms-full.txt"
      ),
    };
  }),
}) {
  // The datasets are resolved once, inside this layer, so the returned documents stay requirement-free
  // and no route handler has to provide the portfolio assets itself.
  static readonly layer = Layer.effect(this, this.make()).pipe(Layer.provide(Datasets.layer));
}
