// tanstack
import { createFileRoute, notFound } from "@tanstack/react-router";

// services, features, and other libraries
import { Array } from "effect";
import { loaderIndex } from "@/loaders/index";

// components
import { PageTitle } from "@/ui/page-title";
import { ExperienceSlider } from "@/ui/experience-slider";
import { ExperienceSliderSeo } from "@/ui/experience-slider/seo-ver";

export const Route = createFileRoute("/")({ loader: () => loaderIndex(), component: HomePage });

function HomePage() {
  const { randomPageTitles, localizedContent, experienceList } = Route.useLoaderData();
  if (!randomPageTitles || !localizedContent || !experienceList) throw notFound();

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
