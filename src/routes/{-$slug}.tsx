// tanstack
import { createFileRoute, notFound } from "@tanstack/react-router";

// services, features, and other libraries
import { Array, Option } from "effect";
import { useAtomValue } from "@effect/atom-react";
import { loaderIndex } from "@/loaders/index";
import { experienceHead, homeListHead } from "@/features/meta/domain";
import { experienceAtom } from "@/features/modals/state";

// components
import { PageTitle } from "@/ui/page-title";
import { ExperienceSlider } from "@/ui/experience-slider";
import { ExperienceDetails } from "@/ui/experience-details";
import { ExperienceModal } from "@/features/modals/ui/experience";

export const Route = createFileRoute("/{-$slug}")({
  loader: ({ params }) => loaderIndex(Option.fromNullishOr(params.slug)),
  head: ({ loaderData, params }) => {
    if (loaderData?.type === "item" && loaderData.experience && params.slug) return experienceHead(params.slug, loaderData.experience);
    return homeListHead(loaderData?.type === "list" ? loaderData.randomPageTitles : null);
  },
  component: HomePage,
});

function HomePage() {
  const loaderData = Route.useLoaderData();
  const currExperience = useAtomValue(experienceAtom);

  if (loaderData.type === "list") {
    const { randomPageTitles, localizedContent, experienceList } = loaderData;
    if (!randomPageTitles || !localizedContent || !experienceList) throw notFound();

    return (
      <>
        <PageTitle pagePath="/" pageTitles={randomPageTitles} />
        <article className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <section className="rounded-xl bg-surface-2 p-4">
            <figure className="mx-auto w-full max-w-4xl">
              <figcaption className="mb-4 place-self-end rounded-ss-xl rounded-ee-xl bg-surface-1 p-3 tracking-widest text-text-2 uppercase">
                {localizedContent["pageHome"]["experience"]}
              </figcaption>
              <ExperienceSlider localizedContent={localizedContent} experienceList={Array.filter(experienceList, ({ type }) => type === "e")} />
            </figure>
          </section>
          <section className="rounded-xl bg-surface-2 p-4">
            <figure className="mx-auto w-full max-w-4xl">
              <figcaption className="mb-4 place-self-end rounded-ss-xl rounded-ee-xl bg-surface-1 p-3 tracking-widest text-text-2 uppercase">
                {localizedContent["pageHome"]["portfolioProjects"]}
              </figcaption>
              <ExperienceSlider localizedContent={localizedContent} experienceList={Array.filter(experienceList, ({ type }) => type === "p")} />
            </figure>
          </section>
        </article>
        {/* Overlay opened by intercepting the "more info" link: no navigation, so the sliders above stay mounted and keep their position */}
        <ExperienceModal localizedContent={localizedContent}>
          {Option.isSome(currExperience) && <ExperienceDetails localizedContent={localizedContent} experience={currExperience.value} />}
        </ExperienceModal>
      </>
    );
  }

  const { randomPageTitles, localizedContent, experience } = loaderData;
  if (!randomPageTitles || !localizedContent || !experience) throw notFound();

  return (
    <>
      <PageTitle pagePath="/" pageTitles={randomPageTitles} />
      <ExperienceDetails localizedContent={localizedContent} experience={experience} />
    </>
  );
}
