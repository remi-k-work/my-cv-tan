// tanstack
import { createFileRoute, notFound } from "@tanstack/react-router";

// services, features, and other libraries
import DataLoader from "@/lib/DataLoader";
import { getRandomInt } from "@/lib/helpers";
import { getLang } from "@/server/i18n.functions";

// components
import PageTitle from "@/components/PageTitle";
import ExperienceModal from "@/components/ExperienceModal";
import ExperienceDetails from "@/components/experience-details";
import ExperienceDetailsSeo from "@/components/experience-details/SeoVer";

export const Route = createFileRoute("/exp/$type/$index")({
  validateSearch: (search) => ({
    modal: search.modal === true || search.modal === "1" || search.modal === 1,
  }),
  loaderDeps: ({ search }) => ({ modal: search.modal }),
  loader: async ({ params }) => {
    const { type, index } = params;
    const validType: "e" | "p" = type === "e" || type === "p" ? type : "e";
    const validIndex = Number(index);
    if (!Number.isInteger(validIndex) || validIndex < 0) throw notFound();

    const preferredLanguage = await getLang();
    const loader = DataLoader.fromLang(preferredLanguage);
    const experience = loader.experience;
    const list = experience[validType === "e" ? 0 : 1];
    if (validIndex >= list.length) throw notFound();

    return { validType, validIndex, localizedContent: loader.localizedContent, experience, pageTitles: loader.pageTitles } as const;
  },
  component: ExpPage,
});

function ExpPage() {
  const { modal } = Route.useSearch();
  const { validType, validIndex, localizedContent, experience, pageTitles } = Route.useLoaderData();

  const details = (
    <>
      <ExperienceDetailsSeo experience={experience} type={validType} index={validIndex} />
      <ExperienceDetails localizedContent={localizedContent} experience={experience} type={validType} index={validIndex} />
    </>
  );

  // In-app clicks link with ?modal=1 to preserve the Next.js intercepting-modal UX;
  // direct loads / refreshes render the full page (SEO-friendly).
  if (modal) {
    return <ExperienceModal localizedContent={localizedContent}>{details}</ExperienceModal>;
  }

  return (
    <>
      <PageTitle titleTheme={getRandomInt(0, 2)} pathname="/" pageTitles={pageTitles} />
      {details}
    </>
  );
}
