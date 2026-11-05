// Shared page head layout merging title, indexing directives, social cards, links and the
// JSON-LD graph. Also the experience detail head.

// services, features, and other libraries
import { Option } from "effect";
import { INDEXABLE_ROBOTS } from "@/domain/http";
import { authorLink, canonicalLink, LLMS_DISCOVERY_LINK, markdownAlternateLink } from "./link-tags";
import { experienceSeo } from "./experience-seo";
import { experienceJsonLd } from "./page-graphs";
import { jsonLdGraph } from "./merge";
import { siteNodes } from "./entities";
import { socialMeta, SocialMetaInput } from "./social-meta";

// types
import type { ExperienceHeadInput, JsonLdNodes, PageHead, SocialImage, SocialImageFacts } from "./models";

// constants
import { AUTHOR_URL, BRANDED_TITLE, GLOBAL_SOCIAL_IMAGE } from "./constants";

// Shared page head layout merging title, indexing directives, social cards, links and graph.
// `social` carries the Open Graph / Twitter fields rendered by `socialMeta`; the remaining
// fields are page-structural. Composition keeps the social contract explicit instead of
// inheriting it into the page spec.
interface PageHeadSpec {
  readonly social: SocialMetaInput;
  readonly markdownPath: string;
  readonly graph: JsonLdNodes;
  readonly authorHref?: string;
}

export const pageHead = (spec: PageHeadSpec): PageHead => {
  const { social } = spec;
  return {
    meta: [
      { title: BRANDED_TITLE(social.title) },
      { name: "description", content: social.description },
      { name: "robots", content: INDEXABLE_ROBOTS },
      ...socialMeta(social),
    ],
    links: [
      canonicalLink(social.canonical),
      markdownAlternateLink(spec.markdownPath, social.preferredLanguage),
      ...(spec.authorHref ? [authorLink(spec.authorHref)] : []),
      LLMS_DISCOVERY_LINK,
    ],
    scripts: [jsonLdGraph([...siteNodes, ...spec.graph])],
  };
};

const experienceCardImage = (headline: string, image: Option.Option<SocialImageFacts>): SocialImage =>
  Option.match(image, {
    onNone: () => GLOBAL_SOCIAL_IMAGE,
    onSome: (screenshot) => ({ ...screenshot, alt: `Screenshot of ${headline}` }),
  });

export const experienceHead = (input: ExperienceHeadInput): PageHead => {
  const seo = experienceSeo(input);

  return pageHead({
    social: {
      title: seo.headline,
      description: seo.description,
      canonical: seo.canonical,
      image: experienceCardImage(seo.headline, seo.screenshot),
      preferredLanguage: seo.preferredLanguage,
      ogType: "article",
      articleSection: seo.experience.type === "e" ? "employment" : "portfolio",
    },
    markdownPath: seo.markdownPath,
    authorHref: AUTHOR_URL,
    graph: experienceJsonLd(seo),
  });
};
