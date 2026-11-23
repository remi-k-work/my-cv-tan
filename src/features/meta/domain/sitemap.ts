// services, features, and other libraries
import { Array, pipe } from "effect";
import { absoluteUrl, experiencePath } from "./urls";

// constants
import { DOWNLOADABLE_DOCUMENT_PATHS } from "./discovery";
import { STATIC_PAGE_PATHS } from "./pages";

const STATIC_URLS = Array.map([...STATIC_PAGE_PATHS, ...DOWNLOADABLE_DOCUMENT_PATHS], absoluteUrl);
const XML_ENTITIES: Readonly<Record<string, string>> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" };

// The character class is exactly the entity table's key set, so a lookup miss can only mean the
// class and the table drifted: publishing the character unchanged keeps it well-formed XML
const escapeXml = (value: string) => value.replace(/[&<>"']/g, (character) => XML_ENTITIES[character] ?? character);

// Generates XML sitemap containing canonical URLs for static pages, downloads, and experience items
export const buildSitemapXml = (slugs: ReadonlyArray<string>) => {
  const locs = pipe([...STATIC_URLS, ...Array.map(slugs, (slug) => absoluteUrl(experiencePath(slug)))], Array.dedupe);

  return Array.join(
    [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...Array.map(locs, (loc) => `<url><loc>${escapeXml(loc)}</loc></url>`),
      "</urlset>",
    ],
    "\n"
  );
};
