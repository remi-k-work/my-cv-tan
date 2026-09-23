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

export const Route = createFileRoute("/exp/$slug")({
  validateSearch: (search) => ({
    modal: search.modal === true || search.modal === "1" || search.modal === 1,
  }),
  loaderDeps: ({ search }) => ({ modal: search.modal }),
  loader: async ({ params }) => {
    const { slug } = params;

    const preferredLanguage = await getLang();
    const loader = DataLoader.fromLang(preferredLanguage);
    const experience = loader.experienceList.find((exp) => exp.slug === slug);
    if (!experience) throw notFound();

    return { pageTitlesList: loader.pageTitlesList, localizedContent: loader.localizedContent, experience } as const;
  },
  component: ExpPage,
});

function ExpPage() {
  const { modal } = Route.useSearch();
  const { pageTitlesList, localizedContent, experience } = Route.useLoaderData();

  const details = (
    <>
      <ExperienceDetailsSeo experience={experience} />
      <ExperienceDetails localizedContent={localizedContent} experience={experience} />
    </>
  );

  // In-app clicks link with ?modal=1 to preserve the Next.js intercepting-modal UX;
  // direct loads / refreshes render the full page (SEO-friendly).
  if (modal) {
    return <ExperienceModal localizedContent={localizedContent}>{details}</ExperienceModal>;
  }

  return (
    <>
      <PageTitle titleTheme={getRandomInt(0, 2)} pagePath="/" pageTitlesList={pageTitlesList} />
      {details}
    </>
  );
}
