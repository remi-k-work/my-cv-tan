// tanstack
import { createFileRoute, notFound } from "@tanstack/react-router";

// services, features, and other libraries
import { loaderExp } from "@/loaders/exp";

// components
import { PageTitle } from "@/ui/page-title";
import { ExperienceModal } from "@/ui/experience-modal";
import { ExperienceDetails } from "@/ui/experience-details";
import { ExperienceDetailsSeo } from "@/ui/experience-details/seo-ver";

export const Route = createFileRoute("/exp/$slug")({
  validateSearch: (search) => ({ modal: search.modal === true || search.modal === "1" || search.modal === 1 }),
  loader: ({ params }) => loaderExp(params.slug),
  component: ExpPage,
});

function ExpPage() {
  const { modal } = Route.useSearch();
  const { randomPageTitles, localizedContent, experience } = Route.useLoaderData();
  if (!randomPageTitles || !localizedContent || !experience) throw notFound();

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
      <PageTitle pagePath="/" pageTitles={randomPageTitles} />
      {details}
    </>
  );
}
