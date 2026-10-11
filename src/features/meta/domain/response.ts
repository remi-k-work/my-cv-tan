// HTTP responses for the machine-readable discovery documents (robots.txt, sitemap.xml, llms.txt)

// constants
import { CACHE_CONTROL, TXT_CONTENT_TYPE } from "./constants";

// Plain-text discovery document (robots.txt, llms.txt, llms-full.txt): always English, cacheable at the CDN
export const txtResponse = (body: string) =>
  new Response(body, { headers: { "Content-Type": TXT_CONTENT_TYPE, "Content-Language": "en", "Cache-Control": CACHE_CONTROL } });

// Cacheable success response: sitemap entries only change when the portfolio data changes
export const sitemapResponse = (xml: string) =>
  new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": CACHE_CONTROL } });

// Honest 503 instead of ever emitting an incomplete crawlable sitemap; never cached, never indexed
export const sitemapUnavailableResponse = () =>
  new Response('<?xml version="1.0" encoding="UTF-8"?><error>Sitemap is temporarily unavailable.</error>', {
    status: 503,
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex, follow" },
  });
