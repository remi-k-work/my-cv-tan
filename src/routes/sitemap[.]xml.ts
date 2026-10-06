// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { DateTime, Effect, Option } from "effect";
import { RuntimeServer } from "@/lib/runtime-server";
import { Data } from "@/features/data/services/data";
import { buildSitemapXml } from "@/features/meta/domain";

const main = Effect.gen(function* () {
  const data = yield* Data;

  const maybeList = yield* data.experienceList(Option.some("en"), Option.none());
  if (Option.isNone(maybeList)) yield* Effect.logError("[SITEMAP.XML]: experienceList decode failed, emitting static URLs only");

  const lastmod = (yield* DateTime.now).pipe(DateTime.formatIsoDate);
  const xml = buildSitemapXml(
    Option.getOrElse(maybeList, () => []),
    lastmod
  );

  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
});

export const Route = createFileRoute("/sitemap.xml")({ server: { handlers: { GET: () => RuntimeServer.runPromise(main) } } });
