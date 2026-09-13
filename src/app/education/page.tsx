// other libraries
import { getRandomInt } from "@/lib/helpers";

// components
import PageTitle from "@/components/PageTitle";
import MyCertificates from "@/components/MyCertificates";
import MyEducation from "@/components/MyEducation";

export default async function Page() {
  return (
    <>
      <PageTitle titleTheme={getRandomInt(0, 2)} pathname="/education" />
      <article className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="bg-clr-primary-800 rounded-xl p-4">
          <MyCertificates />
        </section>
        <section className="bg-clr-primary-800 rounded-xl p-4">
          <MyEducation />
        </section>
      </article>
    </>
  );
}
