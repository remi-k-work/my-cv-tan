// Every value the Markdown twin and index builders share. Response directives — the cache policy,
// the reuse signal, and the Vary that names the language inputs — live in
// features/meta/domain/constants.ts so the HTML and machine-readable surfaces spell them once.

// services, features, and other libraries
import { DEFAULT_LANGUAGE } from "@/features/meta/domain/constants";
import { translateSource } from "./text";

// types
import type { LocalizedMdInput } from "./models";

// constants
import { CERTIFICATES_HREF, CV_EN_HREF, CV_PL_HREF } from "@/features/meta/domain/constants";

export const MARKDOWN_CONTENT_TYPE = "text/markdown; charset=utf-8";

// List lines (llms.txt, home twin) stay scannable: tighter than the 160-char meta description cap
// so AI systems can scan the index quickly without parsing full prose.
export const LIST_EXCERPT_LENGTH = 140;

// Frontmatter delimiters for every .md document (frontmatter mirrors <head> meta for AI indexers)
export const FRONTMATTER_DELIMITER = "---";

// The rendering context every English-only surface declares: source language, and the identity
// translate the dictionary itself falls back to per missing key.
//
// Lives beside the other shared values rather than in the catalogue, because it is what these
// indexes render *in* rather than what the site publishes — and three consumers (the catalogue's
// entries, llms.txt and the index builders) name it explicitly instead of each defaulting it.
export const SOURCE_COPY: LocalizedMdInput = { preferredLanguage: DEFAULT_LANGUAGE, translate: translateSource };

// The downloadable documents every surface advertises: the education twin renders them as translated
// links, the English llms.txt index prints the same labels. Spelled here once, so adding a document
// reaches both surfaces instead of one of them.
//
// `label` doubles as the GT dictionary key for the translated surfaces; the English index prints it
// verbatim
export const DOWNLOADABLE_DOCUMENTS = [
  { label: "CV (English)", href: CV_EN_HREF },
  { label: "CV (Polish)", href: CV_PL_HREF },
  { label: "Certificates", href: CERTIFICATES_HREF },
] as const;
