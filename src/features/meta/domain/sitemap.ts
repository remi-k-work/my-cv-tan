// services, features, and other libraries
import { Array, pipe } from "effect";
import { absoluteUrl } from "./helpers";

// types
import type { ExperienceList } from "@/features/experience/domain";

interface SitemapEntry {
  readonly loc: string;
  readonly changefreq: string;
  readonly priority: string;
}

// constants
import { SITE_URL } from "./constants";

// HTML canonical URLs only: Markdown twins (*.md) are deliberately excluded to avoid
// duplicate-content dilution; AI crawlers discover them via llms.txt and <link rel="alternate">.
const STATIC_URLS = [
  { loc: SITE_URL, changefreq: "monthly", priority: "1.0" },
  { loc: `${SITE_URL}/education`, changefreq: "monthly", priority: "0.8" },
  { loc: `${SITE_URL}/contact`, changefreq: "monthly", priority: "0.5" },
  { loc: `${SITE_URL}/my-cv.pdf`, changefreq: "monthly", priority: "0.4" },
  { loc: `${SITE_URL}/my-cv-pl.pdf`, changefreq: "monthly", priority: "0.4" },
  { loc: `${SITE_URL}/my-certificates.pdf`, changefreq: "monthly", priority: "0.4" },
] as const;

const toXmlNode = (lastmod: string) => (entry: SitemapEntry) =>
  `  <url>\n    <loc>${entry.loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${entry.changefreq}</changefreq>\n    <priority>${entry.priority}</priority>\n  </url>`;

const wrapWithUrlSet = (entries: string) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`;

// One <url> per experience detail page plus the static routes
export const buildSitemapXml = (experienceList: ExperienceList, lastmod: string) =>
  pipe(
    experienceList,
    Array.map(({ slug }) => ({ loc: absoluteUrl(`/${slug}`), changefreq: "monthly", priority: "0.6" })),
    Array.prependAll(STATIC_URLS),
    Array.map(toXmlNode(lastmod)),
    Array.join("\n"),
    wrapWithUrlSet
  );
