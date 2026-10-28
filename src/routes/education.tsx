// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { loaderEducation } from "@/loaders/education";
import { educationHead } from "@/features/meta/domain/heads";
import { headLanguage } from "@/features/meta/domain/language";

// components
import { Certificates } from "@/features/education/ui/certificates";
import { Education } from "@/features/education/ui/education";
import { PageGrid } from "@/ui/page-grid";
import { PagePanel } from "@/ui/page-panel";
import { PageTitle } from "@/ui/page-title";

export const Route = createFileRoute("/education")({
  loader: () => loaderEducation(),
  head: ({ loaderData, matches }) => {
    if (!loaderData) return {};
    return educationHead({ pageTitles: loaderData.stablePageTitles, educationList: loaderData.educationList, preferredLanguage: headLanguage(matches) });
  },
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
