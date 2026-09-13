import { createFileRoute } from "@tanstack/react-router";
import DataLoader from "@/lib/DataLoader";
import { getRandomInt } from "@/lib/helpers";
import { getLang } from "@/server/i18n.functions";

import PageTitle from "@/components/PageTitle";
import MyCertificates from "@/components/MyCertificates";
import MyEducation from "@/components/MyEducation";

export const Route = createFileRoute("/education")({
  loader: async () => {
    const lang = await getLang();
    const loader = DataLoader.fromLang(lang);
    return {
      localizedContent: loader.localizedContent(),
      allPageTitles: loader.allPageTitles(),
      allEducationSchools: loader.allEducationSchools(),
    };
  },
  component: EducationPage,
});

function EducationPage() {
  const { localizedContent, allPageTitles, allEducationSchools } = Route.useLoaderData();

  return (
    <>
      <PageTitle titleTheme={getRandomInt(0, 2)} pathname="/education" allPageTitles={allPageTitles} />
      <article className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="bg-clr-primary-800 rounded-xl p-4">
          <MyCertificates localizedContent={localizedContent} />
        </section>
        <section className="bg-clr-primary-800 rounded-xl p-4">
          <MyEducation localizedContent={localizedContent} allEducationSchools={allEducationSchools} />
        </section>
      </article>
    </>
  );
}
