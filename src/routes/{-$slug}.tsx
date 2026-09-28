// tanstack
import { createFileRoute, notFound } from "@tanstack/react-router";

// services, features, and other libraries
import { Array, Option } from "effect";
import { loaderIndex } from "@/loaders/index";

// components
import { PageTitle } from "@/ui/page-title";
import { ExperienceSlider } from "@/ui/experience-slider";
import { ExperienceDetails } from "@/ui/experience-details";
import { ExperienceModal } from "@/ui/experience-modal";

export const Route = createFileRoute("/{-$slug}")({
  validateSearch: (search) => ({
    modal: search.modal === true || search.modal === "1" || search.modal === 1 ? true : undefined,
  }),
  loader: ({ params }) => loaderIndex(Option.fromNullishOr(params.slug)),
  component: HomePage,
});

function HomePage() {
  const loaderData = Route.useLoaderData();
  const { modal } = Route.useSearch();

  if (loaderData.type === "list") {
    const { randomPageTitles, localizedContent, experienceList } = loaderData;
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
              <ExperienceSlider localizedContent={localizedContent} experienceList={Array.filter(experienceList, ({ type }) => type === "e")} />
            </figure>
          </section>
          <section className="rounded-xl bg-clr-primary-800 p-4">
            <figure className="mx-auto w-full max-w-4xl">
              <figcaption className="mb-4 place-self-end rounded-ss-xl rounded-ee-xl bg-primary-foreground p-3 italic">
                {localizedContent["pageHome"]["portfolioProjects"]}
              </figcaption>
              <ExperienceSlider localizedContent={localizedContent} experienceList={Array.filter(experienceList, ({ type }) => type === "p")} />
            </figure>
          </section>
        </article>
      </>
    );
  }

  const { randomPageTitles, localizedContent, experience } = loaderData;
  if (!randomPageTitles || !localizedContent || !experience) throw notFound();

  const details = <ExperienceDetails localizedContent={localizedContent} experience={experience} />;
  if (modal) return <ExperienceModal localizedContent={localizedContent}>{details}</ExperienceModal>;

  return (
    <>
      <PageTitle pagePath="/" pageTitles={randomPageTitles} />
      {details}
    </>
  );
}
