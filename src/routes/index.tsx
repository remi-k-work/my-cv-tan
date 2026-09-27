// tanstack
import { createFileRoute, notFound } from "@tanstack/react-router";
import { createIsomorphicFn } from "@tanstack/react-start";

// services, features, and other libraries
import { Array, Effect, Option } from "effect";
import { RuntimeServer } from "@/lib/runtime-server";
import { RuntimeClient } from "@/lib/runtime-client";
import { Data } from "@/features/data/services/data";
import { Lang } from "@/features/data/services/lang";
import { RpcDataClient } from "@/features/data/rpc/client";

// components
import { PageTitle } from "@/components/page-title";
import ExperienceSlider from "@/components/experience-slider";
import ExperienceSliderSeo from "@/components/experience-slider/SeoVer";

const loader = createIsomorphicFn()
  .server(() =>
    RuntimeServer.runPromise(
      Effect.gen(function* () {
        const { resolve } = yield* Lang;
        const data = yield* Data;
        const preferredLanguage = yield* resolve(Option.none());

        const { randomPageTitles, localizedContent, experienceList } = yield* Effect.all(
          {
            randomPageTitles: data.randomPageTitles(Option.some(preferredLanguage), Option.none()),
            localizedContent: data.localizedContent(Option.some(preferredLanguage), Option.none()),
            experienceList: data.experienceList(Option.some(preferredLanguage), Option.none()),
          },
          { concurrency: "unbounded" }
        ).pipe(Effect.tapError(Effect.logError));

        return {
          randomPageTitles: randomPageTitles.pipe(Option.getOrNull),
          localizedContent: localizedContent.pipe(Option.getOrNull),
          experienceList: experienceList.pipe(Option.getOrNull),
        } as const;
      })
    )
  )
  .client(() =>
    RuntimeClient.runPromise(
      Effect.gen(function* () {
        const rpcLangClient = yield* RpcDataClient;
        const { randomPageTitles, localizedContent, experienceList } = yield* Effect.all(
          {
            randomPageTitles: rpcLangClient.randomPageTitles(),
            localizedContent: rpcLangClient.localizedContent(),
            experienceList: rpcLangClient.experienceList(),
          },
          { concurrency: "unbounded" }
        ).pipe(Effect.tapError(Effect.logError));

        return {
          randomPageTitles: randomPageTitles.pipe(Option.getOrNull),
          localizedContent: localizedContent.pipe(Option.getOrNull),
          experienceList: experienceList.pipe(Option.getOrNull),
        } as const;
      })
    )
  );

export const Route = createFileRoute("/")({ loader: () => loader(), component: HomePage });

function HomePage() {
  const { randomPageTitles, localizedContent, experienceList } = Route.useLoaderData();
  if (!randomPageTitles || !localizedContent || !experienceList) return notFound();

  return (
    <>
      <PageTitle pagePath="/" pageTitles={randomPageTitles} />
      <article className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-xl bg-clr-primary-800 p-4">
          <figure className="mx-auto w-full max-w-4xl">
            <figcaption className="mb-4 place-self-end rounded-ss-xl rounded-ee-xl bg-primary-foreground p-3 italic">
              {localizedContent["pageHome"]["experience"]}
            </figcaption>
            <ExperienceSliderSeo experienceList={Array.filter(experienceList, ({ type }) => type === "e")} />
            <ExperienceSlider localizedContent={localizedContent} experienceList={Array.filter(experienceList, ({ type }) => type === "e")} />
          </figure>
        </section>
        <section className="rounded-xl bg-clr-primary-800 p-4">
          <figure className="mx-auto w-full max-w-4xl">
            <figcaption className="mb-4 place-self-end rounded-ss-xl rounded-ee-xl bg-primary-foreground p-3 italic">
              {localizedContent["pageHome"]["portfolioProjects"]}
            </figcaption>
            <ExperienceSliderSeo experienceList={Array.filter(experienceList, ({ type }) => type === "p")} />
            <ExperienceSlider localizedContent={localizedContent} experienceList={Array.filter(experienceList, ({ type }) => type === "p")} />
          </figure>
        </section>
      </article>
    </>
  );
}
