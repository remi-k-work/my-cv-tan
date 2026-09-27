// tanstack
import { createFileRoute, notFound } from "@tanstack/react-router";
import { createIsomorphicFn } from "@tanstack/react-start";

// services, features, and other libraries
import { Effect, Option } from "effect";
import { RuntimeServer } from "@/lib/runtime-server";
import { RuntimeClient } from "@/lib/runtime-client";
import { Data } from "@/features/data/services/data";
import { Lang } from "@/features/data/services/lang";
import { RpcDataClient } from "@/features/data/rpc/client";

// components
import { PageTitle } from "@/components/page-title";
import ExperienceModal from "@/components/ExperienceModal";
import ExperienceDetails from "@/components/experience-details";
import ExperienceDetailsSeo from "@/components/experience-details/SeoVer";

const loader = (slug: string) =>
  createIsomorphicFn()
    .server(() =>
      RuntimeServer.runPromise(
        Effect.gen(function* () {
          const { resolve } = yield* Lang;
          const data = yield* Data;
          const preferredLanguage = yield* resolve(Option.none());

          const { randomPageTitles, localizedContent, experience } = yield* Effect.all(
            {
              randomPageTitles: data.randomPageTitles(Option.some(preferredLanguage), Option.none()),
              localizedContent: data.localizedContent(Option.some(preferredLanguage), Option.none()),
              experience: data.experience(slug, Option.some(preferredLanguage), Option.none()),
            },
            { concurrency: "unbounded" }
          ).pipe(Effect.tapError(Effect.logError));

          return {
            randomPageTitles: randomPageTitles.pipe(Option.getOrNull),
            localizedContent: localizedContent.pipe(Option.getOrNull),
            experience: experience.pipe(Option.getOrNull),
          } as const;
        })
      )
    )
    .client(() =>
      RuntimeClient.runPromise(
        Effect.gen(function* () {
          const rpcLangClient = yield* RpcDataClient;
          const { randomPageTitles, localizedContent, experience } = yield* Effect.all(
            {
              randomPageTitles: rpcLangClient.randomPageTitles(),
              localizedContent: rpcLangClient.localizedContent(),
              experience: rpcLangClient.experience({ slug }),
            },
            { concurrency: "unbounded" }
          ).pipe(Effect.tapError(Effect.logError));

          return {
            randomPageTitles: randomPageTitles.pipe(Option.getOrNull),
            localizedContent: localizedContent.pipe(Option.getOrNull),
            experience: experience.pipe(Option.getOrNull),
          } as const;
        })
      )
    )();

export const Route = createFileRoute("/exp/$slug")({
  validateSearch: (search) => ({
    modal: search.modal === true || search.modal === "1" || search.modal === 1,
  }),
  loaderDeps: ({ search }) => ({ modal: search.modal }),
  loader: ({ params }) => loader(params.slug),
  component: ExpPage,
});

function ExpPage() {
  const { modal } = Route.useSearch();
  const { randomPageTitles, localizedContent, experience } = Route.useLoaderData();
  if (!randomPageTitles || !localizedContent || !experience) return notFound();

  const details = (
    <>
      <ExperienceDetailsSeo experience={experience} />
      <ExperienceDetails localizedContent={localizedContent} experience={experience} />
    </>
  );

  // In-app clicks link with ?modal=1 to preserve the Next.js intercepting-modal UX;
  // direct loads / refreshes render the full page (SEO-friendly).
  if (modal) {
    return <ExperienceModal localizedContent={localizedContent}>{details}</ExperienceModal>;
  }

  return (
    <>
      <PageTitle pagePath="/" pageTitles={randomPageTitles} />
      {details}
    </>
  );
}
