// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { Array, Option } from "effect";
import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { loaderIndex } from "@/loaders/index";
import { experienceHead, headLanguage, homeListHead } from "@/features/meta/domain";
import { experienceAtom } from "@/features/modals/state";

// components
import { PageTitle } from "@/ui/page-title";
import { SliderPanel } from "@/features/experience/ui/slider-panel";
import { ExperienceDetails } from "@/features/experience/ui/experience-details";
import { ExperienceModal } from "@/features/modals/ui/experience";

// types
import type { LocalizedContent } from "@/domain";

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
  const loaderData = Route.useLoaderData();

  if (loaderData.type === "list") {
    const { randomPageTitles, localizedContent, experienceList } = loaderData;

    return (
      <>
        <PageTitle pagePath="/" pageTitles={randomPageTitles} />
        <article className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <SliderPanel
            title={localizedContent["pageHome"]["experience"]}
            localizedContent={localizedContent}
            experienceList={Array.filter(experienceList, ({ type }) => type === "e")}
          />
          <SliderPanel
            title={localizedContent["pageHome"]["portfolioProjects"]}
            localizedContent={localizedContent}
            experienceList={Array.filter(experienceList, ({ type }) => type === "p")}
          />
        </article>
        {/* Overlay opened by intercepting the "more info" link: no navigation, so the sliders above stay mounted and keep their position */}
        <ExperienceDetailsModal localizedContent={localizedContent} />
      </>
    );
  }

  const { randomPageTitles, localizedContent, experience } = loaderData;

  return (
    <>
      <PageTitle pagePath="/" pageTitles={randomPageTitles} />
      <ExperienceDetails localizedContent={localizedContent} experience={experience} />
    </>
  );
}

// Subscribes to the selected experience in isolation, so opening/closing the overlay doesn't re-render the sliders it sits on top of
function ExperienceDetailsModal({ localizedContent }: { localizedContent: LocalizedContent }) {
  const currExperience = useAtomValue(experienceAtom);
  const clearExperience = useAtomSet(experienceAtom);

  return (
    <ExperienceModal
      isOpen={Option.isSome(currExperience)}
      onClosed={() => clearExperience(Option.none())}
      title={localizedContent["experienceModal"]["projectInfo"]}
    >
      {Option.isSome(currExperience) && <ExperienceDetails localizedContent={localizedContent} experience={currExperience.value} />}
    </ExperienceModal>
  );
}
