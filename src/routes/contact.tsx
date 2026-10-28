// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { loaderContact } from "@/loaders/contact";
import { contactHead } from "@/features/meta/domain/heads";
import { headLanguage } from "@/features/meta/domain/language";

// components
import { ContactForm } from "@/features/contact-me/ui/contact-form";
import { ContactMap } from "@/features/contact-me/ui/contact-map";
import { PageGrid } from "@/ui/page-grid";
import { PagePanel } from "@/ui/page-panel";
import { PageTitle } from "@/ui/page-title";

export const Route = createFileRoute("/contact")({
  loader: () => loaderContact(),
  head: ({ loaderData, matches }) => {
    if (!loaderData) return {};
    return contactHead({ pageTitles: loaderData.stablePageTitles, preferredLanguage: headLanguage(matches) });
  },
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
