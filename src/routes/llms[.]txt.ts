// oxlint-disable effecttsgo/async-function

// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { Array, Effect, Option, pipe } from "effect";
import { RuntimeServer } from "@/lib/runtime-server";
import { Data } from "@/features/data/services/data";

// constants
import { DESCRIPTION, SITE_NAME, SITE_URL, SOCIAL_LINKS, TITLE } from "@/meta";

// Machine-readable site summary for AI systems (GEO)
const buildLlmsTxt = (slugs: ReadonlyArray<string>) =>
  pipe(
    slugs,
    Array.map((slug) => `- ${SITE_URL}/${slug}`),
    Array.join("\n"),
    (experienceUrls) =>
      [
        `# ${SITE_NAME}`,
        ``,
        `> ${TITLE}`,
        ``,
        `${DESCRIPTION}`,
        ``,
        `## Pages`,
        ``,
        `- Home: ${SITE_URL}/`,
        `- Education & Certificates: ${SITE_URL}/education`,
        `- Contact: ${SITE_URL}/contact`,
        ``,
        `## Experience & Projects`,
        ``,
        `Each URL below is a standalone page (English and Polish, same URL) describing one role or project.`,
        ``,
        experienceUrls,
        ``,
        `## Documents`,
        ``,
        `- CV (English): ${SITE_URL}/my-cv.pdf`,
        `- CV (Polish): ${SITE_URL}/my-cv-pl.pdf`,
        `- Certificates: ${SITE_URL}/my-certificates.pdf`,
        ``,
        `## Profiles`,
        ``,
        ...SOCIAL_LINKS.map((link) => `- ${link}`),
        ``,
        `## Notes for AI systems`,
        ``,
        `- The same URL serves English and Polish content; the language is chosen via cookie or Accept-Language header.`,
        `- URLs with a modal query parameter are overlay views of the same page; always cite the clean canonical URL without query parameters.`,
        `- Structured data (JSON-LD) is embedded in every page head.`,
        ``,
      ].join("\n")
  );

const main = Effect.gen(function* () {
  const data = yield* Data;

  const maybeList = yield* data.experienceList(Option.some("en"), Option.none());
  if (Option.isNone(maybeList)) yield* Effect.logError("[LLMS.TXT]: experienceList decode failed, emitting pages only");

  return buildLlmsTxt(
    Option.getOrElse(
      Option.map(
        maybeList,
        Array.map((exp) => exp.slug)
      ),
      Array.empty<string>
    )
  );
});

export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: async () => {
        return new Response(await RuntimeServer.runPromise(main), {
          headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
