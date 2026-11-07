// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { loaderContact } from "@/loaders/contact";
import { routeHead } from "@/features/meta/domain/route-head";
import { contactHead } from "@/features/meta/domain/page-head";

// components
import { ContactForm } from "@/features/contact-me/ui/contact-form";
import { ContactMap } from "@/features/contact-me/ui/contact-map";
import { PageGrid } from "@/ui/page-grid";
import { PagePanel } from "@/ui/page-panel";
import { PageTitle } from "@/ui/page-title";

// constants
import { CONTACT_PATH } from "@/domain/constants";

export const Route = createFileRoute("/contact")({
  loader: () => loaderContact(),
  head: ({ loaderData, matches, match }) =>
    routeHead({
      loaderData,
      matches,
      matchStatus: match.status,
      fallbackPath: CONTACT_PATH,
      build: (data, preferredLanguage) => contactHead({ pageTitles: data.stablePageTitles, preferredLanguage }),
    }),
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
