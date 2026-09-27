// tanstack
import { createFileRoute, notFound } from "@tanstack/react-router";

// services, features, and other libraries
import { loaderContact } from "@/loaders/contact";

// components
import { PageTitle } from "@/ui/page-title";
import { ContactForm } from "@/features/contact-me/ui/contact-form";
import { ContactMap } from "@/features/contact-me/ui/contact-map";

export const Route = createFileRoute("/contact")({ loader: () => loaderContact(), component: ContactPage });

function ContactPage() {
  const { preferredLanguage, randomPageTitles, localizedContent } = Route.useLoaderData();
  if (!randomPageTitles || !localizedContent) throw notFound();

  return (
    <>
      <PageTitle pagePath="/contact" pageTitles={randomPageTitles} />
      <article className="grid auto-rows-fr grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-xl bg-clr-primary-800 p-4">
          <ContactForm preferredLanguage={preferredLanguage} localizedContent={localizedContent} />
        </section>
        <section className="rounded-xl bg-clr-primary-800 p-4">
          <ContactMap localizedContent={localizedContent} />
        </section>
      </article>
    </>
  );
}
