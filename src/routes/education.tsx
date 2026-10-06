// tanstack
import { createFileRoute, notFound } from "@tanstack/react-router";

// services, features, and other libraries
import { loaderEducation } from "@/loaders/education";
import { educationHead, headLanguage } from "@/features/meta/domain";

// components
import { PageTitle } from "@/ui/page-title";
import { Certificates } from "@/features/education/ui/certificates";
import { Education } from "@/features/education/ui/education";

export const Route = createFileRoute("/education")({
  loader: () => loaderEducation(),
  head: ({ loaderData, matches }) =>
    educationHead({
      pageTitles: loaderData?.randomPageTitles ?? null,
      educationList: loaderData?.educationList ?? null,
      preferredLanguage: headLanguage(matches),
    }),
  component: EducationPage,
});

function EducationPage() {
  const { randomPageTitles, localizedContent, educationList } = Route.useLoaderData();
  if (!randomPageTitles || !localizedContent || !educationList) throw notFound();

  return (
    <>
      <PageTitle pagePath="/education" pageTitles={randomPageTitles} />
      <article className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-xl bg-surface-2 p-4">
          <Certificates localizedContent={localizedContent} />
        </section>
        <section className="rounded-xl bg-surface-2 p-4">
          <Education localizedContent={localizedContent} educationList={educationList} />
        </section>
      </article>
    </>
  );
}
