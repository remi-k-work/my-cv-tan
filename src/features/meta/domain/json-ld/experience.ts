// services, features, and other libraries
import { Option } from "effect";
import { experienceHeadline, excerpt } from "@/features/experience/domain/helpers";
import { breadcrumb, imageObject, jsonLdGraph } from "./core";
import { experienceScreenshot, experienceShareImage } from "@/features/meta/domain/images";
import { absoluteUrl, experiencePath } from "@/features/meta/domain/url";

// types
import type { ExperienceHeadInput, SocialImage } from "@/features/meta/domain/models";

// constants
import { META_DESCRIPTION_LENGTH, PERSON_ID, PUBLISHER_ID, WEBSITE_ID } from "@/features/meta/domain/constants";

// Maps a share image into its schema.org node; both the social tags and this graph
// resolve through images.ts, so og:image and the JSON-LD image are always the same picture
const imageObjectOf = ({ src, width, height }: SocialImage) => imageObject(src, width, height);

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
  const screenshot = Option.map(experienceScreenshot(imageName), imageObjectOf);

  // og:image mirror for the project item below: the screenshot, or the global banner when absent
  const image = imageObjectOf(experienceShareImage(imageName));

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
