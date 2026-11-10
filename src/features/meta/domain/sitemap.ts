// services, features, and other libraries
import { Array, Effect, pipe } from "effect";
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

const escapeXml = (value: string) => value.replace(/[&<>"']/g, (character) => XML_ENTITIES[character] ?? character);

const sitemapDocument = Effect.gen(function* () {
  const { experienceList } = yield* Datasets;

  const lists = yield* Effect.all(
    SITE_LANGUAGES.map((language) => experienceList(language)),
    { concurrency: "unbounded" }
  );

  const slugs = lists.flatMap((list) => list.map(({ slug }) => slug));
  return sitemapResponse(buildSitemapXml(slugs));
}).pipe(
  recoverDataFailure(() => "[SITEMAP.XML]", sitemapUnavailableResponse),
  Effect.withSpan("sitemapDocument")
);

// Generates XML sitemap containing canonical URLs for static pages, downloads, and experience items
export const buildSitemapXml = (slugs: ReadonlyArray<string>) => {
  const locs = pipe([...STATIC_URLS, ...Array.map(slugs, (slug) => absoluteUrl(experiencePath(slug)))], Array.dedupe);

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...Array.map(locs, (loc) => `<url><loc>${escapeXml(loc)}</loc></url>`),
    "</urlset>",
  ].join("\n");
};

export const sitemapHandler = documentRoute(() => sitemapDocument);
