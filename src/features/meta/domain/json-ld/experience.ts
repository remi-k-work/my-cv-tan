// services, features, and other libraries
import { Array, Option } from "effect";
import { experienceHeadline, excerpt } from "@/features/experience/domain/helpers";
import { breadcrumb, imageObject, jsonLdGraph, webPageNode } from "./core";
import { experienceScreenshot } from "@/features/meta/domain/images";
import { absoluteUrl, experiencePath } from "@/features/meta/domain/url";

// types
import type { ExperienceHeadInput } from "@/features/meta/domain/models";

// constants
import { META_DESCRIPTION_LENGTH, PERSON_ID, PUBLISHER_ID } from "@/features/meta/domain/constants";

// Detail structured data: builds a WebPage node linked to an OrganizationRole or SoftwareSourceCode main entity
export const experienceJsonLd = ({ experience, preferredLanguage }: ExperienceHeadInput) => {
  const { type, slug, role, company, txt, imageName, skillsUsed, gitHubLink } = experience;

  // Disambiguate employment roles from creative portfolio software projects
  const employment = type === "e";
  const path = experiencePath(slug);
  const url = absoluteUrl(path);
  const headline = experienceHeadline(experience, preferredLanguage);

  // Distinct fragment ids keep entity types separately addressable in the knowledge graph
  const itemId = `${url}#${employment ? "organization-role" : "project"}`;
  const description = excerpt(txt, META_DESCRIPTION_LENGTH);

  // Resolves screenshot dimensions only when an actual image asset is present
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
    // Only claim primaryImageOfPage when screenshot exists (prevent claiming non-rendered images)
    primaryImageOfPage: Option.getOrUndefined(screenshot),
  });

  // Source repositories map to SoftwareSourceCode; employment maps to OrganizationRole linked to person
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
        ...(Option.isSome(screenshot) ? { image: screenshot.value } : {}),
        url,
        mainEntityOfPage: { "@id": url },
        inLanguage: preferredLanguage,
        creator: { "@id": PERSON_ID },
        publisher: { "@id": PUBLISHER_ID },
        keywords: Array.join(skillsUsed, ", "),
        ...(gitHubLink ? { codeRepository: gitHubLink } : {}),
      };

  // Employment nodes link reciprocal Organization entity for employer graph resolution
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
