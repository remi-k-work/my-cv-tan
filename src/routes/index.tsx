// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import DataLoader from "@/lib/DataLoader";
import { getRandomInt } from "@/lib/helpers";
import { getLang } from "@/server/i18n.functions";

// components
import PageTitle from "@/components/PageTitle";
import ExperienceSlider from "@/components/experience-slider";
import ExperienceSliderSeo from "@/components/experience-slider/SeoVer";

// types
import type { Experience } from "@/types/shared";

export const Route = createFileRoute("/")({
  loader: async () => {
    const preferredLanguage = await getLang();
    const loader = DataLoader.fromLang(preferredLanguage);
    return { pageTitles: loader.pageTitles, localizedContent: loader.localizedContent, experience: loader.experience } as const;
  },
  component: HomePage,
});

function HomePage() {
  const { pageTitles, localizedContent, experience } = Route.useLoaderData();

  return (
    <>
      <PageTitle titleTheme={getRandomInt(0, 2)} pathname="/" pageTitles={pageTitles} />
      <article className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-xl bg-clr-primary-800 p-4">
          <figure className="mx-auto w-full max-w-4xl">
            <figcaption className="mb-4 place-self-end rounded-ss-xl rounded-ee-xl bg-primary-foreground p-3 italic">
              {localizedContent["pageHome"]["experience"]}
            </figcaption>
            <ExperienceSliderSeo experienceList={experience.filter(({ type }) => type === "e") as Experience[]} />
            <ExperienceSlider localizedContent={localizedContent} experienceList={experience.filter(({ type }) => type === "e") as Experience[]} />
          </figure>
        </section>
        <section className="rounded-xl bg-clr-primary-800 p-4">
          <figure className="mx-auto w-full max-w-4xl">
            <figcaption className="mb-4 place-self-end rounded-ss-xl rounded-ee-xl bg-primary-foreground p-3 italic">
              {localizedContent["pageHome"]["portfolioProjects"]}
            </figcaption>
            <ExperienceSliderSeo experienceList={experience.filter(({ type }) => type === "p") as Experience[]} />
            <ExperienceSlider localizedContent={localizedContent} experienceList={experience.filter(({ type }) => type === "p") as Experience[]} />
          </figure>
        </section>
      </article>
    </>
  );
}
