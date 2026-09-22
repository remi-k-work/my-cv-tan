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
    const preferredLanguage = await getLang();
    const loader = DataLoader.fromLang(preferredLanguage);
    return { localizedContent: loader.localizedContent, experience: loader.experience, pageTitles: loader.pageTitles } as const;
  },
  component: HomePage,
});

function HomePage() {
  const { localizedContent, experience, pageTitles } = Route.useLoaderData();

  return (
    <>
      <PageTitle titleTheme={getRandomInt(0, 2)} pathname="/" pageTitles={pageTitles} />
      <article className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-xl bg-clr-primary-800 p-4">
          <figure className="mx-auto w-full max-w-4xl">
            <figcaption className="mb-4 place-self-end rounded-ss-xl rounded-ee-xl bg-primary-foreground p-3 italic">
              {localizedContent["pageHome"]["experience"]}
            </figcaption>
            <ExperienceSliderSeo experience={experience} type="e" />
            <ExperienceSlider localizedContent={localizedContent} experience={experience} type="e" />
          </figure>
        </section>
        <section className="rounded-xl bg-clr-primary-800 p-4">
          <figure className="mx-auto w-full max-w-4xl">
            <figcaption className="mb-4 place-self-end rounded-ss-xl rounded-ee-xl bg-primary-foreground p-3 italic">
              {localizedContent["pageHome"]["portfolioProjects"]}
            </figcaption>
            <ExperienceSliderSeo experience={experience} type="p" />
            <ExperienceSlider localizedContent={localizedContent} experience={experience} type="p" />
          </figure>
        </section>
      </article>
    </>
  );
}
