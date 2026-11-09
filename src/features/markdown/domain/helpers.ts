// services, features, and other libraries
import { Array, Option, pipe, String } from "effect";
import { experienceSeo } from "@/features/meta/domain/helpers";
import { buildExperienceMd } from "./detail-twin";

// types
import type { ExperienceList } from "@/features/experience/domain/models";
import type { TwinEntry } from "./models";

// constants
import { NEGOTIATION_VARY_TOKENS } from "@/features/meta/domain/constants";
import { DEFAULT_LANGUAGE } from "@/domain/constants";
import { PAGE_ENTRIES, SOURCE_COPY, twinEntry } from "./constants";

const NEGOTIATION_VARY = new Set(NEGOTIATION_VARY_TOKENS.map((token) => token.toLowerCase()));

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

    return twinEntry({
      name: seo.headline,
      canonical: seo.canonical,
      mdHref: seo.markdownPath,
      render: () => buildExperienceMd({ seo, translate: SOURCE_COPY.translate }),
    });
  });

export const allEntries = (experienceList: ExperienceList): ReadonlyArray<TwinEntry> => [...PAGE_ENTRIES, ...experienceEntries(experienceList)];
