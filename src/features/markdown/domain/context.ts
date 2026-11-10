// services, features, and other libraries
import { translateSource } from "@/domain/helpers";

// types
import type { TwinContext } from "./models";

// constants
import { DEFAULT_LANGUAGE } from "@/domain/constants";

// The source-language context every English-only surface (llms.txt, llms-full.txt) renders with
export const SOURCE_CONTEXT = { preferredLanguage: DEFAULT_LANGUAGE, translate: translateSource } as const satisfies TwinContext;
