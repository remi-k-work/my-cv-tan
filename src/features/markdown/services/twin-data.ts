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

export const resolveHomeTwinData: TwinDataResolver<{ readonly experienceList: ExperienceList }> = Effect.fnUntraced(function* (
  datasets: DatasetsService,
  preferredLanguage: PreferredLanguage
) {
  const experienceList = yield* datasets.experienceList(preferredLanguage);
  return { experienceList };
});

export const resolveEducationTwinData: TwinDataResolver<{ readonly educationList: EducationList }> = Effect.fnUntraced(function* (
  datasets: DatasetsService,
  preferredLanguage: PreferredLanguage
) {
  const educationList = yield* datasets.educationList(preferredLanguage);
  return { educationList };
});

export const resolveContactTwinData: TwinDataResolver<{}> = () => Effect.succeed({});
