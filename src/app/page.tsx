// other libraries
import DataLoader from "@/lib/DataLoader";
import { getRandomInt } from "@/lib/helpers";

// components
import PageTitle from "@/components/PageTitle";
import ExperienceSlider from "@/components/experience-slider";
import ExperienceSliderSeo from "@/components/experience-slider/SeoVer";

export default async function Page() {
  // Create an instance of the data loader needed for localization
  const { localizedContent, allExperiences } = await DataLoader.create();

  return (
    <>
      <PageTitle titleTheme={getRandomInt(0, 2)} pathname="/" />
      <article className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="bg-clr-primary-800 rounded-xl p-4">
          <figure className="mx-auto w-full max-w-4xl">
            <figcaption className="bg-primary-foreground mb-4 place-self-end rounded-ss-xl rounded-ee-xl p-3 italic">
              {localizedContent()["pageHome"]["experience"]}
            </figcaption>
            <ExperienceSliderSeo allExperiences={allExperiences()} type="e" />
            <ExperienceSlider localizedContent={localizedContent()} allExperiences={allExperiences()} type="e" />
          </figure>
        </section>
        <section className="bg-clr-primary-800 rounded-xl p-4">
          <figure className="mx-auto w-full max-w-4xl">
            <figcaption className="bg-primary-foreground mb-4 place-self-end rounded-ss-xl rounded-ee-xl p-3 italic">
              {localizedContent()["pageHome"]["portfolioProjects"]}
            </figcaption>
            <ExperienceSliderSeo allExperiences={allExperiences()} type="p" />
            <ExperienceSlider localizedContent={localizedContent()} allExperiences={allExperiences()} type="p" />
          </figure>
        </section>
      </article>
    </>
  );
}
