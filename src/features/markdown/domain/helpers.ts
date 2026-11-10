// services, features, and other libraries
import { Array, flow, Option, pipe, Schema, String } from "effect";
import { experienceSeo } from "@/features/meta/domain/helpers";
import { buildExperienceMd } from "./detail-twin";
import { PreferredLanguage } from "@/domain/models";
import { absoluteUrl, decodeUrlOption, experienceMarkdownPath, experiencePath, markdownTwinUrl } from "@/features/meta/domain/urls";
import { excerpt, experienceHeadline } from "@/features/experience/domain/helpers";
import { mdBulletList, mdEmptyMarker, mdIndexEntry, mdLink } from "./format";
import { escapeMdInline } from "./escape";

// types
import type { Experience, ExperienceList } from "@/features/experience/domain/models";
import type { ExperienceLinesInput, TwinEntry } from "./models";
import type { StaticPageCopy } from "@/features/meta/domain/models";

// constants
import { BRANDED_TITLE, LANG_PARAM, NEGOTIATION_VARY_TOKENS, SITE_NAME } from "@/features/meta/domain/constants";
import { DEFAULT_LANGUAGE } from "@/domain/constants";
import { PAGE_ENTRIES, SOURCE_COPY, TWIN_ENTRY } from "./constants";

const NEGOTIATION_VARY = new Set(NEGOTIATION_VARY_TOKENS.map((token) => token.toLowerCase()));
const LIST_EXCERPT_LENGTH = 140;

// Strips language negotiation tokens from Vary header, returning null if empty
export const withoutNegotiationVary = (vary: string | null) =>
  pipe(
    Option.fromNullishOr(vary),
    Option.map((v) =>
      pipe(
        String.split(v, ","),
        Array.map(String.trim),
        Array.filter((token) => String.isNonEmpty(token) && !NEGOTIATION_VARY.has(token.toLowerCase()))
      )
    ),
    Option.filter((tokens) => tokens.length > 0),
    Option.map(Array.join(", ")),
    Option.getOrNull
  );

const experienceEntries = (experienceList: ExperienceList): ReadonlyArray<TwinEntry> =>
  experienceList.map((experience) => {
    const seo = experienceSeo({ experience, preferredLanguage: DEFAULT_LANGUAGE });

    return TWIN_ENTRY({
      name: seo.headline,
      canonical: seo.canonical,
      mdHref: seo.markdownPath,
      render: () => buildExperienceMd({ seo, translate: SOURCE_COPY.translate }),
    });
  });

export const allEntries = (experienceList: ExperienceList): ReadonlyArray<TwinEntry> => [...PAGE_ENTRIES, ...experienceEntries(experienceList)];

export const twinIdentity = (title: string, description: string, canonical: string, preferredLanguage: PreferredLanguage) =>
  ({
    title: BRANDED_TITLE(title),
    description,
    author: SITE_NAME,
    canonical,
    lang: preferredLanguage,
  }) as const;

export const pageFacts = ({ seoTitle, description, canonical, preferredLanguage, type }: StaticPageCopy) => ({
  ...twinIdentity(seoTitle, description, canonical, preferredLanguage),
  type,
});

const decodePreferredLanguage = Schema.decodeUnknownOption(PreferredLanguage);
const decodeUrlComponent = Option.liftThrowable(decodeURIComponent);

// Parses and validates the ?lang= query parameter from a request URL
export const parseLangParam = (url: string) =>
  pipe(
    decodeUrlOption(url),
    Option.flatMap(({ searchParams }) => Option.fromNullishOr(searchParams.get(LANG_PARAM))),
    Option.map(flow(String.trim, String.toLowerCase)),
    Option.flatMap(decodePreferredLanguage)
  );

// Extracts the experience slug from a markdown route pathname (e.g., /my-experience.md -> "my-experience")
export const slugFromMdPathname = (url: string) =>
  pipe(
    decodeUrlOption(url),
    Option.map(({ pathname }) => pathname.slice(1)),
    Option.filter((path) => !path.includes("/")),
    Option.filter((segment) => segment.endsWith(".md")),
    Option.map((segment) => segment.slice(0, -".md".length)),
    Option.flatMap(decodeUrlComponent),
    Option.filter(String.isNonEmpty)
  );

const experienceLine = (experience: Experience, preferredLanguage: PreferredLanguage, entry: ExperienceLinesInput["entry"]) => {
  const headline = experienceHeadline(experience, preferredLanguage);
  const summary = `${excerpt(experience.txt, LIST_EXCERPT_LENGTH)} (${experience.year})`;
  const twin = markdownTwinUrl(experienceMarkdownPath(experience.slug), preferredLanguage);

  return entry === "twin"
    ? `${mdLink(headline, twin)}: ${escapeMdInline(summary)}`
    : mdIndexEntry(headline, absoluteUrl(experiencePath(experience.slug)), twin, summary);
};

export const experienceLines = ({ experiences, entry, translate, preferredLanguage }: ExperienceLinesInput) =>
  experiences.length === 0 ? mdEmptyMarker(translate) : mdBulletList(experiences.map((experience) => experienceLine(experience, preferredLanguage, entry)));
