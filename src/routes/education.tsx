// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { loaderEducation } from "@/loaders/education";
import { educationHead, headLanguage } from "@/features/meta/domain";

// components
import { PageTitle } from "@/ui/page-title";
import { Certificates } from "@/features/education/ui/certificates";
import { Education } from "@/features/education/ui/education";

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
      <article className="grid animate-rise grid-cols-1 gap-4 [animation-delay:0.15s] xl:grid-cols-2">
        <section className="rounded-xl bg-surface-2 p-4">
          <Certificates />
        </section>
        <section className="rounded-xl bg-surface-2 p-4">
          <Education educationList={educationList} />
        </section>
      </article>
    </>
  );
}
