// services, features, and other libraries
import { Option, pipe } from "effect";
import { experienceHeadline, excerpt } from "@/features/experience/domain/helpers";
import { breadcrumb, imageObject, jsonLdGraph } from "./core";
import { absoluteUrl, experienceImageUrl, experiencePath } from "../url";

// types
import type { ExperienceHeadInput } from "../models";

// constants
import { GLOBAL_IMAGE, GLOBAL_SOCIAL_IMAGE, META_DESCRIPTION_LENGTH, PERSON_ID, PUBLISHER_ID, WEBSITE_ID } from "../constants";
import { SCREENSHOT_HEIGHT, SCREENSHOT_WIDTH } from "@/features/experience/domain/constants";

// Employment is an organization role; projects use the most specific supported creative-work type
export const experienceJsonLd = ({ experience, preferredLanguage }: ExperienceHeadInput) => {
  const { type, slug, role, company, txt, imageName, skillsUsed, gitHubLink } = experience;

  // One named branch instead of three scattered ternaries
  const employment = type === "e";
  const path = experiencePath(slug);
  const url = absoluteUrl(path);
  const headline = experienceHeadline(experience, preferredLanguage);

  // Distinct fragment ids keep the two detail kinds separately addressable
  const itemId = `${url}#${employment ? "organization-role" : "project"}`;
  const description = excerpt(txt, META_DESCRIPTION_LENGTH);

  // The webp screenshot is the page's main image; dimensions included so scrapers skip a fetch
  const screenshot = pipe(
    experienceImageUrl(imageName),
    Option.map((src) => imageObject(src, SCREENSHOT_WIDTH, SCREENSHOT_HEIGHT))
  );

  // og:image mirror for the project item below: the screenshot, or the global banner when absent
  const image = Option.getOrElse(screenshot, () => imageObject(GLOBAL_IMAGE, GLOBAL_SOCIAL_IMAGE.width, GLOBAL_SOCIAL_IMAGE.height));

  const page = {
    "@type": "WebPage",
    "@id": url,
    url,
    name: headline,
    description,
    inLanguage: preferredLanguage,
    isPartOf: { "@id": WEBSITE_ID },
    breadcrumb: { "@id": `${url}#breadcrumb` },
    mainEntity: { "@id": itemId },
    // Claimed only when the screenshot really renders on the page; the banner fallback never is
    ...(Option.isSome(screenshot) ? { primaryImageOfPage: screenshot.value } : {}),
  };

  // A repository link identifies source code; projects without one remain generic creative works
  const item = employment
    ? {
        "@type": "OrganizationRole",
        "@id": itemId,
        roleName: role,
        // Language-tagged claims extract cleanly, like on the project node below
        inLanguage: preferredLanguage,
        description,
        member: { "@id": PERSON_ID },
        mainEntityOfPage: { "@id": url },
      }
    : {
        "@type": gitHubLink ? "SoftwareSourceCode" : "CreativeWork",
        "@id": itemId,
        name: role,
        description,
        image,
        url,
        mainEntityOfPage: { "@id": url },
        inLanguage: preferredLanguage,
        creator: { "@id": PERSON_ID },
        publisher: { "@id": PUBLISHER_ID },
        keywords: skillsUsed.join(", "),
        ...(gitHubLink ? { codeRepository: gitHubLink } : {}),
      };

  // Employment pages also describe the employer, cross-referenced with the role
  const organization = employment
    ? [
        {
          "@type": "Organization",
          "@id": `${url}#organization`,
          name: company,
          member: { "@id": itemId },
        },
      ]
    : [];

  return jsonLdGraph([page, ...organization, item, breadcrumb(preferredLanguage, path, headline)]);
};
