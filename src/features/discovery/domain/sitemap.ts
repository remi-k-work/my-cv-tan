// services, features, and other libraries
import { Array, HashMap, Option, String, flow, pipe } from "effect";
import { isCrawlablePath } from "./robots";
import { experienceIdentity, experienceScreenshot } from "@/features/experience/domain/seo";
import { absoluteUrl } from "@/domain/urls";

// types
import type { ExperienceList } from "@/features/experience/domain/models";
import type { ImageFacts } from "@/domain/models";

// constants
import { DEFAULT_LANGUAGE } from "@/domain/constants";
import { DOWNLOADABLE_DOCUMENT_PATHS } from "@/domain/discovery";
import { STATIC_PAGE_PATHS } from "@/domain/pages";

const STATIC_PATHS: ReadonlyArray<string> = [...STATIC_PAGE_PATHS, ...DOWNLOADABLE_DOCUMENT_PATHS];
const XML_ENTITIES: HashMap.HashMap<string, string> = HashMap.fromIterable([
  ["&", "&amp;"],
  ["<", "&lt;"],
  [">", "&gt;"],
  ['"', "&quot;"],
  ["'", "&apos;"],
]);
// oxlint-disable-next-line no-control-regex -- the ranges are the XML 1.0 character production, not accidental control characters
const XML_INVALID_CHARACTERS = /[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/gu;
const XML_SPECIAL_CHARACTERS = /[&<>"']/g;

const replaceXmlEntities = (value: string) =>
  value.replace(XML_SPECIAL_CHARACTERS, (character) => Option.getOrElse(HashMap.get(XML_ENTITIES, character), () => character));

// XML 1.0 cannot represent these controls or lone surrogates, even as entity references
const escapeXml = flow(String.replace(XML_INVALID_CHARACTERS, ""), replaceXmlEntities);

const experienceImages = (headline: string, screenshot: Option.Option<ImageFacts>) =>
  pipe(
    screenshot,
    Option.map(({ src }) => [
      "  <image:image>",
      `    <image:loc>${escapeXml(src)}</image:loc>`,
      `    <image:title>${escapeXml(headline)}</image:title>`,
      "  </image:image>",
    ]),
    Option.getOrElse(Array.empty<string>)
  );

// Reuses each page's SEO identity so sitemap URLs and image metadata cannot drift from HTML or Markdown
export const buildSitemapXml = (experiences: ExperienceList) => {
  const staticEntries = Array.map(STATIC_PATHS, (path) => ({ path, loc: absoluteUrl(path), images: Array.empty<string>() }));
  const experienceEntries = Array.map(experiences, (experience) => {
    const identity = experienceIdentity({ experience, preferredLanguage: DEFAULT_LANGUAGE });
    return {
      path: identity.path,
      loc: identity.canonical,
      images: experienceImages(identity.headline, experienceScreenshot(experience.imageName)),
    };
  });

  // Static pages win collisions, and disallowed paths are excluded using the same policy as robots.txt
  const entries = pipe(
    staticEntries,
    Array.appendAll(experienceEntries),
    Array.filter(({ path }) => isCrawlablePath(path)),
    Array.dedupeWith((left, right) => left.loc === right.loc)
  );

  const urlElement = ({ loc, images }: (typeof entries)[number]) => ["<url>", `  <loc>${escapeXml(loc)}</loc>`, ...images, "</url>"];

  return Array.join(
    [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
      ...Array.flatMap(entries, urlElement),
      "</urlset>",
    ],
    "\n"
  );
};
