// services, features, and other libraries
import { Array, Match, Option, pipe } from "effect";
import { isEmployment, partitionExperiences } from "@/features/experience/domain/helpers";
import { matchPreferredLanguage } from "@/domain/helpers";
import { experienceIdentity, experienceKeywords, experienceLinks, experienceSection, inlineText } from "./seo";
import { absoluteUrl } from "@/domain/urls";
import {
  articleNode,
  breadcrumb,
  collectionNode,
  collectionPartNode,
  contactPointNode,
  educationalOrganizationNode,
  employerOrganizationNode,
  experienceItemNode,
  imageObject,
  personEdge,
  webPageNode,
} from "./nodes";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { EducationList } from "@/features/education/domain/models";
import type { ExperienceList } from "@/features/experience/domain/models";
import type { ExperienceSeo, JsonLdNode, JsonLdNodes } from "./models";
import type { PageNodeType } from "./nodes";

// What the article/item graph reads from an experience's SEO identity; the full record is
// assignable, but naming the subset keeps the coupling explicit and drift-free
type ExperienceGraphInput = Pick<ExperienceSeo, "experience" | "preferredLanguage" | "canonical" | "headline" | "description" | "screenshot">;

// The page node (and its trail) every content page leads with
interface PageGraphSpec {
  readonly type: PageNodeType;
  readonly url: string;
  readonly name: string;
  readonly description: string;
  readonly preferredLanguage: PreferredLanguage;
  readonly mainEntity?: JsonLdNode;
  readonly primaryImageOfPage?: JsonLdNode;
  readonly relatedLinks?: ReadonlyArray<string>;
}

// The localized copy the static page graph assemblers read
interface LocalizedCopy {
  readonly pageName: string;
  readonly description: string;
  readonly preferredLanguage: PreferredLanguage;
}

// constants
import { CONTACT_PATH, EDUCATION_PATH } from "@/domain/constants";
import { CONTACT_EMAIL, EXPERIENCE_LIST_ID, GLOBAL_SOCIAL_IMAGE, HOME_URL, PERSON_ID, PORTFOLIO_LIST_ID, PROFILE_ID } from "@/domain/site";

// Matches the og:image published on static pages so JSON-LD extractors see the same sized asset
const STATIC_PRIMARY_IMAGE = imageObject(GLOBAL_SOCIAL_IMAGE.src, GLOBAL_SOCIAL_IMAGE.width, GLOBAL_SOCIAL_IMAGE.height);

// Builds the page node and its breadcrumb trail from the canonical identity every other surface cites
const pageGraph = ({ type, url, name, description, preferredLanguage, mainEntity, primaryImageOfPage, relatedLinks }: PageGraphSpec): JsonLdNodes => [
  webPageNode({
    type,
    id: url,
    url,
    name,
    description,
    preferredLanguage,
    breadcrumb: true,
    mainEntity,
    primaryImageOfPage,
    relatedLinks,
  }),
  breadcrumb(preferredLanguage, url, name),
];

const experienceCollection = ({
  id,
  name,
  experiences,
  preferredLanguage,
}: {
  readonly id: string;
  readonly name: string;
  readonly experiences: ExperienceList;
  readonly preferredLanguage: PreferredLanguage;
}): Option.Option<JsonLdNode> =>
  Array.match(experiences, {
    onEmpty: () => Option.none(),
    onNonEmpty: (entries) =>
      Option.some(
        collectionNode({
          id,
          name,
          preferredLanguage,
          parts: Array.map(entries, (experience) => {
            // Derive URL and headline through the shared identity projection without building unused detail metadata
            const { canonical, headline } = experienceIdentity({ experience, preferredLanguage });
            return collectionPartNode(canonical, headline);
          }),
        })
      ),
  });

export const experienceCollections = (employment: ExperienceList, projects: ExperienceList, preferredLanguage: PreferredLanguage): JsonLdNodes =>
  pipe(
    [
      [EXPERIENCE_LIST_ID, matchPreferredLanguage(preferredLanguage, "Experience", "Doświadczenie"), employment],
      [PORTFOLIO_LIST_ID, matchPreferredLanguage(preferredLanguage, "Portfolio Projects", "Projekty do Portfolio"), projects],
    ] as const,
    Array.map(([id, name, experiences]) => experienceCollection({ id, name, experiences, preferredLanguage })),
    Array.getSomes
  );

