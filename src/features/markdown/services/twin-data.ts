// Resolve only the datasets each static Markdown twin needs.

// services, features, and other libraries
import { Effect } from "effect";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { EducationList } from "@/features/education/domain/models";
import type { ExperienceList } from "@/features/experience/domain/models";
import type { DatasetsService } from "@/features/data/services/datasets";
import type { RequiredDataError } from "@/features/data/domain/required";

export type TwinDataResolver<Data> = (datasets: DatasetsService, preferredLanguage: PreferredLanguage) => Effect.Effect<Data, RequiredDataError>;

// Each resolver projects exactly one localized dataset into its twin's render input.
export const resolveHomeTwinData: TwinDataResolver<{ readonly experienceList: ExperienceList }> = (datasets, preferredLanguage) =>
  Effect.map(datasets.experienceList(preferredLanguage), (experienceList) => ({ experienceList }));

export const resolveEducationTwinData: TwinDataResolver<{ readonly educationList: EducationList }> = (datasets, preferredLanguage) =>
  Effect.map(datasets.educationList(preferredLanguage), (educationList) => ({ educationList }));

export const resolveContactTwinData: TwinDataResolver<{}> = () => Effect.succeed({});
