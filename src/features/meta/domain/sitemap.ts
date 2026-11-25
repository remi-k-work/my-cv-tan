// services, features, and other libraries
import { Array, HashMap, Option, pipe } from "effect";
import { absoluteUrl } from "./urls";
import { experienceSeo } from "./seo";

// types
import type { ExperienceList } from "@/features/experience/domain/models";
import type { ExperienceSeo } from "./models";

// constants
import { DEFAULT_LANGUAGE } from "@/domain/constants";
import { DOWNLOADABLE_DOCUMENT_PATHS } from "./discovery";
import { STATIC_PAGE_PATHS } from "./pages";

const STATIC_URLS = Array.map([...STATIC_PAGE_PATHS, ...DOWNLOADABLE_DOCUMENT_PATHS], absoluteUrl);
const XML_ENTITIES = HashMap.fromIterable<string, string>([
  ["&", "&amp;"],
  ["<", "&lt;"],
  [">", "&gt;"],
  ['"', "&quot;"],
  ["'", "&apos;"],
]);

const escapeXml = (value: string) => value.replace(/[&<>"']/g, (character) => Option.getOrElse(HashMap.get(XML_ENTITIES, character), () => character));

const experienceImages = (seo: ExperienceSeo) =>
  pipe(
    seo.screenshot,
    Option.map(({ src }) => [
      "  <image:image>",
      `    <image:loc>${escapeXml(src)}</image:loc>`,
      `    <image:title>${escapeXml(seo.headline)}</image:title>`,
      "  </image:image>",
    ]),
    Option.getOrElse((): ReadonlyArray<string> => [])
  );

// Reuses each page's SEO identity so sitemap URLs and image metadata cannot drift from HTML or Markdown
export const buildSitemapXml = (experiences: ExperienceList) => {
  const staticEntries = Array.map(STATIC_URLS, (loc) => ({ loc, images: [] as ReadonlyArray<string> }));
  const experienceEntries = pipe(
    experiences,
    Array.map((experience) => experienceSeo({ experience, preferredLanguage: DEFAULT_LANGUAGE })),
    Array.map((seo) => ({ loc: seo.canonical, images: experienceImages(seo) }))
  );

  // Static pages win collisions, so malformed input cannot attach an experience image to a static URL
  const entries = pipe(
    [...staticEntries, ...experienceEntries],
    Array.dedupeWith((left, right) => left.loc === right.loc)
  );

  const urlElement = ({ loc, images }: (typeof entries)[number]) => ["<url>", `  <loc>${escapeXml(loc)}</loc>`, ...images, "</url>"];

  return Array.join(
    [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
      ...pipe(entries, Array.map(urlElement), Array.flatten),
      "</urlset>",
    ],
    "\n"
  );
};