export const schoolSubgraph = (url: string, educationList: EducationList): JsonLdNodes =>
  Array.match(educationList, {
    onEmpty: () => [],
    onNonEmpty: (entries) => {
      const schoolNodes = Array.map(entries, ({ name, info, location }, index) =>
        educationalOrganizationNode({
          id: `${url}#school-${index + 1}`,
          name,
          // Preserve full study fields (e.g. degree/major) instead of truncating at snippet length
          description: inlineText(info),
          address: location,
        })
      );

      return [...schoolNodes, personEdge({ alumniOf: Array.map(schoolNodes, ({ "@id": id }) => ({ "@id": id })) })];
    },
  });

export const educationJsonLd = ({
  pageName,
  description,
  educationList,
  preferredLanguage,
}: LocalizedCopy & { readonly educationList: EducationList }): JsonLdNodes => {
  const url = absoluteUrl(EDUCATION_PATH);
  const schools = schoolSubgraph(url, educationList);

  return [
    ...pageGraph({
      type: "CollectionPage",
      url,
      name: pageName,
      description,
      preferredLanguage,
      mainEntity: { "@id": PERSON_ID },
      primaryImageOfPage: STATIC_PRIMARY_IMAGE,
    }),
    ...schools,
  ];
};

export const contactJsonLd = ({ pageName, description, preferredLanguage }: LocalizedCopy): JsonLdNodes => {
  const url = absoluteUrl(CONTACT_PATH);
  const contactPointId = `${url}#contact-point`;

  return [
    ...pageGraph({
      type: "ContactPage",
      url,
      name: pageName,
      description,
      preferredLanguage,
      mainEntity: { "@id": PERSON_ID },
      primaryImageOfPage: STATIC_PRIMARY_IMAGE,
    }),
    personEdge({ contactPoint: { "@id": contactPointId } }),
    contactPointNode(contactPointId, url, CONTACT_EMAIL),
  ];
};

export const experienceJsonLd = ({ experience, preferredLanguage, canonical: url, headline, description, screenshot }: ExperienceGraphInput): JsonLdNodes => {
  const { role, company, txt } = experience;

  const employment = isEmployment(experience);

  const itemId = `${url}#${employment ? "organization-role" : "project"}`;
  const articleId = `${url}#article`;

  const image = pipe(
    screenshot,
    Option.map(({ src, width, height }) => imageObject(src, width, height)),
    Option.getOrUndefined
  );
  const keywords = experienceKeywords(experience);
  const links = experienceLinks(experience);
  const repository = Option.getOrUndefined(links.repository);
  // Projects publish gitHubLink on SoftwareSourceCode.codeRepository; employment roles carry no codeRepository so WebPage.relatedLink exposes it
  const relatedSources = employment ? [links.repository, links.live, links.video] : [links.live, links.video];
  const relatedLinks = pipe(relatedSources, Array.getSomes, Array.dedupe);
  const item = experienceItemNode({
    employment,
    id: itemId,
    url,
    role: inlineText(role),
    description,
    preferredLanguage,
    keywords,
    image,
    repository,
  });

  const itemNodes: JsonLdNodes = Match.value(employment).pipe(
    Match.when(true, () => [
      // The employer-to-role-to-person path also represents historical employment honestly
      employerOrganizationNode(`${url}#organization`, inlineText(company), itemId),
      item,
    ]),
    Match.when(false, () => [item]),
    Match.exhaustive
  );

  // Publish the full narrative on Article.articleBody so JSON-LD extractors receive complete context beyond the 160-char snippet
  const article = articleNode({
    id: articleId,
    headline,
    description,
    articleBody: txt,
    preferredLanguage,
    keywords,
    articleSection: experienceSection(experience),
    about: itemId,
    mainEntityOfPage: url,
    image,
  });

  return [
    ...pageGraph({
      type: "WebPage",
      url,
      name: headline,
      description,
      preferredLanguage,
      mainEntity: { "@id": articleId },
      primaryImageOfPage: image,
      relatedLinks,
    }),
    article,
    ...itemNodes,
  ];
};

export const homeJsonLd = ({
  pageName,
  description,
  experienceList,
  preferredLanguage,
}: LocalizedCopy & { readonly experienceList: ExperienceList }): JsonLdNodes => {
  const [employment, projects] = partitionExperiences(experienceList);
  const collections = experienceCollections(employment, projects, preferredLanguage);
  const collectionRefs = Array.map(collections, ({ "@id": id }) => ({ "@id": id }));

  return [
    webPageNode({
      type: "ProfilePage",
      id: PROFILE_ID,
      url: HOME_URL,
      name: pageName,
      description,
      preferredLanguage,
      mainEntity: { "@id": PERSON_ID },
      primaryImageOfPage: STATIC_PRIMARY_IMAGE,
      // Connect the profile to its collections so parsers need not infer their relationship
      hasPart: collectionRefs,
    }),
    ...collections,
  ];
};
