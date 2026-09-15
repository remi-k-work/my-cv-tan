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

export const Route = createFileRoute("/")({
  loader: async () => {
    const lang = await getLang();
    const loader = DataLoader.fromLang(lang);
    return { lang, localizedContent: loader.localizedContent(), allExperiences: loader.allExperiences(), allPageTitles: loader.allPageTitles() } as const;
  },
  component: HomePage,
});

function HomePage() {
  const { localizedContent, allExperiences, allPageTitles } = Route.useLoaderData();

  return (
    <>
      <PageTitle titleTheme={getRandomInt(0, 2)} pathname="/" allPageTitles={allPageTitles} />
      <article className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-xl bg-clr-primary-800 p-4">
          <figure className="mx-auto w-full max-w-4xl">
            <figcaption className="mb-4 place-self-end rounded-ss-xl rounded-ee-xl bg-primary-foreground p-3 italic">
              {localizedContent["pageHome"]["experience"]}
            </figcaption>
            <ExperienceSliderSeo allExperiences={allExperiences} type="e" />
            <ExperienceSlider localizedContent={localizedContent} allExperiences={allExperiences} type="e" />
          </figure>
        </section>
        <section className="rounded-xl bg-clr-primary-800 p-4">
          <figure className="mx-auto w-full max-w-4xl">
            <figcaption className="mb-4 place-self-end rounded-ss-xl rounded-ee-xl bg-primary-foreground p-3 italic">
              {localizedContent["pageHome"]["portfolioProjects"]}
            </figcaption>
            <ExperienceSliderSeo allExperiences={allExperiences} type="p" />
            <ExperienceSlider localizedContent={localizedContent} allExperiences={allExperiences} type="p" />
          </figure>
        </section>
      </article>
    </>
  );
}
