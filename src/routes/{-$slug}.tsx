// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { Array, Option, Result } from "effect";
import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { useGT } from "gt-tanstack-start";
import { loaderIndex } from "@/loaders/index";
import { experienceHead, homeHead } from "@/features/meta/domain/heads";
import { headLanguage } from "@/features/meta/domain/language";
import { experienceAtom } from "@/features/modals/state/experience";

// components
import { PageTitle } from "@/ui/page-title";
import { SliderPanel } from "@/features/experience/ui/slider-panel";
import { ExperienceDetails } from "@/features/experience/ui/experience-details";
import { ExperienceModal } from "@/features/modals/ui/experience";

export const Route = createFileRoute("/{-$slug}")({
  loader: ({ params }) => loaderIndex(Option.fromNullishOr(params.slug)),
  head: ({ loaderData, matches }) => {
    if (!loaderData) return {};

    const preferredLanguage = headLanguage(matches);
    if (loaderData.type === "item") return experienceHead({ experience: loaderData.experience, preferredLanguage });
    if (loaderData.type === "list") return homeHead({ pageTitles: loaderData.stablePageTitles, experienceList: loaderData.experienceList, preferredLanguage });
    return {};
  },
  component: HomePage,
});

function HomePage() {
  const gt = useGT();
  const loaderData = Route.useLoaderData();

  if (loaderData.type === "list") {
    const { randomPageTitles, experienceList } = loaderData;

    // Split the mixed experience list into its two kinds in a single pass: employment history ("e") and portfolio projects ("p")
    const [employmentHistory, portfolioProjects] = Array.partition(experienceList, (experience) =>
      experience.type === "e" ? Result.succeed(experience) : Result.fail(experience)
    );

    return (
      <>
        <PageTitle pagePath="/" pageTitles={randomPageTitles} />
        <div className="grid animate-rise grid-cols-1 gap-4 [animation-delay:0.5s] xl:grid-cols-2">
          <SliderPanel title={gt("Experience")} experienceList={employmentHistory} />
          <SliderPanel title={gt("Portfolio Projects")} experienceList={portfolioProjects} />
        </div>
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
    <ExperienceModal isOpen={Option.isSome(currExperience)} onClosed={() => clearExperience(Option.none())} title={gt("Project Info & Description")}>
      {Option.match(currExperience, {
        onNone: () => null,
        onSome: (experience) => <ExperienceDetails experience={experience} />,
      })}
    </ExperienceModal>
  );
}
