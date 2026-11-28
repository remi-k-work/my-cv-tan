// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { useLocale } from "gt-tanstack-start";
import { loaderContact } from "@/loaders/contact";
import { routeHead } from "@/features/document-head/domain/route-head";
import { contactHead } from "@/features/document-head/domain/page-head";
import { preferredLanguageFromLocale } from "@/domain/helpers";
import { pageHeading } from "@/domain/pages";

// components
import { ContactForm } from "@/features/contact-me/ui/contact-form";
import { ContactMap } from "@/features/contact-me/ui/contact-map";
import { PageGrid } from "@/ui/page-grid";
import { PagePanel } from "@/ui/page-panel";
import { PageTitle } from "@/ui/page-title";

// constants
import { CONTACT_PATH } from "@/domain/constants";

export const Route = createFileRoute("/contact")({
  loader: ({ abortController }) => loaderContact(abortController.signal),
  head: ({ loaderData, matches, match }) =>
    routeHead({
      loaderData,
      matches,
      matchStatus: match.status,
      fallbackPath: CONTACT_PATH,
      build: (_data, preferredLanguage) => contactHead({ preferredLanguage }),
    }),
  component: ContactPage,
});

function ContactPage() {
  const { randomPageHighlights } = Route.useLoaderData();
  const { eyebrow, intro } = randomPageHighlights[CONTACT_PATH];
  const heading = pageHeading(CONTACT_PATH, preferredLanguageFromLocale(useLocale()));

  return (
    <>
      <PageTitle heading={heading} eyebrow={eyebrow} intro={intro} />
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
