// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { loaderContact } from "@/loaders/contact";
import { contactHead, headLanguage } from "@/features/meta/domain";

// components
import { PageTitle } from "@/ui/page-title";
import { ContactForm } from "@/features/contact-me/ui/contact-form";
import { ContactMap } from "@/features/contact-me/ui/contact-map";

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
      <article className="grid auto-rows-fr grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-xl bg-surface-2 p-4">
          <ContactForm />
        </section>
        <section className="rounded-xl bg-surface-2 p-4">
          <ContactMap />
        </section>
      </article>
    </>
  );
}
