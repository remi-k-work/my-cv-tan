// services, features, and other libraries
import { Option, Schema } from "effect";
import { PreferredLanguage } from "@/domain";

// Parses the explicit `?lang=` override for .md routes.
// Pure function returning an Option (no Effect needed): None when absent or invalid,
// so callers fall back to cookie / Accept-Language resolution via the Lang service.
export const parseLangParam = (requestUrl: string): Option.Option<PreferredLanguage> => {
  const raw = new URL(requestUrl).searchParams.get("lang");
  if (raw === null) return Option.none();
  return Schema.decodeUnknownOption(PreferredLanguage)(raw.trim().toLowerCase());
};
