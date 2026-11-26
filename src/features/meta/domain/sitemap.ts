// services, features, and other libraries
import { Array, Option, Record, String, pipe } from "effect";
import { absoluteUrl } from "./urls";
import { experienceSeo } from "./seo";

// types
import type { ExperienceList } from "@/features/experience/domain/models";
import type { ExperienceSeo } from "./models";

// constants
import { DEFAULT_LANGUAGE } from "@/domain/constants";
import { DOWNLOADABLE_DOCUMENT_PATHS } from "./discovery";
import { STATIC_PAGE_PATHS } from "./pages";

const STATIC_URLS = Array.map([...STATIC_PAGE_PATHS, ...DOWNLOADABLE_DOCUMENT_PATHS], absoluteUrl);
const XML_ENTITIES: Readonly<Record<string, string>> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};
// oxlint-disable-next-line no-control-regex -- the ranges are the XML 1.0 character production, not accidental control characters
const XML_INVALID_CHARACTERS = /[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/gu;
const XML_SPECIAL_CHARACTERS = /[&<>"']/g;

// XML 1.0 cannot represent these controls or lone surrogates, even as entity references
const escapeXml = (value: string) =>
  pipe(value, String.replace(XML_INVALID_CHARACTERS, "")).replace(XML_SPECIAL_CHARACTERS, (character) =>
    pipe(
      Record.get(XML_ENTITIES, character),
      Option.getOrElse(() => character)
    )
  );

const experienceImages = (seo: ExperienceSeo) =>
  pipe(
    seo.screenshot,
    Option.map(({ src }) => [
      "  <image:image>",
      `    <image:loc>${escapeXml(src)}</image:loc>`,
      `    <image:title>${escapeXml(seo.headline)}</image:title>`,
      "  </image:image>",
    ]),
    Option.getOrElse(Array.empty<string>)
  );

// Reuses each page's SEO identity so sitemap URLs and image metadata cannot drift from HTML or Markdown
export const buildSitemapXml = (experiences: ExperienceList) => {
  const staticEntries = Array.map(STATIC_URLS, (loc) => ({ loc, images: Array.empty<string>() }));
  const experienceEntries = Array.map(experiences, (experience) => {
    const seo = experienceSeo({ experience, preferredLanguage: DEFAULT_LANGUAGE });
    return { loc: seo.canonical, images: experienceImages(seo) };
  });

  // Static pages win collisions, so malformed input cannot attach an experience image to a static URL
  const entries = pipe(
    staticEntries,
    Array.appendAll(experienceEntries),
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
