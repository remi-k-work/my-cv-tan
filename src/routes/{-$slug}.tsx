// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { Option } from "effect";
import { useGT, useLocale } from "gt-tanstack-start";
import { loaderIndex } from "@/loaders/index";
import { routeHead } from "@/features/meta/domain/route-head";
import { experienceHead, homeHead } from "@/features/meta/domain/page-head";
import { experienceHeadline, partitionExperiences } from "@/features/experience/domain/helpers";
import { experiencePath } from "@/features/meta/domain/urls";
import { preferredLanguageFromLocale } from "@/domain/helpers";

// components
import { PageTitle } from "@/ui/page-title";
import { PageGrid } from "@/ui/page-grid";
import { SliderPanel } from "@/features/experience/ui/slider-panel";
import { ExperienceDetails } from "@/features/experience/ui/experience-details";
import { ExperienceDetailsModal } from "@/features/modals/ui/experience-details-modal";
import { NotFoundPage } from "@/ui/not-found-page";

// types
import type { PageTitles } from "@/domain/models";
import type { Experience, ExperienceList } from "@/features/experience/domain/models";

// constants
import { HOME_PATH } from "@/features/meta/domain/constants";

export const Route = createFileRoute("/{-$slug}")({
  notFoundComponent: NotFoundPage,
  loader: ({ params }) => loaderIndex(Option.fromNullishOr(params.slug)),
  head: ({ loaderData, matches, params }) => {
    const fallbackPath = params.slug ? experiencePath(params.slug) : HOME_PATH;
    return routeHead(
      loaderData,
      matches,
      (data, preferredLanguage) => {
        // The loader resolves either an item or a list; both branches produce a full head.
        if (data.type === "item") return experienceHead({ experience: data.experience, preferredLanguage });
        return homeHead({ pageTitles: data.stablePageTitles, experienceList: data.experienceList, preferredLanguage });
      },
      fallbackPath
    );
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
  return <ExperienceItemPage experience={loaderData.experience} />;
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
function ExperienceItemPage({ experience }: { experience: Experience }) {
  const locale = useLocale();
  const headline = experienceHeadline(experience, preferredLanguageFromLocale(locale));

  // The visible page title matches the identity used by its head, JSON-LD and Markdown twin.
  return <ExperienceDetails experience={experience} heading={headline} headingLevel={1} />;
}
