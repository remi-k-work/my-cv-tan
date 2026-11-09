// services, features, and other libraries
import { Array, Option, Predicate, Record, String } from "effect";
import { matchPreferredLanguage } from "@/domain/helpers";
import { excerpt, experienceHeadline, experienceImagePath } from "@/features/experience/domain/helpers";
import { absoluteUrl, experienceMarkdownPath, experiencePath } from "./urls";
import { canonicalLink } from "./link-tags";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { ExperienceHeadInput, ExperienceSeo, JsonLdNode, JsonLdObject, JsonLdScript, PageHead, SocialImageFacts } from "./models";

// constants
import {
  BRANDED_TITLE,
  CACHEABLE_HEADERS,
  CV_EN_HREF,
  CV_PL_HREF,
  MACHINE_HEADERS,
  META_DESCRIPTION_LENGTH,
  NEGOTIATION_VARY_TOKENS,
  NOINDEX_HEADERS,
  NOT_FOUND_COPY,
  SERVICE_UNAVAILABLE_HEADERS,
  SITE_NODES,
  SITEMAP_HEADERS,
  SITEMAP_UNAVAILABLE_XML,
  TXT_HEADERS,
  UNAVAILABLE_COPY,
} from "./constants";
import { SCREENSHOT_HEIGHT, SCREENSHOT_WIDTH } from "@/features/experience/domain/constants";
import { NOINDEX_FOLLOW } from "@/domain/http";
import { DEFAULT_LANGUAGE } from "@/domain/constants";

export const cvPdfHref = (preferredLanguage: PreferredLanguage) => matchPreferredLanguage(preferredLanguage, CV_EN_HREF, CV_PL_HREF);

export const experienceScreenshot = (imageName: string): Option.Option<SocialImageFacts> => {
  const name = String.trim(imageName);

  return String.isNonEmpty(name)
    ? Option.some({
        src: absoluteUrl(experienceImagePath(name, "a")),
        mime: "image/webp",
        width: SCREENSHOT_WIDTH,
        height: SCREENSHOT_HEIGHT,
      })
    : Option.none();
};

export const experienceSeo = ({ experience, preferredLanguage }: ExperienceHeadInput): ExperienceSeo => {
  const path = experiencePath(experience.slug);

  return {
    experience,
    preferredLanguage,
    path,
    canonical: absoluteUrl(path),
    markdownPath: experienceMarkdownPath(experience.slug),
    headline: experienceHeadline(experience, preferredLanguage),
    description: excerpt(experience.txt, META_DESCRIPTION_LENGTH),
    screenshot: experienceScreenshot(experience.imageName),
  };
};

const degradedCopy = (preferredLanguage: PreferredLanguage, notFound: boolean) => (notFound ? NOT_FOUND_COPY : UNAVAILABLE_COPY)[preferredLanguage];

// Builds a noindex head for not-found (404) or data unavailable (503) states
export const fallbackHead = (pagePath: string | undefined, preferredLanguage: PreferredLanguage = DEFAULT_LANGUAGE): PageHead => {
  const notFound = pagePath === undefined;
  const { title, description } = degradedCopy(preferredLanguage, notFound);

  return {
    meta: [{ title: BRANDED_TITLE(title) }, { name: "robots", content: NOINDEX_FOLLOW }, { name: "description", content: description }],
    links: notFound ? [] : [canonicalLink(absoluteUrl(pagePath))],
    scripts: [jsonLdGraph(SITE_NODES)],
  };
};

// Escapes '<' so serialized content cannot close the HTML script tag
const jsonLdScript = (data: JsonLdObject): JsonLdScript => ({
  type: "application/ld+json",
  children: JSON.stringify(data).replace(/</g, "\\u003C"),
});

// Merges nodes by @id, preserving initial order and letting subsequent defined fields override
export const jsonLdGraph = (nodes: ReadonlyArray<JsonLdNode>): JsonLdScript => {
  const { graph } = Array.reduce(nodes, { graph: [] as Array<JsonLdNode>, indexById: new Map<string, number>() }, (acc, node) => {
    const defined = Record.filter(node, Predicate.isNotUndefined);
    const id = defined["@id"];

    if (!Predicate.isString(id)) {
      acc.graph.push(defined);
      return acc;
    }

    const existingIndex = acc.indexById.get(id);
    if (existingIndex === undefined) {
      acc.indexById.set(id, acc.graph.length);
      acc.graph.push(defined);
    } else {
      acc.graph[existingIndex] = { ...acc.graph[existingIndex], ...defined };
    }

    return acc;
  });

  return jsonLdScript({ "@context": "https://schema.org", "@graph": graph });
};

// Base response headers for rendered HTML documents
export const documentHeaders = (preferredLanguage: PreferredLanguage) =>
  ({
    ...MACHINE_HEADERS,
    "Content-Language": preferredLanguage,
    Vary: NEGOTIATION_VARY_TOKENS.join(", "),
  }) as const;

// HTTP response envelope helpers for plain-text and XML discovery endpoints
const instructionsHeaders = (contentLocation?: string) => ({
  ...TXT_HEADERS,
  ...CACHEABLE_HEADERS,
  ...NOINDEX_HEADERS,
  ...(contentLocation === undefined ? {} : { "Content-Location": contentLocation }),
});

export const txtResponse = (body: string, contentLocation?: string) => new Response(body, { status: 200, headers: instructionsHeaders(contentLocation) });
export const txtUnavailableResponse = (body: string) => new Response(body, { status: 503, headers: { ...TXT_HEADERS, ...SERVICE_UNAVAILABLE_HEADERS } });
export const sitemapResponse = (xml: string) => new Response(xml, { status: 200, headers: { ...SITEMAP_HEADERS, ...CACHEABLE_HEADERS, ...NOINDEX_HEADERS } });
export const sitemapUnavailableResponse = () =>
  new Response(SITEMAP_UNAVAILABLE_XML, { status: 503, headers: { ...SITEMAP_HEADERS, ...SERVICE_UNAVAILABLE_HEADERS } });
