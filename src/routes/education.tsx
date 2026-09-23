// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import DataLoader from "@/lib/DataLoader";
import { getRandomInt } from "@/lib/helpers";
import { getLang } from "@/server/i18n.functions";

// components
import PageTitle from "@/components/PageTitle";
import MyCertificates from "@/components/MyCertificates";
import MyEducation from "@/components/MyEducation";

export const Route = createFileRoute("/education")({
  loader: async () => {
    const preferredLanguage = await getLang();
    const loader = DataLoader.fromLang(preferredLanguage);
    return { pageTitles: loader.pageTitles, localizedContent: loader.localizedContent, education: loader.education } as const;
  },
  component: EducationPage,
});

function EducationPage() {
  const { pageTitles, localizedContent, education } = Route.useLoaderData();

  return (
    <>
      <PageTitle titleTheme={getRandomInt(0, 2)} pathname="/education" pageTitles={pageTitles} />
      <article className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-xl bg-clr-primary-800 p-4">
          <MyCertificates localizedContent={localizedContent} />
        </section>
        <section className="rounded-xl bg-clr-primary-800 p-4">
          <MyEducation localizedContent={localizedContent} education={education} />
        </section>
      </article>
    </>
  );
}
