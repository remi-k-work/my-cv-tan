// other libraries
import DataLoader from "@/lib/DataLoader";
import { getRandomInt } from "@/lib/helpers";

// components
import PageTitle from "@/components/PageTitle";
import ExperienceDetails from "@/components/experience-details";
import ExperienceDetailsSeo from "@/components/experience-details/SeoVer";

export default async function Page({ params: paramsPromise }: PageProps<"/exp/[type]/[index]">) {
  const { type, index } = await paramsPromise;
  const validType = type === "e" || type === "p" ? type : "e";
  const validIndex = Number(index);

  // Create an instance of the data loader needed for localization
  const { localizedContent, allExperiences } = await DataLoader.create();

  return (
    <>
      <PageTitle titleTheme={getRandomInt(0, 2)} pathname="/" />
      <ExperienceDetailsSeo allExperiences={allExperiences()} type={validType} index={validIndex} />
      <ExperienceDetails localizedContent={localizedContent()} allExperiences={allExperiences()} type={validType} index={validIndex} />
    </>
  );
}
