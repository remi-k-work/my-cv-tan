// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { loaderEducation } from "@/loaders/education";
import { routeHead } from "@/features/meta/domain/route-head";
import { educationHead } from "@/features/meta/domain/page-head";

// components
import { Certificates } from "@/features/education/ui/certificates";
import { Education } from "@/features/education/ui/education";
import { PageGrid } from "@/ui/page-grid";
import { PagePanel } from "@/ui/page-panel";
import { PageTitle } from "@/ui/page-title";

// constants
import { EDUCATION_PATH } from "@/domain/constants";

export const Route = createFileRoute("/education")({
  loader: () => loaderEducation(),
  head: ({ loaderData, matches, match }) =>
    routeHead({
      loaderData,
      matches,
      matchStatus: match.status,
      fallbackPath: EDUCATION_PATH,
      build: (data, preferredLanguage) => educationHead({ pageTitles: data.stablePageTitles, educationList: data.educationList, preferredLanguage }),
    }),
  component: EducationPage,
});

function EducationPage() {
  const { randomPageTitles, educationList } = Route.useLoaderData();

  return (
    <>
      <PageTitle pagePath="/education" pageTitles={randomPageTitles} />
      <PageGrid>
        <PagePanel>
          <Certificates />
        </PagePanel>
        <PagePanel>
          <Education educationList={educationList} />
        </PagePanel>
      </PageGrid>
    </>
  );
}
