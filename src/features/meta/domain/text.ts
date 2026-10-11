// constants
import { CACHE_CONTROL } from "./constants";

// Plain-text discovery document content type (robots.txt, llms.txt, llms-full.txt)
export const TXT_CONTENT_TYPE = "text/plain; charset=utf-8";

// Plain-text discovery document (llms.txt, robots.txt): always English and cacheable at the CDN
export const txtResponse = (body: string) =>
  new Response(body, { headers: { "Content-Type": TXT_CONTENT_TYPE, "Content-Language": "en", "Cache-Control": CACHE_CONTROL } });
