// constants
import { MARKDOWN_CACHE_CONTROL, MARKDOWN_CONTENT_TYPE, MARKDOWN_VARY } from "./constants";

// types
import type { PreferredLanguage } from "@/domain";

const mdHeaders = (lang: PreferredLanguage) => ({
  "Content-Type": MARKDOWN_CONTENT_TYPE,
  "Cache-Control": MARKDOWN_CACHE_CONTROL,
  "Content-Language": lang,
  Vary: MARKDOWN_VARY,
  "X-Robots-Tag": "index, follow",
});

// Successful Markdown document response (200)
export const mdResponse = (body: string, lang: PreferredLanguage) => new Response(body, { headers: mdHeaders(lang) });

// Missing slug response: still Markdown so AI fetchers get an explicit, parseable 404
export const mdNotFoundResponse = (body: string, lang: PreferredLanguage) => new Response(body, { status: 404, headers: mdHeaders(lang) });
