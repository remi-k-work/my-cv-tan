import { createFileRoute } from "@tanstack/react-router";
import DataLoader from "@/lib/DataLoader";
import { getRandomInt } from "@/lib/helpers";
import { getLang } from "@/server/i18n.functions";

import PageTitle from "@/components/PageTitle";
import ContactForm from "@/components/ContactForm";
import ContactMap from "@/components/ContactMap";

export const Route = createFileRoute("/contact")({
  loader: async () => {
    const lang = await getLang();
    const loader = DataLoader.fromLang(lang);
    return {
      lang,
      localizedContent: loader.localizedContent(),
      allPageTitles: loader.allPageTitles(),
    };
  },
  component: ContactPage,
});

function ContactPage() {
  const { lang, localizedContent, allPageTitles } = Route.useLoaderData();

  return (
    <>
      <PageTitle titleTheme={getRandomInt(0, 2)} pathname="/contact" allPageTitles={allPageTitles} />
      <article className="grid auto-rows-fr grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="bg-clr-primary-800 rounded-xl p-4">
          <ContactForm preferredLang={lang} localizedContent={localizedContent} />
        </section>
        <section className="bg-clr-primary-800 rounded-xl p-4">
          <ContactMap localizedContent={localizedContent} />
        </section>
      </article>
    </>
  );
}
