// Detail structured data: WebPage linked to OrganizationRole or SoftwareSourceCode main entity.
import { Array, Option } from "effect";
import { experienceHeadline, excerpt } from "@/features/experience/domain/helpers";
import { articleNode, imageObject, pageGraph, personEdge, type JsonLdNodes } from "./core";
import { absoluteUrl, experiencePath, experienceScreenshot } from "../url";
import { META_DESCRIPTION_LENGTH, PERSON_ID, PUBLISHER_ID } from "../constants";

// types
import type { ExperienceHeadInput } from "../models";

export const experienceJsonLd = ({ experience, preferredLanguage }: ExperienceHeadInput): JsonLdNodes => {
  const { type, slug, role, company, txt, year, imageName, skillsUsed, gitHubLink } = experience;

  // Disambiguate employment roles from creative portfolio software projects
  const employment = type === "e";
  const path = experiencePath(slug);
  const url = absoluteUrl(path);
  const headline = experienceHeadline(experience, preferredLanguage);

  // Distinct fragment ids keep entity types separately addressable in the knowledge graph
  const itemId = `${url}#${employment ? "organization-role" : "project"}`;
  const articleId = `${url}#article`;
  const description = excerpt(txt, META_DESCRIPTION_LENGTH);

  // Only claim an image when an actual screenshot asset is present.
  const screenshot = Option.map(experienceScreenshot(imageName), ({ src, width, height }) => imageObject(src, width, height));

  // WebPage entity pointing to the Article as its main entity, with year-level freshness.
  const page = pageGraph({
    type: "WebPage",
    path,
    name: headline,
    description,
    preferredLanguage,
    mainEntity: { "@id": articleId },
    primaryImageOfPage: Option.getOrUndefined(screenshot),
    datePublished: year,
  });

  // Employment roles map to OrganizationRole; projects map to SoftwareSourceCode or CreativeWork.
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
        image: Option.getOrUndefined(screenshot),
        url,
        mainEntityOfPage: { "@id": url },
        inLanguage: preferredLanguage,
        creator: { "@id": PERSON_ID },
        publisher: { "@id": PUBLISHER_ID },
        keywords: Array.join(skillsUsed, ", "),
        codeRepository: gitHubLink,
      };

  // Employment includes Organization and reciprocal worksFor Person edge.
  const employmentNodes = employment
    ? [
        {
          "@type": "Organization",
          "@id": `${url}#organization`,
          name: company,
          member: { "@id": itemId },
        },
        item,
        personEdge({ worksFor: { "@id": `${url}#organization` } }),
      ]
    : [item];

  // Article node connecting author, publisher, and year freshness signal.
  const article = articleNode({
    id: articleId,
    headline,
    description,
    preferredLanguage,
    datePublished: year,
    mainEntityOfPage: url,
  });

  return [...page, article, ...employmentNodes];
};
