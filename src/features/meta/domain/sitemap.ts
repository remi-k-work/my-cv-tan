// services, features, and other libraries
import { Array, Effect, Option, Record, pipe } from "effect";
import { documentRoute } from "@/lib/server-route";
import { recoverDataFailure } from "@/features/data/domain/required";
import { Datasets } from "@/features/data/services/datasets";
import { absoluteUrl, experiencePath } from "./urls";
import { sitemapResponse, sitemapUnavailableResponse } from "./responses";

// constants
import { DOWNLOADABLE_DOCUMENT_PATHS } from "./discovery";
import { STATIC_PAGE_PATHS } from "./pages";
import { SITE_LANGUAGES } from "@/domain/constants";

const STATIC_URLS = Array.map([...STATIC_PAGE_PATHS, ...DOWNLOADABLE_DOCUMENT_PATHS], absoluteUrl);
const XML_ENTITIES: Readonly<Record<string, string>> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" };

// The character class is exactly the entity table's key set, so a lookup miss can only mean the
// class and the table drifted: publishing the character unchanged keeps it well-formed XML
const escapeXml = (value: string) => value.replace(/[&<>"']/g, (character) => Option.getOrElse(Record.get(XML_ENTITIES, character), () => character));

// One document description, built once and re-run per request: it is a pure value, so nothing
// about the request that asks for it has to be threaded in
const sitemapDocument = Effect.gen(function* () {
  const { experienceList } = yield* Datasets;

  const lists = yield* Effect.all(
    Array.map(SITE_LANGUAGES, (language) => experienceList(language)),
    { concurrency: "unbounded" }
  );

  // Every language publishes the same unique canonical routes, so the per-language lists flatten
  // into one slug collection; the builder dedupes the locations it renders from them
  const slugs = pipe(
    lists,
    Array.flatten,
    Array.map(({ slug }) => slug)
  );
  return sitemapResponse(buildSitemapXml(slugs));
}).pipe(
  recoverDataFailure(() => "[SITEMAP.XML]", sitemapUnavailableResponse),
  Effect.withSpan("sitemapDocument")
);

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

export const sitemapHandler = documentRoute(() => sitemapDocument);
