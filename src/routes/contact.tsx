// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { loaderContact } from "@/loaders/contact";
import { CONTACT_PATH } from "@/features/meta/domain/static-pages";
import { contactHead, routeHead } from "@/features/meta/domain/heads";

// components
import { ContactForm } from "@/features/contact-me/ui/contact-form";
import { ContactMap } from "@/features/contact-me/ui/contact-map";
import { PageGrid } from "@/ui/page-grid";
import { PagePanel } from "@/ui/page-panel";
import { PageTitle } from "@/ui/page-title";

export const Route = createFileRoute("/contact")({
  loader: () => loaderContact(),
  head: ({ loaderData, matches }) =>
    routeHead(
      loaderData,
      matches,
      (data, preferredLanguage) => contactHead({ pageTitles: data.stablePageTitles, preferredLanguage }),
      CONTACT_PATH
    ),
  component: ContactPage,
});

function ContactPage() {
  const { randomPageTitles } = Route.useLoaderData();

  return (
    <>
      <PageTitle pagePath="/contact" pageTitles={randomPageTitles} />
      <PageGrid className="auto-rows-fr">
        <PagePanel>
          <ContactForm />
        </PagePanel>
        <PagePanel>
          <ContactMap />
        </PagePanel>
      </PageGrid>
    </>
  );
}
