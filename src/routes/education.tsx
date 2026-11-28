// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { useLocale } from "gt-tanstack-start";
import { loaderEducation } from "@/loaders/education";
import { routeHead } from "@/features/document-head/domain/route-head";
import { educationHead } from "@/features/document-head/domain/page-head";
import { preferredLanguageFromLocale } from "@/domain/helpers";
import { pageHeading } from "@/domain/pages";

// components
import { Certificates } from "@/features/education/ui/certificates";
import { Education } from "@/features/education/ui/education";
import { PageGrid } from "@/ui/page-grid";
import { PagePanel } from "@/ui/page-panel";
import { PageTitle } from "@/ui/page-title";

// constants
import { EDUCATION_PATH } from "@/domain/constants";

export const Route = createFileRoute("/education")({
  loader: ({ abortController }) => loaderEducation(abortController.signal),
  head: ({ loaderData, matches, match }) =>
    routeHead({
      loaderData,
      matches,
      matchStatus: match.status,
      fallbackPath: EDUCATION_PATH,
      build: (data, preferredLanguage) => educationHead({ educationList: data.educationList, preferredLanguage }),
    }),
  component: EducationPage,
});

function EducationPage() {
  const { randomPageHighlights, educationList } = Route.useLoaderData();
  const { eyebrow, intro } = randomPageHighlights[EDUCATION_PATH];
  const heading = pageHeading(EDUCATION_PATH, preferredLanguageFromLocale(useLocale()));

  return (
    <>
      <PageTitle heading={heading} eyebrow={eyebrow} intro={intro} />
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
