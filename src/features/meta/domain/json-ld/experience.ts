// --- Detail structured data: a WebPage node linked to an OrganizationRole or SoftwareSourceCode main entity ---

// services, features, and other libraries
import { Array, Option } from "effect";
import { experienceHeadline, excerpt } from "@/features/experience/domain/helpers";
import { articleNode, imageObject, pageGraph, personEdge } from "./core";
import { experienceScreenshot } from "../url";
import { absoluteUrl, experiencePath } from "../url";

// types
import type { JsonLdNodes } from "./core";
import type { ExperienceHeadInput } from "../models";

// constants
import { META_DESCRIPTION_LENGTH, PERSON_ID, PUBLISHER_ID } from "../constants";

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

  // Only claim an image when an actual screenshot asset is present: JSON.stringify drops the
  // undefined, so a screenshot-less entity never claims a picture the page cannot show
  const screenshot = Option.map(experienceScreenshot(imageName), ({ src, width, height }) => imageObject(src, width, height));

  // datePublished is the factual year the source data carries — never a guessed ISO date. It gives
  // AI crawlers a citable freshness signal without parsing the body, matching the Markdown twin's
  // frontmatter which publishes the same year as datePublished.
  // The WebPage's mainEntity is the Article node: the page describes an article about one subject,
  // and the Article in turn references the role/project as its subject. This gives AI crawlers an
  // article-shaped entry point they can cite without parsing the body.
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

  // Source repositories map to SoftwareSourceCode; employment maps to OrganizationRole linked to the
  // person. The type discriminant (gitHubLink presence) lets AI systems distinguish open-source
  // projects from proprietary creative work without reading the body.
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
        // A screenshot-less project claims no image; JSON.stringify drops the undefined
        image: Option.getOrUndefined(screenshot),
        url,
        mainEntityOfPage: { "@id": url },
        inLanguage: preferredLanguage,
        creator: { "@id": PERSON_ID },
        publisher: { "@id": PUBLISHER_ID },
        // skillsUsed is a NonEmptyArray, so this is never an empty claim
        keywords: Array.join(skillsUsed, ", "),
        // schema.org's link to the source repository, single-sourced from the content's GitHub URL
        codeRepository: gitHubLink,
      };

  // Employment nodes link the reciprocal Organization entity for employer graph resolution, and the
  // Person edge closes the triangle so "works for" is readable from the person side too.
  //
  // The trail already travels with the page node (see pageGraph), so the employment branch adds only
  // the entities an employment page has that a project page does not.
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

  // The Article node: headline, author, publisher, and a factual year-only freshness signal.
  // It references the page (isPartOf) and the subject (mainEntity) so the graph triangle closes.
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
