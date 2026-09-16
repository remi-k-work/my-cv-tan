// services, features, and other libraries
import { Schema } from "effect";

// types
export type PreferredLanguage = typeof PreferredLanguage.Type;

export const PreferredLanguage = Schema.Literals(["en", "pl"]);
