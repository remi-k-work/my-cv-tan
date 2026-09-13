// other libraries
import DataLoader from "@/lib/DataLoader";
import { getRandomInt } from "@/lib/helpers";

// components
import PageTitle from "@/components/PageTitle";
import ContactForm from "@/components/ContactForm";
import ContactMap from "@/components/ContactMap";

export default async function Page() {
  // Create an instance of the data loader needed for localization
  const { lang, localizedContent } = await DataLoader.create();

  return (
    <>
      <PageTitle titleTheme={getRandomInt(0, 2)} pathname="/contact" />
      <article className="grid auto-rows-fr grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="bg-clr-primary-800 rounded-xl p-4">
          <ContactForm preferredLang={lang} localizedContent={localizedContent()} />
        </section>
        <section className="bg-clr-primary-800 rounded-xl p-4">
          <ContactMap localizedContent={localizedContent()} />
        </section>
      </article>
    </>
  );
}
