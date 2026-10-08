// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { Array, Option } from "effect";
import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { useGT } from "gt-tanstack-start";
import { loaderIndex } from "@/loaders/index";
import { experienceHead, headLanguage, homeListHead } from "@/features/meta/domain";
import { experienceAtom } from "@/features/modals/state";

// components
import { PageTitle } from "@/ui/page-title";
import { SliderPanel } from "@/features/experience/ui/slider-panel";
import { ExperienceDetails } from "@/features/experience/ui/experience-details";
import { ExperienceModal } from "@/features/modals/ui/experience";

// constants
import { UI_COPY } from "@/features/data/domain/ui-copy";

export const Route = createFileRoute("/{-$slug}")({
  loader: ({ params }) => loaderIndex(Option.fromNullishOr(params.slug)),
  head: ({ loaderData, params, matches }) => {
    if (!loaderData) return {};

    const preferredLanguage = headLanguage(matches);
    if (loaderData.type === "item" && params.slug) return experienceHead({ slug: params.slug, experience: loaderData.experience, preferredLanguage });
    if (loaderData.type === "list")
      return homeListHead({ pageTitles: loaderData.stablePageTitles, experienceList: loaderData.experienceList, preferredLanguage });
    return {};
  },
  component: HomePage,
});

function HomePage() {
  const gt = useGT();
  const loaderData = Route.useLoaderData();

  if (loaderData.type === "list") {
    const { randomPageTitles, experienceList } = loaderData;

    return (
      <>
        <PageTitle pagePath="/" pageTitles={randomPageTitles} />
        <article className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <SliderPanel title={gt(UI_COPY.pageHome.experience)} experienceList={Array.filter(experienceList, ({ type }) => type === "e")} />
          <SliderPanel title={gt(UI_COPY.pageHome.portfolioProjects)} experienceList={Array.filter(experienceList, ({ type }) => type === "p")} />
        </article>
        {/* Overlay opened by intercepting the "more info" link: no navigation, so the sliders above stay mounted and keep their position */}
        <ExperienceDetailsModal />
      </>
    );
  }

  const { randomPageTitles, experience } = loaderData;

  return (
    <>
      <PageTitle pagePath="/" pageTitles={randomPageTitles} />
      <ExperienceDetails experience={experience} />
    </>
  );
}

// Subscribes to the selected experience in isolation, so opening/closing the overlay doesn't re-render the sliders it sits on top of
function ExperienceDetailsModal() {
  const gt = useGT();
  const currExperience = useAtomValue(experienceAtom);
  const clearExperience = useAtomSet(experienceAtom);

  return (
    <ExperienceModal isOpen={Option.isSome(currExperience)} onClosed={() => clearExperience(Option.none())} title={gt(UI_COPY.experienceModal.projectInfo)}>
      {Option.isSome(currExperience) && <ExperienceDetails experience={currExperience.value} />}
    </ExperienceModal>
  );
}
