// services, features, and other libraries
import { Option } from "effect";
import { experienceHeadline, excerpt } from "@/features/experience/domain/helpers";
import { breadcrumb, imageObject, jsonLdGraph, webPageNode } from "./core";
import { experienceScreenshot } from "@/features/meta/domain/images";
import { absoluteUrl, experiencePath } from "@/features/meta/domain/url";

// types
import type { ExperienceHeadInput } from "@/features/meta/domain/models";

// constants
import { META_DESCRIPTION_LENGTH, PERSON_ID, PUBLISHER_ID } from "@/features/meta/domain/constants";

// Detail page: one WebPage about the single role or project the page and its .md twin both show
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

  // The webp screenshot is the page's main image; None means no screenshot renders on the page,
  // so structured data must not claim a picture it cannot show
  const screenshot = Option.map(experienceScreenshot(imageName), ({ src, width, height }) => imageObject(src, width, height));

  const page = webPageNode({
    type: "WebPage",
    id: url,
    url,
    name: headline,
    description,
    preferredLanguage,
    breadcrumb: true,
    mainEntity: { "@id": itemId },
    // Claimed only when the screenshot really renders on the page; the banner fallback never is
    primaryImageOfPage: Option.getOrUndefined(screenshot),
  });

  // A repository link identifies source code; projects without one remain generic creative works
  const item = employment
    ? {
        "@type": "OrganizationRole",
        "@id": itemId,
        roleName: role,
        description,
        member: { "@id": PERSON_ID },
        mainEntityOfPage: { "@id": url },
      }
    : {
        "@type": gitHubLink ? "SoftwareSourceCode" : "CreativeWork",
        "@id": itemId,
        name: role,
        description,
        // Only a rendered screenshot is claimed; the global banner is not this work's image
        ...(Option.isSome(screenshot) ? { image: screenshot.value } : {}),
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
