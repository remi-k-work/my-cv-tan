// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { Option } from "effect";
import { useGT } from "gt-tanstack-start";
import { loaderIndex } from "@/loaders/index";
import { experienceHead, homeHead } from "@/features/meta/domain/heads";
import { headLanguage } from "@/features/meta/domain/language";
import { partitionExperiences } from "@/features/experience/domain/helpers";

// types
import type { PageTitles } from "@/domain/models";
import type { Experience, ExperienceList } from "@/features/experience/domain/models";

// components
import { PageTitle } from "@/ui/page-title";
import { PageGrid } from "@/ui/page-grid";
import { SliderPanel } from "@/features/experience/ui/slider-panel";
import { ExperienceDetails } from "@/features/experience/ui/experience-details";
import { ExperienceDetailsModal } from "@/features/modals/ui/experience-details-modal";

export const Route = createFileRoute("/{-$slug}")({
  loader: ({ params }) => loaderIndex(Option.fromNullishOr(params.slug)),
  head: ({ loaderData, matches }) => {
    if (!loaderData) return {};

    const preferredLanguage = headLanguage(matches);
    if (loaderData.type === "item") return experienceHead({ experience: loaderData.experience, preferredLanguage });
    if (loaderData.type === "list") return homeHead({ pageTitles: loaderData.stablePageTitles, experienceList: loaderData.experienceList, preferredLanguage });
    return {};
  },
  component: IndexRoutePage,
});

// The route renders one of two distinct pages: the home list (two sliders plus the details
// overlay) or a single experience detail page; each page owns its full output, so this
// dispatcher only decides which page to render
//
// The page components are declared at module scope (not nested inside IndexRoutePage) so that
// re-rendering the route never recreates their component types and forces their subtrees to
// remount — which would reset carousel position, scroll, and focus
function IndexRoutePage() {
  const loaderData = Route.useLoaderData();

  if (loaderData.type === "list") return <HomeListPage pageTitles={loaderData.randomPageTitles} experienceList={loaderData.experienceList} />;
  return <ExperienceItemPage pageTitles={loaderData.randomPageTitles} experience={loaderData.experience} />;
}

// Homepage list: two experience sliders and the overlay that opens a project's details
function HomeListPage({ pageTitles, experienceList }: { pageTitles: PageTitles; experienceList: ExperienceList }) {
  const gt = useGT();

  // Same one-pass split the home JSON-LD collections use, so UI and structured data group identically
  const [employmentHistory, portfolioProjects] = partitionExperiences(experienceList);

  return (
    <>
      <PageTitle pagePath="/" pageTitles={pageTitles} />
      <PageGrid className="auto-rows-fr">
        <SliderPanel title={gt("Experience")} experienceList={employmentHistory} />
        <SliderPanel title={gt("Portfolio Projects")} experienceList={portfolioProjects} />
      </PageGrid>
      {/* Overlay opened by intercepting the "more info" link: no navigation, so the sliders above stay mounted and keep their position */}
      <ExperienceDetailsModal />
    </>
  );
}

// Single experience detail page, reached from the "more info" link on a slide
function ExperienceItemPage({ pageTitles, experience }: { pageTitles: PageTitles; experience: Experience }) {
  return (
    <>
      <PageTitle pagePath="/" pageTitles={pageTitles} />
      <ExperienceDetails experience={experience} />
    </>
  );
}
