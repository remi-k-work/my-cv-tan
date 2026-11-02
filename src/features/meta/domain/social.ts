// --- OpenGraph and Twitter Card metadata ---
//
// `canonical` arrives already absolute and is what og:url publishes. Each image publishes its own
// alt: og:image and twitter:image are frequently different pictures, and a card whose alt describes
// the other card's picture announces an image it is not showing.
//
// `authorLink` is intentionally absent here: `socialMeta` builds meta tags only, while rel="author"
// is a <link> that pageHead adds separately. Keeping authorLink out of this input keeps the
// meta-tag builder's contract to exactly what it renders.

// services, features, and other libraries
import { Array, Option } from "effect";

// constants
import { AUTHOR_URL, GLOBAL_SOCIAL_IMAGE, OPEN_GRAPH_LOCALES, PUBLISHER_URL, SITE_LANGUAGES, SITE_NAME } from "./constants";

// types
import type { MetaTag } from "./models";
import type { PreferredLanguage } from "@/domain/models";

// Verified facts about a published image file. `alt` is deliberately absent, because a description
// is copy the head builder writes and the URL module must resolve a screenshot without inventing one.
export interface SocialImageFacts {
  readonly src: string;
  readonly mime: "image/jpeg" | "image/webp";
  readonly width: number;
  readonly height: number;
}

// An image as a scraped card publishes it: the verified facts plus the alt a crawler announces for
// the picture it shows. The alt travels with the image, because og:image and twitter:image can
// publish different pictures.
export interface SocialImage extends SocialImageFacts {
  readonly alt: string;
}

// og:type is page-kind aware rather than fixed to "website": an experience detail page *is*
// article-like — one authored subject carrying a headline and prose, no product to sell — and the
// GEO guide's authoritative-attribution step is exactly the `article:` block. The static pages have
// no claimed subject of their own, so they stay "website", which is what a scraper expects of a
// non-article document.
//
// `canonical` arrives already absolute: pageHead resolves it once and both the <link> and og:url
// publish the same string.
export interface SocialMetaInput {
  readonly title: string;
  readonly description: string;
  readonly canonical: string;
  readonly image: SocialImage;
  readonly preferredLanguage: PreferredLanguage;
  // Twitter falls back to the global jpeg banner, whose cards reject WebP
  readonly twitterImage?: SocialImage;
  // The Twitter handle attributed as creator and site, when the site publishes one.
  readonly twitterCreator?: string;
  readonly twitterSite?: string;
  readonly ogType?: "website" | "article";
  // schema.org article section: classifies the article as employment or portfolio work
  // so AI crawlers can bucket the subject without reading the body
  readonly articleSection?: "employment" | "portfolio";
}

// Every other locale this page is available in. og:locale:alternate is an array (ogp.me), so the
// property carries one meta tag per alternate rather than only the first — derived from
// SITE_LANGUAGES, so a third supported language is picked up here instead of silently pinning en/pl.
const alternateLocales = (preferredLanguage: PreferredLanguage) =>
  Array.filter(SITE_LANGUAGES, (language) => language !== preferredLanguage);

export const socialMeta = ({ title, description, canonical, image, preferredLanguage, twitterImage, ogType = "website", articleSection }: SocialMetaInput): ReadonlyArray<MetaTag> => {
  // The banner is the Twitter card's picture whenever the page named no separate one: X rejects
  // WebP, and the fallback is declared here rather than at each call site.
  const twitter = twitterImage ?? GLOBAL_SOCIAL_IMAGE;

  // An article card names its author and its publisher in the OpenGraph contract, so a surface
  // reading only the og: tags — with no schema.org graph to hand — still gets both sides of the
  // GEO authoritative-attribution step. Both values are resolvable profile URLs, not display names,
  // because og:article:author and og:article:publisher are read as links a surface can follow.
  // Published absent rather than with a placeholder value: `article:published_time` needs a real
  // publication date, and this site's data carries a year only, so a guessed one would be a
  // fabricated fact (the same policy the structured data follows).
  //
  // Option keeps the conditional block as data rather than a ternary returning `[]`: the presence
  // or absence of author/publisher edges is a real decision about what the page claims, not a
  // branching control flow.
  const attribution = ogType === "article"
    ? Option.some([{ property: "article:author", content: AUTHOR_URL }, { property: "article:publisher", content: PUBLISHER_URL }])
    : Option.none<ReadonlyArray<MetaTag>>();

  // article:section is a GEO classification signal: it lets AI crawlers bucket the subject
  // (employment vs portfolio) without parsing the body, and pairs with og:type "article"
  const section = ogType === "article" && articleSection
    ? Option.some([{ property: "article:section", content: articleSection }])
    : Option.none<ReadonlyArray<MetaTag>>();

  return [
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: image.src },
    // The structured-property spelling of the same picture. Facebook's crawler reads the
    // `og:image:*` family as one record and `og:image:url` as its canonical address, so a card
    // that publishes only the bare `og:image` beside the family's other members is ambiguous.
    { property: "og:image:url", content: image.src },
    { property: "og:image:alt", content: image.alt },
    { property: "og:image:type", content: image.mime },
    { property: "og:image:width", content: `${image.width}` },
    { property: "og:image:height", content: `${image.height}` },
    // Declaring the absolute https image lets scrapers fetch it without resolving an origin
    { property: "og:image:secure_url", content: image.src },
    { property: "og:type", content: ogType },
    { property: "og:url", content: canonical },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:locale", content: OPEN_GRAPH_LOCALES[preferredLanguage] },
    // og:locale:alternate is an array: one meta tag per alternate locale (ogp.me), not a single value
    ...Array.map(alternateLocales(preferredLanguage), (language) => ({ property: "og:locale:alternate", content: OPEN_GRAPH_LOCALES[language] })),
    // Option.getOrElse flattens the conditional attribution block into the tag list, publishing
    // nothing when og:type is not "article"
    ...Option.getOrElse(attribution, () => []),
    ...Option.getOrElse(section, () => []),
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: twitter.src },
    // The alt describes the picture the Twitter card actually displays, which is the banner
    { name: "twitter:image:alt", content: twitter.alt },
  ];
};
