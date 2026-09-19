// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import DataLoader from "@/lib/DataLoader";
import { getRandomInt } from "@/lib/helpers";
import { getLang } from "@/server/i18n.functions";

// components
import PageTitle from "@/components/PageTitle";
import { ContactForm } from "@/features/contact-me/ui/contact-form";
import { ContactMap } from "@/features/contact-me/ui/contact-map";

export const Route = createFileRoute("/contact")({
  loader: async () => {
    const lang = await getLang();
    const loader = DataLoader.fromLang(lang);
    return { lang, localizedContent: loader.localizedContent(), allPageTitles: loader.allPageTitles() } as const;
  },
  component: ContactPage,
});

function ContactPage() {
  const { lang, localizedContent, allPageTitles } = Route.useLoaderData();

  return (
    <>
      <PageTitle titleTheme={getRandomInt(0, 2)} pathname="/contact" allPageTitles={allPageTitles} />
      <article className="grid auto-rows-fr grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-xl bg-clr-primary-800 p-4">
          <ContactForm preferredLanguage={lang} localizedContent={localizedContent} />
        </section>
        <section className="rounded-xl bg-clr-primary-800 p-4">
          <ContactMap localizedContent={localizedContent} />
        </section>
      </article>
    </>
  );
}
