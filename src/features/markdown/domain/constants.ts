// Shared constants for Markdown twins and AI discovery indexes.

// services, features, and other libraries
import { translateSource } from "./text";

// types
import type { LocalizedMdInput } from "./models";

// constants
import { CERTIFICATES_HREF, CV_EN_HREF, CV_PL_HREF, DEFAULT_LANGUAGE } from "@/features/meta/domain/constants";

// Rendering context for unlocalized, English-only index documents.
export const SOURCE_COPY: LocalizedMdInput = { preferredLanguage: DEFAULT_LANGUAGE, translate: translateSource };

// Static download assets advertised across twins and machine indexes.
export const DOWNLOADABLE_DOCUMENTS = [
  { label: "CV (English)", href: CV_EN_HREF },
  { label: "CV (Polish)", href: CV_PL_HREF },
  { label: "Certificates", href: CERTIFICATES_HREF },
] as const;
