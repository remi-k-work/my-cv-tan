// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { Array } from "effect";
import DataLoader from "@/lib/DataLoader";
import { getRandomInt } from "@/lib/helpers";
import { getLang } from "@/server/i18n.functions";

// components
import { PageTitle } from "@/components/page-title";
import ExperienceSlider from "@/components/experience-slider";
import ExperienceSliderSeo from "@/components/experience-slider/SeoVer";

export const Route = createFileRoute("/")({
  loader: async () => {
    const preferredLanguage = await getLang();
    const loader = DataLoader.fromLang(preferredLanguage);
    return { pageTitlesList: loader.pageTitlesList, localizedContent: loader.localizedContent, experienceList: loader.experienceList } as const;
  },
  component: HomePage,
});

function HomePage() {
  const { pageTitlesList, localizedContent, experienceList } = Route.useLoaderData();

  return (
    <>
      <PageTitle titleTheme={getRandomInt(0, 2)} pagePath="/" pageTitlesList={pageTitlesList} />
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
