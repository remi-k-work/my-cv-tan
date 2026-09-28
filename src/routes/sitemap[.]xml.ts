// oxlint-disable effecttsgo/async-function

// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { Array, DateTime, Effect, Option, pipe } from "effect";
import { RuntimeServer } from "@/lib/runtime-server";
import { Data } from "@/features/data/services/data";

// types
interface SitemapEntry {
  readonly loc: string;
  readonly changefreq: string;
  readonly priority: string;
}

// constants
const BASE_URL = "https://www.remiforge.dev";

const STATIC_URLS = [
  { loc: BASE_URL, changefreq: "monthly", priority: "1.0" },
  { loc: `${BASE_URL}/education`, changefreq: "monthly", priority: "0.8" },
  { loc: `${BASE_URL}/contact`, changefreq: "monthly", priority: "0.5" },
  { loc: `${BASE_URL}/my-cv.pdf`, changefreq: "monthly", priority: "0.4" },
] as const;

// Pure functions extracted for clean pipelines
const createDynamicEntry = (slug: string) => ({ loc: `${BASE_URL}/${slug}`, changefreq: "monthly", priority: "0.6" }) as const;
const toXmlNode = (today: string) => (u: SitemapEntry) =>
  `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`;
const wrapWithUrlSet = (entries: string) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`;

const main = Effect.gen(function* () {
  const data = yield* Data;

  const maybeList = yield* data.experienceList(Option.some("en"), Option.none());
  if (Option.isNone(maybeList)) yield* Effect.logWarning("sitemap: experienceList decode failed, emitting static URLs only");

  const slugs = Option.getOrElse(
    Option.map(
      maybeList,
      Array.map((exp) => exp.slug)
    ),
    Array.empty<string>
  );
  const today = (yield* DateTime.now).pipe(DateTime.formatIsoDate);

  return pipe(slugs, Array.map(createDynamicEntry), Array.prependAll(STATIC_URLS), Array.map(toXmlNode(today)), Array.join("\n"), wrapWithUrlSet);
});

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        return new Response(await RuntimeServer.runPromise(main), {
          headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
