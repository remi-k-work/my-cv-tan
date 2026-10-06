// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { Effect, Option } from "effect";
import { RuntimeServer } from "@/lib/runtime-server";
import { requireData } from "@/features/data/domain";
import { Data } from "@/features/data/services/data";
import { buildSitemapXml, sitemapUnavailableResponse } from "@/features/meta/domain";

const main = Effect.gen(function* () {
  const data = yield* Data;

  const maybeList = yield* data.experienceList(Option.some("en"), Option.none());
  const experienceList = yield* requireData(maybeList, "experience list");
  const xml = buildSitemapXml(experienceList);

  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}).pipe(
  Effect.catchTag("RequiredDataError", (error) =>
    Effect.gen(function* () {
      yield* Effect.logError(`[SITEMAP.XML]: ${error.message}`);
      return sitemapUnavailableResponse();
    })
  )
);

export const Route = createFileRoute("/sitemap.xml")({ server: { handlers: { GET: () => RuntimeServer.runPromise(main) } } });
