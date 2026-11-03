// Markdown service providing finished pipelines for twins and AI discovery indexes.
import { Context, Effect, Layer } from "effect";
import { Datasets } from "@/features/meta/services/datasets";
import { DEFAULT_LANGUAGE } from "@/features/meta/domain/constants";
import { LLMS_FULL_TXT_INDEX, LLMS_TXT_INDEX } from "@/features/meta/domain/links";
import { buildLlmsFullTxt } from "@/features/markdown/domain/full-content";
import { buildLlmsTxt } from "@/features/markdown/domain/site-index";
import { CONTACT_TWIN, EDUCATION_TWIN, HOME_TWIN } from "@/features/markdown/domain/catalogue";
import { discoveryDocument, experienceTwin, pageTwinDocument } from "./documents";

// types
import type { MachineDocument } from "@/features/markdown/domain/twin";

// Service contract for route handlers serving machine-readable endpoints.
interface MarkdownService {
  readonly home: MachineDocument;
  readonly education: MachineDocument;
  readonly contact: MachineDocument;
  readonly experience: MachineDocument;
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
      // AI discovery indexes describe fixed English documents resolved per request.
      siteIndex: discoveryDocument(LLMS_TXT_INDEX, () => datasets.experienceList(DEFAULT_LANGUAGE).pipe(Effect.map(buildLlmsTxt))),
      siteIndexFull: discoveryDocument(LLMS_FULL_TXT_INDEX, () =>
        Effect.all({
          pageTitles: datasets.pageTitles(DEFAULT_LANGUAGE),
          experienceList: datasets.experienceList(DEFAULT_LANGUAGE),
          educationList: datasets.educationList(DEFAULT_LANGUAGE),
        }).pipe(Effect.map(buildLlmsFullTxt))
      ),
    };
  }),
}) {
  // Layer resolves dataset dependencies internally so endpoints remain requirement-free.
  static readonly layer = Layer.effect(this, this.make()).pipe(Layer.provide(Datasets.layer));
}
