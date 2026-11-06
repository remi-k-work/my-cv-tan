// Resolve exactly the dataset bundle each static Markdown twin declares.

// services, features, and other libraries
import { Effect } from "effect";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { ContactTwinData, EducationTwinData, HomeTwinData } from "../domain/models";
import type { DatasetsService } from "@/features/data/services/datasets";
import type { RequiredDataError } from "@/features/data/domain/required";

export type TwinDataResolver<Data> = (datasets: DatasetsService, preferredLanguage: PreferredLanguage) => Effect.Effect<Data, RequiredDataError>;

// Each twin's bundle is resolved in one concurrent pass, so a document never waits on a second
// round trip for data a single render needs. The contact twin's body reads no portfolio dataset,
// so its resolver maps the titles it does read into that one-field bundle.
export const resolveHomeTwinData: TwinDataResolver<HomeTwinData> = (datasets, preferredLanguage) =>
  Effect.all({ pageTitles: datasets.pageTitles(preferredLanguage), experienceList: datasets.experienceList(preferredLanguage) }, { concurrency: "unbounded" });

export const resolveEducationTwinData: TwinDataResolver<EducationTwinData> = (datasets, preferredLanguage) =>
  Effect.all({ pageTitles: datasets.pageTitles(preferredLanguage), educationList: datasets.educationList(preferredLanguage) }, { concurrency: "unbounded" });

export const resolveContactTwinData: TwinDataResolver<ContactTwinData> = (datasets, preferredLanguage) =>
  Effect.map(datasets.pageTitles(preferredLanguage), (pageTitles) => ({ pageTitles }));
