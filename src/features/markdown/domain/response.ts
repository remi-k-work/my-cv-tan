// types
import type { PreferredLanguage } from "@/domain";

// constants
import { MARKDOWN_CACHE_CONTROL, MARKDOWN_CONTENT_TYPE, MARKDOWN_VARY, TXT_CONTENT_TYPE } from "./constants";

const mdHeaders = (preferredLanguage: PreferredLanguage) => ({
  "Content-Type": MARKDOWN_CONTENT_TYPE,
  "Cache-Control": MARKDOWN_CACHE_CONTROL,
  "Content-Language": preferredLanguage,
  Vary: MARKDOWN_VARY,
  "X-Robots-Tag": "index, follow",
});

// Successful Markdown document response (200)
export const mdResponse = (body: string, preferredLanguage: PreferredLanguage) => new Response(body, { headers: mdHeaders(preferredLanguage) });

// Missing slug response: still Markdown so AI fetchers get an explicit, parseable 404
export const mdNotFoundResponse = (body: string, preferredLanguage: PreferredLanguage) =>
  new Response(body, { status: 404, headers: { ...mdHeaders(preferredLanguage), "X-Robots-Tag": "noindex, follow" } });

// Plain-text discovery document (llms.txt, robots.txt): cacheable at the CDN
export const txtResponse = (body: string) => new Response(body, { headers: { "Content-Type": TXT_CONTENT_TYPE, "Cache-Control": MARKDOWN_CACHE_CONTROL } });
