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
import MyCertificates from "@/components/MyCertificates";
import MyEducation from "@/components/MyEducation";

const loader = createIsomorphicFn()
  .server(() =>
    RuntimeServer.runPromise(
      Effect.gen(function* () {
        const { resolve } = yield* Lang;
        const data = yield* Data;
        const preferredLanguage = yield* resolve(Option.none());

        const { randomPageTitles, localizedContent, educationList } = yield* Effect.all(
          {
            randomPageTitles: data.randomPageTitles(Option.some(preferredLanguage), Option.none()),
            localizedContent: data.localizedContent(Option.some(preferredLanguage), Option.none()),
            educationList: data.educationList(Option.some(preferredLanguage), Option.none()),
          },
          { concurrency: "unbounded" }
        ).pipe(Effect.tapError(Effect.logError));

        return {
          randomPageTitles: randomPageTitles.pipe(Option.getOrNull),
          localizedContent: localizedContent.pipe(Option.getOrNull),
          educationList: educationList.pipe(Option.getOrNull),
        } as const;
      })
    )
  )
  .client(() =>
    RuntimeClient.runPromise(
      Effect.gen(function* () {
        const rpcLangClient = yield* RpcDataClient;
        const { randomPageTitles, localizedContent, educationList } = yield* Effect.all(
          {
            randomPageTitles: rpcLangClient.randomPageTitles(),
            localizedContent: rpcLangClient.localizedContent(),
            educationList: rpcLangClient.educationList(),
          },
          { concurrency: "unbounded" }
        ).pipe(Effect.tapError(Effect.logError));

        return {
          randomPageTitles: randomPageTitles.pipe(Option.getOrNull),
          localizedContent: localizedContent.pipe(Option.getOrNull),
          educationList: educationList.pipe(Option.getOrNull),
        } as const;
      })
    )
  );

export const Route = createFileRoute("/education")({ loader: () => loader(), component: EducationPage });

function EducationPage() {
  const { randomPageTitles, localizedContent, educationList } = Route.useLoaderData();
  if (!randomPageTitles || !localizedContent || !educationList) return notFound();

  return (
    <>
      <PageTitle pagePath="/education" pageTitles={randomPageTitles} />
      <article className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-xl bg-clr-primary-800 p-4">
          <MyCertificates localizedContent={localizedContent} />
        </section>
        <section className="rounded-xl bg-clr-primary-800 p-4">
          <MyEducation localizedContent={localizedContent} educationList={educationList} />
        </section>
      </article>
    </>
  );
}
